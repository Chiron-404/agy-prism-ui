import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { createExtensionBus, getExtensionBusScript } from '../agy-prism-ui/sidecars/agy_prism_ui/extensions.mjs';
import { buildAiDevPrompt, createDevStore, DEFAULT_DEV_CONFIG, normalizeDevConfig, sanitizeCustomCss } from '../agy-prism-ui/sidecars/agy_prism_ui/dev_config.mjs';
import { createHeatmapRenderer } from '../agy-prism-ui/sidecars/agy_prism_ui/heatmap_ui.mjs';

test('createExtensionBus supports isolated lenses, overview sections, heatmap themes, listeners, and dispose', () => {
  const bus = createExtensionBus();
  assert.equal(bus.version, 1);

  assert.equal(bus.registerLens('demo-lens', { order: 10, render: () => '<span>Demo</span>' }), true);
  assert.equal(bus.registerLens('../bad', { render: () => '' }), false);
  assert.equal(bus.registerOverviewSection('sec-a', { title: 'Custom Card', render: () => 'Hello' }), true);

  let seenSnap = null;
  let seenHm = null;
  const offSnap = bus.onSnapshot(d => { seenSnap = d; });
  bus.onSnapshot(() => { throw new Error('boom'); });
  bus.onHeatmap(h => { seenHm = h; });

  bus.emitSnapshot({ contextTokens: 123 });
  bus.emitHeatmap({ generatedAt: 456 });
  assert.equal(seenSnap.contextTokens, 123);
  assert.equal(seenHm.generatedAt, 456);
  offSnap();
  bus.emitSnapshot({ contextTokens: 999 });
  assert.equal(seenSnap.contextTokens, 123);

  const customTheme = {
    label: 'SunsetTest',
    light: ['#eff2f6', '#fde68a', '#fbbf24', '#fb923c', '#f43f5e', '#9f1239'],
    dark: ['#161b26', '#452308', '#9a3412', '#ea580c', '#f43f5e', '#fda4af'],
  };
  assert.equal(bus.registerHeatmapTheme('custom-test', customTheme), true);

  const hm = createHeatmapRenderer();
  assert.equal(hm.registerTheme('custom-test', customTheme), true);
  assert.equal(hm.THEMES['custom-test'].label, 'SunsetTest');
  assert.equal(hm.unregisterTheme('blue'), false);
  assert.equal(hm.unregisterTheme('custom-test'), true);

  assert.deepEqual(bus.list().lenses, ['demo-lens']);
  assert.deepEqual(bus.list().overviewSections, ['sec-a']);

  assert.equal(bus.unregister('demo-lens'), true);
  assert.deepEqual(bus.list().lenses, []);

  bus.dispose();
  assert.deepEqual(bus.list(), {
    lenses: [],
    overviewSections: [],
    heatmapThemes: [],
    styles: [],
    snapshotListeners: 0,
    heatmapListeners: 0,
  });

  // Verify serialized script runs cleanly in isolated VM
  const ctx = { globalThis: {} };
  vm.runInNewContext(getExtensionBusScript(), ctx);
  assert.equal(ctx.globalThis.__agyPrismExt.version, 1);
});

test('createDevStore normalizes dev settings, caps custom CSS, and builds AI dev prompt', () => {
  assert.deepEqual(normalizeDevConfig({ overviewWidthPx: 999, uiFontScale: 2, customCssEnabled: 1 }), {
    customCssEnabled: true,
    overviewWidthPx: 520,
    uiFontScale: 1.25,
    insightsDefaultExpanded: false,
    enableUserExtensions: true,
  });
  assert.equal(normalizeDevConfig({ overviewWidthPx: 200 }).overviewWidthPx, 0);
  assert.equal(sanitizeCustomCss('a\0b').includes('\0'), false);
  assert.equal(sanitizeCustomCss('x'.repeat(70000)).length, 65536);

  const dir = mkdtempSync(join(tmpdir(), 'agy-dev-'));
  try {
    const store = createDevStore(join(dir, 'dev_config.json'), join(dir, 'custom.css'));
    assert.deepEqual(store.readConfig(), DEFAULT_DEV_CONFIG);
    const saved = store.updateConfig({ customCssEnabled: true, overviewWidthPx: 380, uiFontScale: 1.1 });
    assert.equal(saved.overviewWidthPx, 380);
    assert.equal(saved.uiFontScale, 1.1);
    store.writeCustomCss('.test { color: red; }');
    assert.equal(readFileSync(store.cssPath, 'utf8'), '.test { color: red; }');

    const prompt = buildAiDevPrompt({ pluginDir: dir, version: '2.0.3-dev' });
    assert.ok(prompt.includes('__agyPrismExt'));
    assert.ok(prompt.includes('2.0.3-dev'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
