import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettingsStore, DEFAULT_SETTINGS } from '../agy-prism-ui/sidecars/agy_prism_ui/settings.mjs';
import { createPresentation } from '../agy-prism-ui/sidecars/agy_prism_ui/ui.mjs';
import { createHeatmapRenderer } from '../agy-prism-ui/sidecars/agy_prism_ui/heatmap_ui.mjs';
import { buildHeatmapData } from '../agy-prism-ui/sidecars/agy_prism_ui/heatmap.mjs';
import { createOpticalThemeEngine } from '../agy-prism-ui/sidecars/agy_prism_ui/optical_theme.mjs';

test('settings validates and persists all four display/settings locales including ja', () => {
  const dir = mkdtempSync(join(tmpdir(), 'agy-i18n-settings-'));
  try {
    const store = createSettingsStore(join(dir, 'settings.json'));
    assert.deepEqual(store.read(), DEFAULT_SETTINGS);
    const updated = store.update({ language: 'ja', settingsLanguage: 'ja' });
    assert.equal(updated.language, 'ja');
    assert.equal(updated.settingsLanguage, 'ja');
    assert.equal(createSettingsStore(join(dir, 'settings.json')).read().language, 'ja');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ui presentation and turn presentation dictionaries have 100% key parity across en, zh-CN, zh-TW, and ja', () => {
  const ui = createPresentation();
  assert.deepEqual(ui.SUPPORTED_LOCALES, ['en', 'zh-CN', 'zh-TW', 'ja']);
  assert.equal(ui.locale({}, ['ja-JP']), 'ja');
  assert.equal(ui.locale({ language: 'ja' }, ['en-US']), 'ja');
  assert.equal(ui.localeWidthClass('ja'), 'wide');
  assert.equal(ui.localeWidthClass('en'), 'wide');
  assert.equal(ui.localeWidthClass('zh-TW'), 'compact');

  const enKeys = Object.keys(ui.dictionaries.en).sort();
  for (const loc of ['zh-CN', 'zh-TW', 'ja']) {
    assert.deepEqual(Object.keys(ui.dictionaries[loc]).sort(), enKeys, `Key mismatch in ui dictionary ${loc}`);
    for (const k of enKeys) {
      if (k === 'resetJoin') continue;
      assert.ok(String(ui.dictionaries[loc][k] || '').trim().length > 0, `Empty value for ${loc}.${k}`);
    }
  }
});

test('heatmap_ui HM_I18N has complete 4-locale coverage and eliminates hardcoded Simplified Chinese leaks', () => {
  const hm = createHeatmapRenderer();
  assert.deepEqual(hm.SUPPORTED_HM_LOCALES, ['zh-CN', 'zh-TW', 'en', 'ja']);
  const baseKeys = Object.keys(hm.HM_I18N['zh-CN']).sort();
  for (const loc of ['zh-TW', 'en', 'ja']) {
    assert.deepEqual(Object.keys(hm.HM_I18N[loc]).sort(), baseKeys, `Key mismatch in HM_I18N.${loc}`);
  }

  const data = buildHeatmapData([
    {
      id: 'conv-1',
      source: 'app',
      isSubagent: false,
      days: { '2026-11-26': { in: 500_000, cache: 4_500_000, out: 50_000, think: 20_000, total: 5_050_000, costUsd: 3.1, reqs: 5 } },
    },
  ], new Date(2026, 10, 26, 12, 0, 0).getTime());
  const updateStatus = {
    currentVersion: '2.1.0-pre',
    currentChannel: 'preview',
    channel: 'preview',
    autoCheckUpdates: true,
    checking: false,
    applying: false,
    state: 'available',
    updateAvailable: true,
    actionKind: 'upgrade',
    latest: {
      tag: 'v2.1.0',
      channel: 'stable',
      summary: 'Update note',
      htmlUrl: 'https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.1.0',
    },
    lastCheckedAt: Date.now(),
    nextCheckLabel: '19:00',
    error: '',
  };

  for (const loc of ['zh-CN', 'zh-TW', 'en', 'ja']) {
    const full = hm.buildFullHtml(data, {
      prefs: { language: loc, updateChannel: 'preview', autoCheckUpdates: true },
      hasOpticalControl: true,
      optOpen: true,
      hasUpdateControl: true,
      updOpen: true,
      updateStatus,
    });
    assert.ok(full.includes('data-opt-lang="zh-CN"'));
    assert.ok(full.includes('data-opt-lang="zh-TW"'));
    assert.ok(full.includes('data-opt-lang="en"'));
    assert.ok(full.includes('data-opt-lang="ja"'));

    const homeCollapsed = hm.buildHomeHtml(data, { prefs: { language: loc }, collapsed: true, updateStatus });
    const homeExpanded = hm.buildHomeHtml(data, { prefs: { language: loc }, collapsed: false, updateStatus });

    if (loc === 'en') {
      // Strip the 3 native-script language picker buttons before checking zero CJK leaks in English UI
      const strippedFull = full
        .replace(/<button[^>]+data-opt-lang="zh-CN"[^>]*>.*?<\/button>/g, '')
        .replace(/<button[^>]+data-opt-lang="zh-TW"[^>]*>.*?<\/button>/g, '')
        .replace(/<button[^>]+data-opt-lang="ja"[^>]*>.*?<\/button>/g, '');
      assert.equal(/[\u4e00-\u9fff]/.test(strippedFull), false, 'English full Insights HTML leaked CJK characters');
      assert.equal(/[\u4e00-\u9fff]/.test(homeCollapsed), false, 'English Home collapsed HTML leaked CJK characters');
      assert.equal(/[\u4e00-\u9fff]/.test(homeExpanded), false, 'English Home expanded HTML leaked CJK characters');
    }

    if (loc === 'ja') {
      assert.ok(full.includes('キャッシュ') && full.includes('累計トークン') && full.includes('アップデート'));
      for (const sc of ['会话', '累计', '关闭', '外观', '发行通道', '一键更新']) {
        assert.equal(full.includes(sc), false, `Japanese full Insights leaked Simplified Chinese "${sc}"`);
        assert.equal(homeExpanded.includes(sc), false, `Japanese Home card leaked Simplified Chinese "${sc}"`);
      }
    }

    if (loc === 'zh-TW') {
      assert.ok(full.includes('工作階段') && full.includes('外觀') && full.includes('累計總 Token'));
      for (const sc of ['会话', '累计', '关闭', '外观', '发行通道', '一键更新']) {
        assert.equal(full.includes(sc), false, `Traditional Chinese Insights leaked Simplified Chinese "${sc}"`);
        assert.equal(homeExpanded.includes(sc), false, `Traditional Chinese Home card leaked Simplified Chinese "${sc}"`);
      }
    }
  }
});

test('renderFullHeatmap wires language switcher buttons to onUpdatePrefs', () => {
  const hm = createHeatmapRenderer();
  const data = buildHeatmapData([], new Date(2026, 10, 28, 12, 0, 0).getTime());
  const listeners = new Map();
  const makeNode = (attrs = {}) => ({
    attributes: { ...attrs },
    textContent: '',
    getAttribute(k) { return this.attributes[k] ?? null; },
    setAttribute(k, v) { this.attributes[k] = String(v); },
    addEventListener(ev, fn) {
      if (!listeners.has(this)) listeners.set(this, new Map());
      listeners.get(this).set(ev, fn);
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
  });
  const langButtons = ['zh-CN', 'zh-TW', 'en', 'ja'].map(l => makeNode({ 'data-opt-lang': l }));
  const root = {
    _innerHTML: '',
    set innerHTML(v) { this._innerHTML = v; },
    get innerHTML() { return this._innerHTML; },
    querySelector() { return null; },
    querySelectorAll(sel) {
      return sel === '[data-opt-lang]' ? langButtons : [];
    },
  };
  let savedPatch = null;
  hm.renderFullHeatmap(root, data, {
    prefs: { language: 'en' },
    onUpdatePrefs: (patch) => { savedPatch = patch; },
  });
  listeners.get(langButtons[3]).get('click')();
  assert.deepEqual(savedPatch, { language: 'ja', settingsLanguage: 'ja' });
});

test('optical_theme code fold button formats labels for all 4 locales and refreshes on apply', () => {
  const prevDoc = globalThis.document;
  const prevMut = globalThis.MutationObserver;
  const foldBtns = [];
  const makePre = (linesCount) => {
    const attrs = {};
    let nextSib = null;
    const pre = {
      textContent: Array.from({ length: linesCount }, (_, i) => `line ${i}`).join('\n'),
      previousElementSibling: null,
      closest: () => null,
      hasAttribute: (k) => k in attrs,
      setAttribute: (k, v) => { attrs[k] = String(v); },
      getAttribute: (k) => attrs[k] ?? null,
      removeAttribute: (k) => { delete attrs[k]; },
      getBoundingClientRect: () => ({ top: 100, height: 200 }),
      insertAdjacentElement: (_pos, bar) => { nextSib = bar; bar.previousElementSibling = pre; },
      _next: () => nextSib,
    };
    return pre;
  };
  const preNode = makePre(42);
  const head = { appendChild() {}, children: [] };
  globalThis.MutationObserver = class { observe() {} disconnect() {} };
  globalThis.document = {
    head,
    body: {},
    documentElement: { dataset: {} },
    getElementById: () => null,
    createElement: (tag) => {
      if (tag === 'button') {
        const b = {
          tagName: 'BUTTON',
          type: '',
          className: '',
          textContent: '',
          dataset: {},
          _handlers: {},
          closest: (sel) => (sel === '.agy-opt-fold-bar' ? b.parentElement : null),
          addEventListener: (ev, fn) => { b._handlers[ev] = fn; },
        };
        foldBtns.push(b);
        return b;
      }
      const el = {
        tagName: tag.toUpperCase(),
        id: '',
        textContent: '',
        children: [],
        previousElementSibling: null,
        appendChild(c) { c.parentElement = this; this.children.push(c); },
        remove() {},
      };
      return el;
    },
    querySelectorAll: (sel) => {
      if (sel === 'pre') return [preNode];
      if (sel === '.agy-opt-fold-btn[data-agy-opt-lines]') return foldBtns;
      return [];
    },
    querySelector: () => null,
    addEventListener() {},
    removeEventListener() {},
  };
  try {
    const engine = createOpticalThemeEngine();
    engine.apply({ opticalCodeTools: true, language: 'en' });
    assert.equal(foldBtns.length, 1);
    assert.equal(foldBtns[0].textContent, 'Fold · 42 lines');
    foldBtns[0]._handlers.click({ preventDefault() {}, stopPropagation() {} });
    assert.equal(foldBtns[0].textContent, 'Expand · 42 lines');

    engine.apply({ opticalCodeTools: true, language: 'ja' });
    assert.equal(foldBtns[0].textContent, '展開 · 42 行');

    engine.apply({ opticalCodeTools: true, language: 'zh-TW' });
    assert.equal(foldBtns[0].textContent, '展開 · 42 行');
    foldBtns[0]._handlers.click({ preventDefault() {}, stopPropagation() {} });
    assert.equal(foldBtns[0].textContent, '摺疊 · 42 行');
  } finally {
    globalThis.document = prevDoc;
    globalThis.MutationObserver = prevMut;
  }
});
