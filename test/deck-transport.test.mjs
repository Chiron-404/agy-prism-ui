import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startDeckInjector, buildRuntimeBundle } from '../agy-prism-ui/sidecars/agy_prism_ui/deck_injector.mjs';
import { createOverviewRenderer } from '../agy-prism-ui/sidecars/agy_prism_ui/overview_ui.mjs';
import { createPresentation } from '../agy-prism-ui/sidecars/agy_prism_ui/ui.mjs';
import { UI_HTML } from '../agy-prism-ui/sidecars/agy_prism_ui/server.mjs';

test('CDP installs code once, skips unchanged payloads, updates on navigation, and releases closed pages', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'agy-cdp-'));
  const file = join(dir, 'port'); writeFileSync(file, '12345\n');
  const originals = { fetch: globalThis.fetch, WebSocket: globalThis.WebSocket, now: Date.now };
  const owner = Date.now(), hash = buildRuntimeBundle(owner).hash;
  let now = owner, installed = false, path = '/', pageExists = true, hasFooter = true, inspections = 0, injections = 0, pushes = 0, lists = 0, next = { contextTokens: 100 };
  const connections = [];
  class FakeSocket {
    constructor() { this.readyState = 0; connections.push(this); queueMicrotask(() => { this.readyState = 1; this.onopen?.(); }); }
    send(raw) {
      const { id, params: { expression } } = JSON.parse(raw);
      let value;
      if (expression.includes('function installRuntime')) { injections++; installed = true; value = true; }
      else if (expression.includes('.readState(')) value = installed ? { owner, hash, path, hasFooter } : null;
      else if (expression.includes('.apply(')) { pushes++; value = true; }
      queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({ id, result: { result: { value } } }) }));
    }
    close() { if (this.readyState === 3) return; this.readyState = 3; queueMicrotask(() => this.onclose?.()); }
  }
  globalThis.WebSocket = FakeSocket;
  Date.now = () => now;
  globalThis.fetch = async () => { lists++; return { ok: true, json: async () => pageExists ? [{ id: 'page', type: 'page', url: 'https://127.0.0.1:5351/', webSocketDebuggerUrl: 'ws://test' }] : [] }; };
  let injector;
  try {
    injector = startDeckInjector(async () => { inspections++; return next; }, { portFile: file, instanceTs: owner });
    await injector.tick(); assert.equal(injections, 1); assert.equal(pushes, 1);
    await injector.tick(); assert.equal(injections, 1); assert.equal(pushes, 1); assert.equal(lists, 1);
    const count = inspections; hasFooter = false; await injector.tick(); assert.equal(inspections, count, 'Non-composer windows must not change the selected conversation'); hasFooter = true;
    next = { contextTokens: 200 }; await injector.tick(); assert.equal(pushes, 2);
    path = '/c/00000000-0000-0000-0000-000000000000'; await injector.tick(); assert.equal(pushes, 3);
    now += 5000; pageExists = false; await injector.tick(); assert.equal(connections[0].readyState, 3);
    pageExists = true; installed = false; now += 5000; await injector.tick(); assert.equal(injections, 2);
    // Closing a socket must flush its pending evaluation instead of waiting 3s.
    connections.at(-1).send = function () { this.close(); };
    let timeout;
    try { await Promise.race([injector.tick(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Pending evaluation was not released')), 300); })]); }
    finally { clearTimeout(timeout); }
  } finally {
    await injector?.stop();
    globalThis.fetch = originals.fetch; globalThis.WebSocket = originals.WebSocket; Date.now = originals.now;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('capsule overflow priority keeps token speed visible ahead of context and weekly quota', () => {
  const { code } = buildRuntimeBundle(1);
  assert.ok(code.includes('dk-hide-ctx-metric'));
  assert.ok(code.includes("const ctxHideCls = !pillSpeed.hidden ? 'dk-hide-ctx-metric' : 'dk-hide-cval';"));
  assert.ok(!code.includes("!mode.classes.includes('dk-hide-speed') ? ['dk-hide-speed', ...mode.classes]"));
});

test('Insights nav button preserves hover feedback and mutually exclusive active state', () => {
  const { code } = buildRuntimeBundle(1);
  assert.ok(code.includes('HM_NAV_IDLE_CLS'));
  assert.ok(code.includes('HM_NAV_ACTIVE_CLS'));
  assert.ok(code.includes('hover:bg-sidebar-muted hover:text-foreground'));
  assert.ok(code.includes('dataset.agyHmOpen'));
  assert.ok(!code.includes('.replace(/\\bbg-sidebar-muted\\b/g'));
});

test('clicking context footer pill jumps to Overview telemetry and old sidebar jump is removed', () => {
  const { code } = buildRuntimeBundle(1);
  assert.ok(code.includes('openOverviewTelemetry'));
  assert.ok(code.includes('agy-overview-telemetry-host'));
  assert.ok(code.includes('toggle-overview-panel'));
  assert.ok(code.includes('overview-panel'));
  assert.ok(code.includes('__agyPrismOverviewUI'));
  assert.ok(!code.includes('openPrismSidebar'));
  assert.ok(!code.includes('agy-prism-ui:select-view'));
  assert.ok(!code.includes('data-agy-prism-silent-menu'));
  assert.ok(!UI_HTML.includes('agy-prism-ui:select-view'));

  const overview = createOverviewRenderer();
  assert.equal(overview.version, 6);
  const ovSrc = createOverviewRenderer.toString();
  assert.ok(ovSrc.includes('ov-context-card'));
  assert.ok(ovSrc.includes('ov-history-root'));
  assert.ok(ovSrc.includes('contain: inline-size'));
  assert.ok(ovSrc.includes("titleEl.textContent = 'Telemetry'"));
  assert.ok(!ovSrc.includes('会话遥测'));
  assert.ok(!ovSrc.includes('aria-expanded="true"] .ov-title'));
  assert.ok(!/\.ov-head:hover\s*\{\s*background:/.test(ovSrc));
  assert.match(ovSrc, /\.ov-head:hover\s+\.ov-title,\s*\.ov-head:focus-visible\s+\.ov-title\s*\{\s*opacity:\s*1;\s*\}/);
  assert.match(ovSrc, /@media\s*\(hover:\s*hover\)\s*\{\s*\.ov-chev\s*\{\s*opacity:\s*0;\s*\}\s*\}/);
  assert.ok(ovSrc.includes('transform: rotate(90deg);'));
  assert.ok(!/\.ov-chev\s*\{[^}]*margin-left:\s*auto/.test(ovSrc));
  assert.ok(!ovSrc.includes('@media (min-width: 360px)'));
  assert.ok(code.includes("host.style.contain = 'inline-size'"));
  assert.ok(!code.includes('width: min(404px'));
  assert.ok(!code.includes('.animate-overview-panel:has(#agy-overview-telemetry-host[data-expanded="true"])'));
  assert.ok(code.includes('if(globalThis.__agyPrismDeck){try{globalThis.__agyPrismDeck.dispose();}catch{}}'));
  assert.ok(!ovSrc.includes('quota-bucket'));
  assert.ok(!ovSrc.includes('quota-root'));
  assert.ok(!ovSrc.includes('quotaGroups'));
  assert.ok(createPresentation);
});

test('toView renders --% for null quota remainingFraction and drops unused context fields', async () => {
  const { toView } = await import('../agy-prism-ui/sidecars/agy_prism_ui/deck_injector.mjs');
  const view = toView({
    contextTokens: 1000,
    maxContextTokens: 10000,
    quotaGroups: [{ displayName: 'Gemini', buckets: [{ window: '5h', remainingFraction: null }] }],
  });
  assert.equal(view.quotaSummaryGroups[0].q5h, '--%');
  assert.ok(view.quotaHtml.includes('dk-q-pct notranslate" translate="no">--%</span>'));
  assert.equal('usedPctText' in view, false);
  assert.equal('valRead' in view, false);
});

test('Overview turn & request history rows hide details until expanded, preserve tooltip, and reset across conversations', () => {
  const ui = createPresentation();
  assert.equal(ui.version, 74);
  assert.equal(ui.localeWidthClass('en'), 'wide');
  assert.equal(ui.localeWidthClass('ja'), 'wide');
  assert.equal(ui.localeWidthClass('zh-CN'), 'compact');
  const { code } = buildRuntimeBundle(1);
  assert.ok(code.includes('--dk-ctx-pop-width'));
  assert.ok(code.includes('data-lang-width="wide"'));
  assert.ok(code.includes('display: flex; flex-wrap: wrap; justify-content: space-between;'));
  assert.ok(code.includes('[data-history-row="session"] > [data-i18n="sessionTotal"] { display: none; }'));
  const labels = ui.dictionaries['zh-CN'];
  const history = {
    summary: { turnCount: 1, requestCount: 12, totalSessionTokens: 450000, compactionCount: 0, avgTps: 109.2, avgStreamTps: 215.5, peakTps: 215.5, peakContextTokens: 422000 },
    requests: [{ requestIndex: 0, contextTokens: 422000, tps: 109.2, ttft: 5.5, duration: 10.2, thinking: 11800, reply: 25000, modelShort: 'Hydrogen', modelEffort: 'High', modelPhase: 'execute' }],
    turns: [{ turnNumber: 45, state: 'done', duration: 536, requestCount: 24, thinking: 11800, write: 25400, avgTps: 109.2, avgStreamTps: 215.5, modelsUsed: [{ phase: 'plan', shortName: 'Neon', isOrchestrator: true }, { phase: 'execute', shortName: 'Hydrogen', isOrchestrator: true }] }],
  };

  let html = '';
  let turnBtns = [];
  let reqBtns = [];
  let turnDetails = new Map();
  let reqDetails = new Map();
  const makeBtn = (m) => {
    const attrs = m[1] + ' ' + m[3];
    const expandedMatch = /aria-expanded="(true|false)"/.exec(attrs);
    const titleMatch = /title="([^"]*)"/.exec(attrs);
    const listeners = {};
    return {
      dataset: { histTurn: m[2], histReq: m[2] },
      innerHtml: m[4],
      title: titleMatch ? titleMatch[1] : '',
      attrs: { 'aria-expanded': expandedMatch ? expandedMatch[1] : 'false' },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k]; },
      addEventListener(ev, fn) { listeners[ev] = fn; },
      click() { listeners.click?.(); },
    };
  };
  const container = {
    hidden: false,
    _renderKey: '',
    get innerHTML() { return html; },
    set innerHTML(val) {
      html = val;
      turnBtns = [...val.matchAll(/<button([^>]*)data-hist-turn="(\d+)"([^>]*)>([\s\S]*?)<\/button>/g)].map(makeBtn);
      reqBtns = [...val.matchAll(/<button([^>]*)data-hist-req="(\d+)"([^>]*)>([\s\S]*?)<\/button>/g)].map(makeBtn);
      turnDetails = new Map();
      for (const m of val.matchAll(/<div class="hist-turn-detail" data-hist-turn-detail="(\d+)"([^>]*)>([\s\S]*?)<\/div>\s*<\/div>/g)) {
        turnDetails.set(m[1], { hidden: /\bhidden\b/.test(m[2]), html: m[3] });
      }
      reqDetails = new Map();
      for (const m of val.matchAll(/<div class="hist-turn-detail" data-hist-req-detail="(\d+)"([^>]*)>([\s\S]*?)<\/div>\s*<\/div>/g)) {
        reqDetails.set(m[1], { hidden: /\bhidden\b/.test(m[2]), html: m[3] });
      }
    },
    replaceChildren() {},
    querySelector(sel) {
      const tm = /^\[data-hist-turn-detail="(\d+)"\]$/.exec(sel);
      if (tm) return turnDetails.get(tm[1]) || null;
      const rm = /^\[data-hist-req-detail="(\d+)"\]$/.exec(sel);
      if (rm) return reqDetails.get(rm[1]) || null;
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '[data-hist-turn]') return turnBtns;
      if (sel === '[data-hist-req]') return reqBtns;
      return [];
    },
  };

  ui.renderSidebarHistory(container, history, 1000000, labels, Date.now(), '/c/conv-a');
  assert.equal(turnBtns.length, 1);
  assert.ok(!turnBtns[0].innerHtml.includes(labels.think));
  assert.ok(!turnBtns[0].innerHtml.includes(labels.write));
  assert.ok(turnBtns[0].title.includes(labels.think));
  assert.ok(turnBtns[0].title.includes(labels.write));

  const detail = turnDetails.get('45');
  assert.equal(detail.hidden, true);
  assert.ok(detail.html.includes(labels.think));
  assert.ok(detail.html.includes(labels.write));

  turnBtns[0].click();
  assert.equal(turnBtns[0].getAttribute('aria-expanded'), 'true');
  assert.equal(detail.hidden, false);
  const keyAfterOpen = container._renderKey;
  assert.ok(keyAfterOpen.includes('/c/conv-a'));

  ui.renderSidebarHistory(container, history, 1000000, labels, Date.now(), '/c/conv-b');
  assert.equal(turnBtns[0].getAttribute('aria-expanded'), 'false');
  assert.equal(turnDetails.get('45').hidden, true);

  container._histTab = 'requests';
  ui.renderSidebarHistory(container, history, 1000000, labels, Date.now(), '/c/conv-b');
  assert.equal(reqBtns.length, 1);
  assert.ok(reqBtns[0].innerHtml.includes('#1'));
  assert.ok(reqBtns[0].innerHtml.includes('Hydrogen·High'));
  assert.ok(reqBtns[0].innerHtml.includes('422K'));
  assert.ok(reqBtns[0].innerHtml.includes('109.2 tok/s'));
  assert.ok(!reqBtns[0].innerHtml.includes(labels.thinkShort));
  assert.ok(reqBtns[0].title.includes(labels.think));
  assert.ok(reqBtns[0].title.includes(labels.reply));

  const reqDetail = reqDetails.get('0');
  assert.equal(reqDetail.hidden, true);
  assert.ok(reqDetail.html.includes(labels.think));
  assert.ok(reqDetail.html.includes(labels.reply));
  assert.ok(reqDetail.html.includes('TTFT'));

  reqBtns[0].click();
  assert.equal(reqBtns[0].getAttribute('aria-expanded'), 'true');
  assert.equal(reqDetail.hidden, false);

  reqBtns[0].click();
  assert.equal(reqBtns[0].getAttribute('aria-expanded'), 'false');
  assert.equal(reqDetail.hidden, true);
});

test('deck injector elevates composer ancestor stacking context while popovers are open and cleans up on release', () => {
  const { code } = buildRuntimeBundle(1);
  assert.ok(code.includes('data-agy-dk-elevated'));
  assert.ok(code.includes('z-index: 9999 !important'));
  assert.ok(code.includes('clearElevation'));
  assert.ok(code.includes('_elevatedAncestors'));
});
