# Agy Prism UI — AI Agent Developer Guide (`AI_DEV_GUIDE.md`)

> For AI coding agents (Antigravity, Claude Code, Codex, Cursor, etc.) and contributors modifying or extending **Agy Prism UI (`agy-prism-ui`)**.

---

## 1. Architecture & Runtime Overview

Zero third-party dependencies (`node_modules` free). Pure Node.js ESM targeting **Node 24+** (`node:sqlite`, `node:test`, `node:crypto`, `node:zlib`).

```text
agy-prism-ui/
├── plugin.json                              # Plugin manifest & current version
└── sidecars/agy_prism_ui/
    ├── sidecar.json                         # Sidecar entrypoint & restart_policy: "always"
    ├── server.mjs                           # HTTP pages/APIs, SQLite protobuf telemetry, LS quota
    ├── deck_injector.mjs                    # CDP WebSocket transport & renderer bundle injector
    ├── optical_theme.mjs                    # Optical palettes, prism halo, stream fade, code tools
    ├── overview_ui.mjs                      # Right-hand Overview -> Telemetry drawer (Shadow DOM)
    ├── heatmap.mjs                          # Multi-source SQLite aggregator & dynamic color grading
    ├── heatmap_ui.mjs                       # Insights Home card, 52-week dashboard & Update popover
    ├── updater.mjs                          # 3-channel GitHub Releases checker & transactional hot-updater
    ├── extensions.mjs                       # Dev channel runtime extension bus (globalThis.__agyPrismExt, v1)
    ├── dev_config.mjs                       # Dev custom config, CSS sanitizer & AI prompt generator
    ├── ui.mjs                               # Shared formatting, i18n dictionaries & history renderer
    ├── settings.mjs                         # Atomic settings store (~/.gemini/config/agy-prism-ui/settings.json)
    ├── model_routing.mjs                    # Orchestrator Plan/Execute/Direct routing & effort parser
    ├── history.mjs / metrics.mjs / turn_metrics.mjs / turn_ui.mjs / errors.mjs
    ├── host_bridge.mjs                      # Async /_sidecar/* wrapper & EPIPE guard
    ├── sqlite_cache.mjs                     # .db + -wal stat cache
    └── reload.mjs                           # Self-reload watcher (.update-in-progress aware)
```

---

## 2. Hard Invariants (Must Not Break)

1. **Browser-Serialized Functions (`toString()`)**:
   - `getPresentationScript()`, `getOpticalThemeScript()`, `getOverviewRendererScript()`, and `getHeatmapRendererScript()` serialize factory functions via `.toString()` into the Electron renderer.
   - **Never reference module-scope imports or variables** inside `createPresentation`, `createOpticalThemeEngine`, `createOverviewRenderer`, or `createHeatmapRenderer`. Keep every helper strictly inside the factory body!
   - When modifying a serialized renderer, bump its `version` integer consistently in BOTH the factory return object AND its `get*Script()` guard (plus any version assertion in `test/`).
2. **Shadow DOM & Host Lifecycle**:
   - All injected panels (`#agy-prism-host`, `#agy-heatmap-home-host`, `#agy-heatmap-page-host`, `#agy-overview-telemetry-host`) use Shadow DOM (`mode: 'open'`).
   - Always detach `document`/`window` listeners when `host.isConnected === false` or `dispose()` runs.
   - `Overview → Telemetry` must keep `contain: inline-size` and respect Antigravity's native `320px` overview panel width.
3. **Settings & Test Sync (`test/display-settings.test.mjs`)**:
   - Every key in `settings.mjs` (`DEFAULT_SETTINGS` / `choices`) must have a matching control in `server.mjs` (`UI_HTML` `#sidebar-settings`), and every `data-i18n` key must exist identically in all dictionaries (`en`, `zh-CN`, `zh-TW`) in `ui.mjs`.
   - Do NOT add extra `.setting-help-dot` spans in `#sidebar-settings` without updating `test/display-settings.test.mjs` (currently asserts exact count `3`).
4. **Release Channels (`updater.mjs`)**:
   - `stable`: GitHub Release with `prerelease: false` & tag `vX.Y.Z` (published as `Latest`).
   - `preview`: GitHub Release with `prerelease: true` & tag `vX.Y.Z-beta.N` / `-rc.N`.
   - `dev`: GitHub Release with `prerelease: true` & tag `vX.Y.Z-dev` / `-dev.N` (built from the `dev` branch).
5. **Dev Extension Bus (`extensions.mjs`, `globalThis.__agyPrismExt`, `version: 1`) & Dev APIs (`dev_config.mjs`)**:
   - `registerLens(id, { render(data, ctx), order, position })`: add a custom pill inside the composer footer strip (`position`: `'start' | 'end'`).
   - `registerOverviewSection(id, { title, render(data, ctx), order })`: append a custom section card inside `Overview -> Telemetry` (`#ov-ext-root`).
   - `registerHeatmapTheme(id, { label, light: [6 hexes], dark: [6 hexes], ... })`: register a dynamic Insights heatmap palette.
   - `registerStyle(id, cssText)`: inject managed `<style data-agy-ext-style="...">` cleaned up on `unregister(id)` / `dispose()`.
   - `onSnapshot(fn)` / `onHeatmap(fn)`: subscribe to live telemetry/heatmap updates (returns unsubscribe callback).
   - `unregister(id)` / `list()` / `dispose()`.
   - Dev Sidecar endpoints (`POST` requires `X-Sidecar-Token` header or `token` query): `GET/POST /api/dev/config` (`overviewWidthPx` `0` or `320..520`, `uiFontScale` `0.85..1.25`, `customCssEnabled`, `insightsDefaultExpanded`, `enableUserExtensions`), `GET/POST /api/dev/custom-css`, `GET /api/dev/prompt`.

---

## 3. Common Development Commands

```powershell
# Run full Node test suite (must stay 0 failures)
node --test "test/*.test.mjs"

# Syntax check & whitespace check
node --check agy-prism-ui/sidecars/agy_prism_ui/server.mjs
git diff --check

# Sync local edits into ~/.gemini/config/plugins/agy-prism-ui (auto hot-reloads Antigravity)
.\install.bat
```

---

## 4. Copy-Ready Prompt for Other AI Agents

```markdown
You are working on **Agy Prism UI** (`agy-prism-ui`), a zero-dependency Node.js ESM Sidecar + CDP-injected UI plugin for Antigravity Desktop.

Key rules before editing:
1. Read `AI_DEV_GUIDE.md` first. Any code inside `createPresentation` (`ui.mjs`), `createOpticalThemeEngine` (`optical_theme.mjs`), `createOverviewRenderer` (`overview_ui.mjs`), `createHeatmapRenderer` (`heatmap_ui.mjs`), or `createExtensionBus` (`extensions.mjs`) is serialized with `.toString()` into Electron — keep all helpers inside those factories and bump their `version` + `get*Script()` guard when changed.
2. On stable, never widen `[data-testid="overview-panel"]` beyond native `320px`; on `dev`, respect `dev_config.json` overrides via `/api/dev/config` & `/api/dev/custom-css` and extend UI via `globalThis.__agyPrismExt` (`registerLens`, `registerOverviewSection`, `registerHeatmapTheme`, `registerStyle`, `onSnapshot`, `onHeatmap`). Never add external npm dependencies, and keep `.db` reads strictly read-only.
3. Keep `settings.mjs`, `ui.mjs` dictionaries (`en`, `zh-CN`, `zh-TW`), and `server.mjs` controls in sync.
4. After editing, run `node --test "test/*.test.mjs"` (require 0 failures) and sync locally with `scripts/manage-plugin.ps1 -Action install` (or `./install.sh` on macOS/Linux) to hot-reload.
```
