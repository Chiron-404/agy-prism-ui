import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildHeatmapData,
  createHeatmapAggregator,
  estimateRequestCostUsd,
  readConversationHeatmapRecord,
} from '../agy-prism-ui/sidecars/agy_prism_ui/heatmap.mjs';
import { createHeatmapRenderer } from '../agy-prism-ui/sidecars/agy_prism_ui/heatmap_ui.mjs';

function encodeVarint(value) {
  let v = BigInt(value);
  const out = [];
  while (v >= 0x80n) {
    out.push(Number(v & 0x7fn) | 0x80);
    v >>= 7n;
  }
  out.push(Number(v));
  return Buffer.from(out);
}

function fieldVarint(fn, value) {
  return Buffer.concat([encodeVarint((fn << 3) | 0), encodeVarint(value)]);
}

function fieldBytes(fn, buf) {
  return Buffer.concat([encodeVarint((fn << 3) | 2), encodeVarint(buf.length), buf]);
}

function buildStepMeta(sec) {
  return fieldBytes(1, fieldVarint(1, sec));
}

function buildGenRow({ stepIndices = [], modelId = '', modelName = '', uncachedIn = 0, cachedIn = 0, think = 0, reply = 0 }) {
  const usage = Buffer.concat([
    fieldVarint(2, uncachedIn),
    fieldVarint(3, think + reply),
    fieldVarint(5, cachedIn),
    fieldVarint(9, think),
    fieldVarint(10, reply),
  ]);
  const m1 = Buffer.concat([
    fieldBytes(4, usage),
    modelId ? fieldBytes(19, Buffer.from(modelId, 'utf8')) : Buffer.alloc(0),
    modelName ? fieldBytes(21, Buffer.from(modelName, 'utf8')) : Buffer.alloc(0),
  ]);
  const packedSteps = Buffer.concat(stepIndices.map(s => encodeVarint(s)));
  return Buffer.concat([
    fieldBytes(1, m1),
    packedSteps.length ? fieldBytes(2, packedSteps) : Buffer.alloc(0),
  ]);
}

test('buildHeatmapData computes totals, streaks, 52-week quantiles, 14-day bars, and 12-month cumulative series', () => {
  const nowMs = new Date(2026, 10, 26, 12, 0, 0).getTime();
  const records = [
    {
      id: 'c1',
      source: 'app',
      isSubagent: false,
      days: {
        '2026-11-23': { in: 1_000_000, cache: 9_000_000, out: 100_000, think: 40_000, total: 10_100_000, costUsd: 5.5, reqs: 4 },
        '2026-11-24': { in: 2_000_000, cache: 18_000_000, out: 200_000, think: 80_000, total: 20_200_000, costUsd: 11.0, reqs: 6 },
        '2026-11-25': { in: 500_000, cache: 4_500_000, out: 50_000, think: 20_000, total: 5_050_000, costUsd: 2.75, reqs: 2 },
        '2026-11-26': { in: 3_000_000, cache: 27_000_000, out: 300_000, think: 120_000, total: 30_300_000, costUsd: 16.5, reqs: 8 },
      },
    },
    {
      id: 'c2',
      source: 'cli',
      isSubagent: true,
      days: {
        '2026-10-15': { in: 100_000, cache: 900_000, out: 20_000, think: 5_000, total: 1_020_000, costUsd: 0.6, reqs: 2 },
        '2026-11-26': { in: 500_000, cache: 4_500_000, out: 100_000, think: 30_000, total: 5_100_000, costUsd: 2.2, reqs: 3 },
      },
    },
  ];

  const data = buildHeatmapData(records, nowMs);
  const all = data.sources.all;
  assert.equal(all.totals.totalTokens, 71_770_000);
  assert.equal(all.totals.conversationCount, 2);
  assert.equal(all.totals.mainCount, 1);
  assert.equal(all.totals.subagentCount, 1);
  assert.equal(all.totals.cacheHitRate, 90);
  assert.equal(all.activity.activeDays, 5);
  assert.equal(all.activity.currentStreak, 4);
  assert.equal(all.activity.longestStreak, 4);
  assert.equal(all.activity.peakDay.d, '2026-11-26');
  assert.equal(all.activity.peakDay.t, 35_400_000);
  assert.equal(all.weeks52.days.length, 364);
  assert.equal(all.last14Days.length, 14);
  assert.equal(all.last14Days.at(-1).d, '2026-11-26');
  assert.equal(all.monthly.length, 12);
  assert.equal(all.monthly.at(-1).m, '2026-11');
  assert.equal(all.monthly.at(-1).cum, 71_770_000);

  const nov26Cell = all.weeks52.days.find(d => d.d === '2026-11-26');
  assert.equal(nov26Cell.l, 5);
  const nov25Cell = all.weeks52.days.find(d => d.d === '2026-11-25');
  assert.ok(nov25Cell.l >= 1 && nov25Cell.l <= 4);

  assert.equal(data.counts.all, 2);
  assert.equal(data.counts.app, 1);
  assert.equal(data.counts.cli, 1);
  assert.equal(data.counts.ide, 0);
  assert.equal(data.sources.cli.totals.subagentCount, 1);
  assert.equal(data.byConversation.c1.t, 65_650_000);
  const [sy, sm, sd] = all.weeks52.days[0].d.split('-').map(Number);
  assert.equal(new Date(sy, sm - 1, sd).getDay(), 0);
});

test('readConversationHeatmapRecord and createHeatmapAggregator decode SQLite protobuf rows and detect subagents', () => {
  const dir = mkdtempSync(join(tmpdir(), 'agy-hm-'));
  const appDir = join(dir, 'app');
  mkdirSync(appDir, { recursive: true });
  const dbPath = join(appDir, '11111111-1111-1111-1111-111111111111.db');
  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      CREATE TABLE steps (idx INTEGER PRIMARY KEY, metadata BLOB);
      CREATE TABLE gen_metadata (idx INTEGER PRIMARY KEY, data BLOB);
      CREATE TABLE parent_references (id INTEGER PRIMARY KEY);
      INSERT INTO parent_references (id) VALUES (1);
    `);
    const sec = Math.floor(new Date(2026, 10, 26, 9, 30, 0).getTime() / 1000);
    db.prepare('INSERT INTO steps (idx, metadata) VALUES (?, ?)').run(0, buildStepMeta(sec));
    db.prepare('INSERT INTO gen_metadata (idx, data) VALUES (?, ?)').run(0, buildGenRow({
      stepIndices: [0],
      modelId: 'gemini-4-neon',
      modelName: 'Gemini 4 Neon (High)',
      uncachedIn: 100_000,
      cachedIn: 900_000,
      think: 1_500,
      reply: 500,
    }));
  } finally {
    db.close();
  }

  try {
    const rec = readConversationHeatmapRecord(dbPath, 'app');
    assert.equal(rec.isSubagent, true);
    assert.equal(rec.days['2026-11-26'].total, 1_002_000);
    assert.ok(Math.abs(estimateRequestCostUsd('gemini-4-neon', '', { uncachedIn: 50_000, cachedIn: 50_000, totalOut: 2_000 }) - (2.5 * 0.05 + 0.25 * 0.05 + 15.0 * 0.002)) < 1e-6);
    assert.ok(Math.abs(estimateRequestCostUsd('gemini-4-neon', '', { uncachedIn: 100_000, cachedIn: 900_000, totalOut: 2_000 }) - (5.0 * 0.1 + 0.5 * 0.9 + 22.5 * 0.002)) < 1e-6);

    const agg = createHeatmapAggregator({
      sources: [{ key: 'app', dir: appDir }],
      summariesPath: '',
      ttlMs: 60_000,
    });
    const snap1 = agg.getSnapshot({ nowMs: new Date(2026, 10, 26, 10, 0, 0).getTime() });
    assert.equal(snap1.sources.all.totals.totalTokens, 1_002_000);
    assert.equal(snap1.sources.all.totals.subagentCount, 1);
    const snap2 = agg.getSnapshot({ nowMs: new Date(2026, 10, 26, 10, 0, 5).getTime() });
    assert.strictEqual(snap2, snap1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('createHeatmapRenderer defaults to blue theme and renders both full dashboard and compact home card', () => {
  const ui = createHeatmapRenderer();
  assert.equal(ui.DEFAULT_THEME, 'blue');
  assert.deepEqual(Object.keys(ui.THEMES), ['blue', 'sunset', 'green', 'purple', 'aurora', 'ocean']);
  assert.deepEqual(Object.values(ui.THEMES).map(t => t.label), ['Cobalt', 'Ember', 'Emerald', 'Nebula', 'Aurora', 'Glacier']);
  for (const key of ['blue', 'aurora', 'ocean', 'sunset', 'green', 'purple']) {
    assert.equal(ui.THEMES[key].light.length, 6);
    assert.equal(ui.THEMES[key].dark.length, 6);
  }
  const data = buildHeatmapData([
    {
      id: 'c1',
      source: 'app',
      isSubagent: false,
      days: { '2026-11-26': { in: 500_000, cache: 4_500_000, out: 50_000, think: 20_000, total: 5_050_000, costUsd: 3.1, reqs: 5 } },
    },
  ], new Date(2026, 10, 26, 12, 0, 0).getTime());

  const full = ui.buildFullHtml(data, { themeName: 'blue', dark: false, showClose: true });
  assert.ok(full.includes('Insights'));
  assert.ok(full.includes('52 周活跃热力图'));
  assert.ok(full.includes('>Sun<'));
  assert.ok(!full.includes('>Mon<'));
  assert.ok(full.includes('>Tue<'));
  assert.ok(full.includes('>Thu<'));
  assert.ok(full.includes('>Sat<'));
  assert.ok(!full.includes('data-hm-detail'));
  assert.ok(full.includes('#155bd4') || full.includes('#0b2f7a'));
  assert.ok(full.includes('近 14 天用量'));
  assert.ok(!full.includes('>0</text>'));
  assert.ok(full.includes('hm-kpi-hover'));
  assert.ok(full.includes('hm-kpi-pop'));
  assert.ok(full.includes('非缓存输入 (In)'));
  assert.ok(full.includes('缓存读取 (Cache)'));
  assert.ok(full.includes('输出 (Out)'));
  assert.ok(full.includes('月度趋势与累计曲线'));

  const optHtml = ui.buildFullHtml(data, { themeName: 'blue', dark: false, showClose: true, hasOpticalControl: true, optOpen: false });
  assert.ok(optHtml.includes('data-open="false"'));
  assert.ok(optHtml.includes('.hm-opt-pop[data-open="true"]'));
  for (const lbl of ['白昼', '晨光', '午夜', '暮色', '棱镜流光', '玻璃质感', '渐现动效']) {
    assert.ok(optHtml.includes(lbl), `missing updated optical label: ${lbl}`);
  }
  for (const old of ['冷晶', '暖白', '黑曜', '暖炭', '棱镜微光', '玻璃切面', '水墨动效']) {
    assert.ok(!optHtml.includes(old), `stale optical label still present: ${old}`);
  }

  const auroraFull = ui.buildFullHtml(data, { themeName: 'aurora', dark: false, showClose: true });
  assert.ok(auroraFull.includes('linearGradient'));
  assert.ok(auroraFull.includes('#7e22ce'));

  const home = ui.buildHomeHtml(data, { themeName: 'blue', dark: false, collapsed: false });
  assert.ok(home.includes('Insights'));
  assert.ok(!home.includes('完整看板 →'));
  assert.ok(home.includes('data-hm-home="toggle"'));
  assert.equal((home.match(/class="hm-cell"/g) || []).length, 84);
  assert.ok(home.includes('5.05M'));
  assert.ok(!home.includes('(In '));
  assert.ok(!home.includes('<title>'));
  assert.ok(home.includes('data-hm-hover-tip'));
  assert.ok(home.includes('data-hm-day-pop'));
  assert.ok(home.includes('.hm-home-card::after'));
  assert.ok(home.includes('data-collapsed="0"'));
  assert.ok(home.includes('hm-home-swap'));
  assert.ok(!home.includes('.hm-home-card:hover::before'));
  assert.ok(!home.includes('.hm-home-card:hover::after'));
  assert.ok(home.includes('var(--hm-near-alpha, 0)'));
  assert.ok(home.includes('filter: blur(9px)'));
  assert.ok(home.includes('border-radius: 21px'));
  assert.ok(!home.includes('z-index: 25;'));
  assert.ok(home.includes('font-weight: 500'));
  assert.ok(!home.includes('data-hm-theme='));
  assert.ok(!full.includes('<title>'));
  assert.ok(full.includes('data-hm-hover-tip'));
  assert.ok(full.includes('data-hm-day-pop'));

  const homeCollapsed = ui.buildHomeHtml(data, { themeName: 'blue', dark: false, collapsed: true });
  assert.ok(homeCollapsed.includes('data-collapsed="1"'));
  assert.ok(!homeCollapsed.includes('完整看板 →'));
  assert.ok(!homeCollapsed.includes('(In '));
  assert.ok(!homeCollapsed.includes('<title>'));
  assert.ok(homeCollapsed.includes('data-hm-hover-tip'));
  assert.ok(homeCollapsed.includes('data-hm-day-pop'));
  assert.equal((homeCollapsed.match(/class="hm-cell"/g) || []).length, 14);
});

test('estimateRequestCostUsd prioritizes Hydrogen family over generic Orchestrator label and heatmap_ui renders r/th fields', () => {
  const directCost = estimateRequestCostUsd('gemini-4-hydrogen', 'Gemini 4 Hydrogen (High)', { uncachedIn: 0, cachedIn: 0, totalOut: 1_000_000 });
  const orchWorkerCost = estimateRequestCostUsd('gemini-4-hydrogen-worker', 'Gemini 4 Hydrogen (Orchestrator)', { uncachedIn: 0, cachedIn: 0, totalOut: 1_000_000 });
  assert.ok(Math.abs(directCost - 3.75) < 1e-6);
  assert.ok(Math.abs(orchWorkerCost - 3.75) < 1e-6);

  const ui = createHeatmapRenderer();
  assert.equal(ui.version, 24);
  assert.equal(typeof ui.cleanupHeatmapRoot, 'function');
  const src = createHeatmapRenderer.toString();
  assert.ok(src.includes('day.r ?? day.reqs'));
  assert.ok(src.includes('day.th ?? day.k'));
  assert.ok(src.includes('hmOrigZ'));
  assert.ok(src.includes('_hmLastPointer'));
  assert.ok(src.includes('applyNearAt'));
  assert.ok(src.includes('buildHomeBodyHtml'));
  assert.ok(src.includes('refreshPointer'));
});

test('renderHomeHeatmapCard toggles in place, survives background refresh and storage errors, cancels rAF, and cleans up detached hosts', () => {
  const prevDoc = globalThis.document;
  const prevLs = globalThis.localStorage;
  const prevRaf = globalThis.requestAnimationFrame;
  const prevCaf = globalThis.cancelAnimationFrame;
  const prevMm = globalThis.matchMedia;

  const makeEl = (tag = 'div', rect = { left: 100, top: 100, right: 600, bottom: 260, width: 500, height: 160 }) => {
    const attrs = new Map();
    const styles = new Map();
    const listeners = new Map();
    return {
      tagName: tag,
      hidden: tag === 'hm-day-pop' || tag === 'hm-hover-tip',
      dataset: {},
      title: '',
      textContent: '',
      offsetWidth: 200,
      offsetHeight: 30,
      isConnected: true,
      style: {
        setProperty(k, v) { styles.set(k, String(v)); },
        getPropertyValue(k) { return styles.get(k) || ''; },
        removeProperty(k) { styles.delete(k); },
      },
      setAttribute(k, v) { attrs.set(k, String(v)); },
      getAttribute(k) { return attrs.has(k) ? attrs.get(k) : null; },
      hasAttribute(k) { return attrs.has(k); },
      removeAttribute(k) { attrs.delete(k); },
      addEventListener(t, fn) {
        if (!listeners.has(t)) listeners.set(t, new Set());
        listeners.get(t).add(fn);
      },
      removeEventListener(t, fn) { listeners.get(t)?.delete(fn); },
      dispatch(t, ev = {}) {
        for (const fn of [...(listeners.get(t) || [])]) fn(ev);
      },
      getBoundingClientRect() { return rect; },
      querySelectorAll() { return []; },
      querySelector() { return null; },
    };
  };

  const makeHomeRoot = () => {
    let html = '';
    const listeners = new Map();
    const card = makeEl('card', { left: 100, top: 100, right: 600, bottom: 180, width: 500, height: 80 });
    const body = makeEl('body', { left: 100, top: 130, right: 600, bottom: 180, width: 500, height: 50 });
    const stats = makeEl('stats');
    const detail = makeEl('detail');
    const toggleBtn = makeEl('toggle');
    const openBtn = makeEl('open');
    const pop = makeEl('hm-day-pop');
    const tip = makeEl('hm-hover-tip');
    let bodyInner = '';
    Object.defineProperty(body, 'innerHTML', {
      get() { return bodyInner; },
      set(v) { bodyInner = String(v); },
    });
    const host = { isConnected: true, dataset: {}, style: {} };
    const root = {
      host,
      get innerHTML() { return html; },
      set innerHTML(v) {
        html = String(v);
        const m = /class="hm-home-card"\s+data-collapsed="([01])"/.exec(html);
        if (m) card.setAttribute('data-collapsed', m[1]);
        else card.removeAttribute('data-collapsed');
      },
      addEventListener(t, fn) {
        if (!listeners.has(t)) listeners.set(t, new Set());
        listeners.get(t).add(fn);
      },
      removeEventListener(t, fn) { listeners.get(t)?.delete(fn); },
      dispatch(t, ev = {}) {
        for (const fn of [...(listeners.get(t) || [])]) fn(ev);
      },
      querySelector(sel) {
        if (sel === '.hm-home-card') return card;
        if (sel === '.hm-home-body') return body;
        if (sel === '.hm-home-stats') return stats;
        if (sel === '[data-hm-home-detail]') return detail;
        if (sel === '[data-hm-home="toggle"]') return toggleBtn;
        if (sel === '[data-hm-home="open"]') return openBtn;
        if (sel === '[data-hm-day-pop]') return pop;
        if (sel === '[data-hm-hover-tip]') return tip;
        return null;
      },
      querySelectorAll() { return []; },
    };
    return { root, card, body, toggleBtn };
  };

  const docListeners = new Map();
  let nextRafId = 1;
  const pendingRafs = new Map();
  const store = new Map();
  let failStorageWrite = false;

  globalThis.document = {
    documentElement: {},
    addEventListener(t, fn) {
      if (!docListeners.has(t)) docListeners.set(t, new Set());
      docListeners.get(t).add(fn);
    },
    removeEventListener(t, fn) { docListeners.get(t)?.delete(fn); },
  };
  globalThis.localStorage = {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) {
      if (failStorageWrite) throw new Error('quota');
      store.set(k, String(v));
    },
  };
  globalThis.requestAnimationFrame = (cb) => {
    const id = nextRafId++;
    pendingRafs.set(id, cb);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => { pendingRafs.delete(id); };
  globalThis.matchMedia = () => ({ matches: true }); // exercise reduced-motion settle rAF cancellation

  try {
    const ui = createHeatmapRenderer();
    const makeSnap = (genAt, hitRate) => ({
      generatedAt: genAt,
      sources: {
        all: {
          totals: { totalTokens: 1200, cacheHitRate: hitRate },
          activity: { currentStreak: 2, activeDays: 2, peakDay: { d: '2026-11-26', t: 1200 } },
          weeks52: { days: [{ d: '2026-11-26', t: 1200, i: 100, c: 900, o: 200, n: 1, l: 3 }] },
        },
      },
    });

    const { root, card, body, toggleBtn } = makeHomeRoot();
    // 1. Render expanded with non-numeric string cacheHitRate ("88.5") -> must coerce cleanly without throwing.
    ui.renderHomeHeatmapCard(root, makeSnap(1, '88.5'));
    assert.ok(root.innerHTML.includes('88.5%'));
    assert.equal(card.getAttribute('data-collapsed'), '0');

    // 2. Rapid double-click toggle preserves DOM nodes & flips state twice cleanly; cancel settle rAF on cleanup.
    toggleBtn.dispatch('click', { clientX: 550, clientY: 115 });
    assert.equal(card.getAttribute('data-collapsed'), '1');
    toggleBtn.dispatch('click', { clientX: 550, clientY: 115 });
    assert.equal(card.getAttribute('data-collapsed'), '0');

    // 3. Background polling snapshot refresh (generatedAt=2) updates body in-place without replacing card/toggleBtn.
    ui.renderHomeHeatmapCard(root, makeSnap(2, '91.2'));
    assert.strictEqual(root.querySelector('.hm-home-card'), card);
    assert.strictEqual(root.querySelector('[data-hm-home="toggle"]'), toggleBtn);
    assert.ok(body.innerHTML.includes('91.2%'));

    // 4. Failing localStorage.setItem keeps in-memory fallback so next poll does not revert toggle.
    failStorageWrite = true;
    toggleBtn.dispatch('click', { clientX: 550, clientY: 115 });
    assert.equal(card.getAttribute('data-collapsed'), '1');
    ui.renderHomeHeatmapCard(root, makeSnap(3, '91.2'));
    assert.equal(card.getAttribute('data-collapsed'), '1');
    assert.ok(pendingRafs.size > 0);

    // 5. cleanupHeatmapRoot cancels pending settle rAF & removes all document listeners.
    ui.cleanupHeatmapRoot(root);
    assert.equal(pendingRafs.size, 0);
    assert.equal(docListeners.get('click')?.size || 0, 0);
    assert.equal(docListeners.get('pointermove')?.size || 0, 0);

    // 6. Detached host self-cleans leaked document.click listener when clicked.
    const detached = makeHomeRoot();
    ui.renderHomeHeatmapCard(detached.root, makeSnap(4, 50));
    assert.equal(docListeners.get('click')?.size || 0, 1);
    detached.root.host.isConnected = false;
    for (const fn of [...(docListeners.get('click') || [])]) fn({ type: 'click' });
    assert.equal(docListeners.get('click')?.size || 0, 0);
    assert.equal(docListeners.get('pointermove')?.size || 0, 0);
  } finally {
    globalThis.document = prevDoc;
    globalThis.localStorage = prevLs;
    globalThis.requestAnimationFrame = prevRaf;
    globalThis.cancelAnimationFrame = prevCaf;
    globalThis.matchMedia = prevMm;
  }
});
