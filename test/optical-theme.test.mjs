import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOpticalThemeEngine } from '../agy-prism-ui/sidecars/agy_prism_ui/optical_theme.mjs';
import { createSettingsStore, DEFAULT_SETTINGS } from '../agy-prism-ui/sidecars/agy_prism_ui/settings.mjs';

test('optical theme defaults and clean-room CSS cover all 4 palettes and visual layers safely', () => {
  const engine = createOpticalThemeEngine();
  assert.equal(engine.version, 13);
  assert.equal(typeof engine.refreshPointer, 'function');
  assert.deepEqual(engine.DEFAULT_OPTICAL, {
    opticalLightTheme: 'crystal',
    opticalDarkTheme: 'obsidian',
    opticalPrismRim: true,
    opticalGlass: true,
    opticalMotion: true,
    opticalCodeTools: true,
  });

  const css = engine.buildCss();
  assert.ok(css.includes('#EBF1F8'));
  assert.ok(css.includes('#ECE6DC'));
  assert.ok(css.includes('#090A0E'));
  assert.ok(css.includes('#11100F'));
  assert.ok(css.includes('data-has-browser-hole="true"'));
  assert.ok(css.includes('div:has(+ .agy-inset-shell)'));
  assert.ok(css.includes('[data-testid="conversation-row-sidebar"][data-selected="true"]'));
  assert.ok(css.includes('[data-testid="sidebar-navigation-items"] :is(a, button).bg-sidebar-secondary:not(#agy-heatmap-nav-btn)'));
  assert.ok(css.includes('#agy-heatmap-nav-btn[data-active="true"]'));
  assert.ok(css.includes('html[data-agy-hm-open="1"]'));
  assert.ok(css.includes('[data-testid="new-conversation-button"].bg-card'));
  assert.ok(css.includes('@property --agy-prism-angle'));
  assert.ok(css.includes('conic-gradient(from var(--agy-prism-angle)'));
  assert.ok(css.includes('mask-composite: exclude'));
  assert.ok(!css.includes('z-index: 2;\n  -webkit-mask'));
  assert.ok(css.includes('.surface-composer::after'));
  assert.ok(css.includes('filter: blur(9px)'));
  assert.ok(css.includes('padding: 1px'));
  assert.ok(css.includes('border-radius: inherit'));
  assert.ok(css.includes('[data-testid="queued-messages-card"]'));
  assert.ok(css.includes(':not([data-agy-opt-has-queue="1"])'));
  assert.ok(css.includes('.hidden-if-empty:has(> [data-testid="queued-messages-card"])::after'));
  assert.ok(css.includes('.surface-glass'));
  assert.ok(css.includes('[role="menu"]'));
  assert.ok(css.includes('data-agy-opt-near="1"'));
  assert.ok(css.includes('data-agy-opt-typing="1"'));
  assert.ok(css.includes('data-agy-opt-typing-box="1"'));
  assert.ok(css.includes('--agy-card-top'));
  assert.ok(!css.includes(':focus-within::before'));
  assert.ok(css.includes('rgba(66, 133, 244,'));
  assert.ok(css.includes('rgba(155, 114, 203,'));
  assert.ok(css.includes('::highlight(agy-ink-1)'));
  assert.ok(css.includes('::highlight(agy-ink-3)'));
  assert.ok(css.includes('data-agy-opt-sticky-head="1"'));
  assert.ok(css.includes('data-agy-opt-folded="1"'));
});

test('optical settings validate and persist independently alongside display settings', () => {
  const dir = mkdtempSync(join(tmpdir(), 'agy-optical-'));
  try {
    const store = createSettingsStore(join(dir, 'settings.json'));
    assert.equal(DEFAULT_SETTINGS.opticalLightTheme, 'crystal');
    assert.equal(DEFAULT_SETTINGS.opticalDarkTheme, 'obsidian');
    assert.equal(DEFAULT_SETTINGS.opticalPrismRim, true);
    assert.equal(DEFAULT_SETTINGS.opticalGlass, true);
    assert.equal(DEFAULT_SETTINGS.opticalMotion, true);
    assert.equal(DEFAULT_SETTINGS.opticalCodeTools, true);

    store.update({
      opticalLightTheme: 'alabaster',
      opticalDarkTheme: 'warm',
      opticalPrismRim: false,
      opticalCodeTools: false,
    });
    const next = store.read();
    assert.equal(next.opticalLightTheme, 'alabaster');
    assert.equal(next.opticalDarkTheme, 'warm');
    assert.equal(next.opticalPrismRim, false);
    assert.equal(next.opticalGlass, true);
    assert.equal(next.opticalCodeTools, false);

    store.update({
      opticalLightTheme: 'invalid',
      opticalDarkTheme: 'invalid',
      opticalMotion: 'yes',
    });
    assert.equal(store.read().opticalLightTheme, 'alabaster');
    assert.equal(store.read().opticalDarkTheme, 'warm');
    assert.equal(store.read().opticalMotion, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('optical refreshPointer ignores disabled state, updates composer CSS vars when active, and dispose clears --agy-px/--agy-py', () => {
  const prevDoc = globalThis.document;
  const makeEl = (rect) => {
    const attrs = new Map();
    const styles = new Map();
    return {
      dataset: {},
      style: {
        setProperty(k, v) { styles.set(k, String(v)); },
        getPropertyValue(k) { return styles.get(k) || ''; },
        removeProperty(k) { styles.delete(k); },
      },
      setAttribute(k, v) { attrs.set(k, String(v)); },
      getAttribute(k) { return attrs.has(k) ? attrs.get(k) : null; },
      hasAttribute(k) { return attrs.has(k); },
      removeAttribute(k) { attrs.delete(k); },
      getBoundingClientRect() { return rect; },
      matches() { return false; },
      remove() {},
    };
  };

  const docListeners = new Map();
  const composer = makeEl({ left: 100, top: 200, right: 500, bottom: 300, width: 400, height: 100 });
  const htmlEl = makeEl({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
  const styleEl = makeEl({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
  const fakeDoc = {
    documentElement: htmlEl,
    head: { appendChild() {} },
    body: null,
    getElementById(id) { return id === 'agy-optical-style' ? styleEl : null; },
    createElement() { return styleEl; },
    querySelectorAll(sel) {
      if (sel.includes('.surface-composer')) return [composer];
      return [];
    },
    querySelector() { return null; },
    addEventListener(t, fn) { docListeners.set(t, fn); },
    removeEventListener(t, fn) { if (docListeners.get(t) === fn) docListeners.delete(t); },
  };

  globalThis.document = fakeDoc;
  try {
    const engine = createOpticalThemeEngine();
    // Calling refreshPointer while disabled must not cache coordinates.
    engine.refreshPointer({ x: 150, y: 250 });
    engine.apply({
      opticalLightTheme: 'crystal',
      opticalDarkTheme: 'obsidian',
      opticalPrismRim: true,
      opticalGlass: true,
      opticalMotion: false,
      opticalCodeTools: false,
    });
    engine.refreshPointer(null);
    assert.equal(composer.getAttribute('data-agy-opt-near'), null);

    // Explicit refreshPointer updates CSS variables and dispose cleans --agy-px / --agy-py.
    engine.refreshPointer({ x: 140, y: 240 });
    assert.equal(composer.getAttribute('data-agy-opt-near'), '1');
    assert.equal(composer.style.getPropertyValue('--agy-px'), '40px');
    assert.equal(composer.style.getPropertyValue('--agy-py'), '40px');
    assert.equal(composer.style.getPropertyValue('--agy-near-alpha'), '1.000');

    engine.dispose();
    assert.equal(composer.getAttribute('data-agy-opt-near'), null);
    assert.equal(composer.style.getPropertyValue('--agy-near-alpha'), '0');
    assert.equal(composer.style.getPropertyValue('--agy-px'), '');
    assert.equal(composer.style.getPropertyValue('--agy-py'), '');
    assert.equal(docListeners.size, 0);
  } finally {
    globalThis.document = prevDoc;
  }
});
