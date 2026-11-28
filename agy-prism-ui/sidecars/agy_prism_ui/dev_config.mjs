import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const DEFAULT_DEV_CONFIG = Object.freeze({
  customCssEnabled: false,
  overviewWidthPx: 0,
  uiFontScale: 1,
  insightsDefaultExpanded: false,
  enableUserExtensions: true,
});

const MAX_CUSTOM_CSS_BYTES = 65536;

export function normalizeDevConfig(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const wRaw = Number(src.overviewWidthPx);
  const overviewWidthPx = Number.isFinite(wRaw) && wRaw >= 320
    ? Math.min(520, Math.round(wRaw))
    : 0;
  const sRaw = Number(src.uiFontScale);
  const uiFontScale = Number.isFinite(sRaw)
    ? Number(Math.max(0.85, Math.min(1.25, sRaw)).toFixed(2))
    : 1;
  return {
    customCssEnabled: Boolean(src.customCssEnabled),
    overviewWidthPx,
    uiFontScale,
    insightsDefaultExpanded: Boolean(src.insightsDefaultExpanded),
    enableUserExtensions: src.enableUserExtensions !== false,
  };
}

export function sanitizeCustomCss(css = '') {
  return String(css ?? '').replaceAll('\0', '').slice(0, MAX_CUSTOM_CSS_BYTES);
}

export function createDevStore(configPath, cssPath) {
  const baseDir = join(homedir(), '.gemini', 'config', 'agy-prism-ui');
  const targetConfig = configPath || join(baseDir, 'dev_config.json');
  const targetCss = cssPath || join(baseDir, 'custom.css');

  function atomicWrite(file, content) {
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`;
    writeFileSync(tmp, content, 'utf8');
    renameSync(tmp, file);
  }

  function readConfig() {
    try {
      if (!existsSync(targetConfig)) return { ...DEFAULT_DEV_CONFIG };
      return normalizeDevConfig(JSON.parse(readFileSync(targetConfig, 'utf8')));
    } catch {
      return { ...DEFAULT_DEV_CONFIG };
    }
  }

  function updateConfig(patch = {}) {
    const next = normalizeDevConfig({ ...readConfig(), ...(patch && typeof patch === 'object' ? patch : {}) });
    atomicWrite(targetConfig, JSON.stringify(next, null, 2) + '\n');
    return next;
  }

  function readCustomCss() {
    try {
      if (!existsSync(targetCss)) return '';
      return sanitizeCustomCss(readFileSync(targetCss, 'utf8'));
    } catch {
      return '';
    }
  }

  function writeCustomCss(css = '') {
    const clean = sanitizeCustomCss(css);
    atomicWrite(targetCss, clean);
    return clean;
  }

  return {
    configPath: targetConfig,
    cssPath: targetCss,
    readConfig,
    updateConfig,
    readCustomCss,
    writeCustomCss,
  };
}

export function buildAiDevPrompt({ pluginDir = '', version = '2.0.3-dev' } = {}) {
  const dir = pluginDir || '~/.gemini/config/plugins/agy-prism-ui';
  return [
    `You are extending or customizing **Agy Prism UI v${version}** (installed at \`${dir}\`).`,
    '',
    '### Architecture & Key Rules',
    '1. Pure Node.js 24+ ESM with zero npm dependencies (`sidecars/agy_prism_ui/`).',
    '2. Factories serialized via `.toString()` into Electron (`ui.mjs`, `optical_theme.mjs`, `overview_ui.mjs`, `heatmap_ui.mjs`, `extensions.mjs`) MUST remain self-contained with zero module-scope references; bump their `version` + `get*Script()` guard after edits.',
    '3. Keep SQLite `.db` access strictly read-only.',
    '',
    '### Dev Extension Bus (`globalThis.__agyPrismExt`, v1)',
    '- `registerLens(id, { render(data, ctx), order, position })`: add a custom pill in the composer footer strip.',
    '- `registerOverviewSection(id, { title, render(data, ctx), order })`: append a custom section card inside `Overview -> Telemetry`.',
    '- `registerHeatmapTheme(id, { label, light: [6 hexes], dark: [6 hexes], ... })`: add a dynamic Insights palette.',
    '- `registerStyle(id, cssText)`: inject managed custom CSS cleaned up automatically on `dispose()`.',
    '- `onSnapshot(fn)` / `onHeatmap(fn)`: subscribe to live telemetry/heatmap updates (returns unsubscribe fn).',
    '- `unregister(id)` / `list()` / `dispose()`.',
    '',
    '### Sidecar HTTP Endpoints (POST requires `X-Sidecar-Token` header / `token` query)',
    '- `GET /api/context`, `GET /api/heatmap`, `GET/POST /api/settings`',
    '- `GET /api/update/status`, `POST /api/update/check`, `POST /api/update/apply`',
    '- `GET/POST /api/dev/config`, `GET/POST /api/dev/custom-css`, `GET /api/dev/prompt`',
    '',
    '### Verification & Hot Reload',
    '- Run `node --test "test/*.test.mjs"` (require 0 failures) and `node --check` on changed `.mjs` files.',
    '- Run `install.bat` (or `./install.sh`) or edit inside the installed plugin dir; `reload.mjs` hot-reloads Antigravity automatically.',
  ].join('\n');
}
