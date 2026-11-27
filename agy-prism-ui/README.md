# Agy Prism UI (`agy-prism-ui` · v2.0.0)

> **Provenance, Non-Originality & Credits (`IMMO-CHIRON` · `GNU GPL-3.0`)**
>
> This plugin is an **AI-assisted derivative modification** maintained by **IMMO-CHIRON** ([@Chiron-404](https://github.com/Chiron-404)). It is **NOT an original project written from scratch**, nor is it an official release of or endorsed by any upstream author below:
> - **Primary Upstream Codebase**: Built upon [@Lumidarin](https://github.com/Lumidarin)'s **[agy-capsule](https://github.com/Lumidarin/agy-capsule)** (`Copyright (c) 2026 Lumidarin`, MIT License), redistributed here under **GNU GPL-3.0**.
> - **Optical UI Design Inspiration**: Clean-room reimplemented after studying [@RMvdesi](https://github.com/RMvdesi)'s **[obsidian-prism](https://github.com/RMvdesi/obsidian-prism)** (`Copyright (C) 2026 RMvdesi`, GPL-3.0-only).
> - **Insights Heatmap Inspiration**: Clean-room reimplemented inspired by [@rayeesoft](https://github.com/rayeesoft)'s **[context-lens](https://github.com/rayeesoft/context-lens)** (`Copyright (c) 2026 rayeesoft`, MIT License).

Optical UI, Prism halo marquee, Insights activity dashboard, Overview Telemetry drawer, and **Prism Lens** real-time composer-footer telemetry for Antigravity Desktop.

## Highlights

- **Optical UI**: Light (`Frost`, `Ivory`) and Dark (`Noir`, `Graphite`) optical palettes, frosted-glass surfaces, Gemini Prism pointer/typing/queued halo marquee, smooth stream fade-in, and sticky/foldable code blocks (`optical_theme.mjs`).
- **Insights**: Compact Home activity strip (`1×14` / `6×14` with blue default gradient), full 52-week dashboard (`Sun / Tue / Thu / Sat`), daily requests/thinking/cost popover, and per-conversation token & cost breakdown in sidebar hover previews.
- **Overview Telemetry (`Overview → Telemetry`)**: Clicking the composer Context & Speed Lens toggles Antigravity's right-hand Overview panel and expands the compact `Telemetry` drawer (kept cleanly at native `320px` panel width), showing Step Model routing, context/cache breakdown, context & TPS trend charts, and click-to-expand **Turn History** and **Request History** drawers (`overview_ui.mjs`).
- **Prism Lens (Composer Footer & Popovers)**:
  - **Step Model Lens**: Displays live active model, thinking effort tier (`Low` / `Medium` / `High` / `XHigh` / `auto`), step thinking tokens, and Orchestrator `Plan` / `Execute` / `Direct` routing breakdown.
  - **Context & Speed Lens**: Live context usage %, generation speed (`tok/s`), breathing speed dot, cache expiry indicator (`3m` / `4m+`), overload warning (`75%` / `90%+`), and click-to-open Overview Telemetry shortcut.
  - **Quota Lens**: Matched model pool quotas (`5 Hours` and `Weekly`) with reset countdowns (automatically hidden on Cloud pay-as-you-go accounts).
  - **Request Failure Lens**: Appears when a request fails, classifying `Quota exhausted`, `Rate limited` (`429`), `Disconnected`, `Authentication error`, `Service busy`, or `Unknown reason` with raw diagnostics.
  - **4-level narrow-width fallback**: Degrades progressively on narrow composers while prioritizing speed visibility and zero overlap.

## Extensions Statistics Pane (`… → Extensions → Agy Prism UI`)

- Displays the full **Statistics** view (Step Model routing, Context/Cache breakdown, Quotas, Compaction/TPS charts, and expandable Turn/Request history).

## Telemetry & Metric Definitions

- **Ground-truth SQLite telemetry**: Reads exact API token counts (`uncached_input`, `cached_input`, `output_tokens`, `thinking_tokens`) from `~/.gemini/antigravity/conversations/<id>.db` (`%USERPROFILE%\.gemini\antigravity\conversations\<id>.db` on Windows) and resolves context limits dynamically from model metadata.
- **Compaction-aware breakdown**: Computes active context usage from the latest billed turn (`uncached_input + cached_input`) and resets 4-category accumulation (`Turn0`, `Read`, `Think`, `Write`) at the latest compaction checkpoint (`step_type = 23` or token-drop fallback).
- **Generation speed**: `total output ÷ (TTFT + streaming time)` for the latest completed model request (`output = reply + thinking`; excludes tool execution; missing or zero timings yield `—`).
- **Turn metrics**: Aggregates elapsed wall-clock time (including queueing, waits, and tool execution), request count (recorded retries included; pure preflight/injected responses excluded), `Write`, and `Think` tokens starting from the latest sent user message.
- **Cache expiry estimate**: The 3m warning / 4m cold status is estimated locally from elapsed time since the last recorded step; actual cache hits depend on the server.

## Install / Update / Uninstall

Run the scripts from the repository root:

| Action | Windows | macOS / Linux |
|---|---|---|
| Install | `install.bat` | `sh install.sh` |
| Update | `update.bat` *(pull latest code first)* | `sh update.sh` *(pull latest code first)* |
| Uninstall | `uninstall.bat` | `sh uninstall.sh` |

- Install and update sync this plugin directory to `~/.gemini/config/plugins/agy-prism-ui` (`%USERPROFILE%\.gemini\config\plugins\agy-prism-ui` on Windows).
- **Self-reload watcher**: Polls installed runtime files every 1s (honoring `.update-in-progress` batch markers) and restarts cleanly after a 1.5s settle period.

## Credits & Upstream Notices

- **Primary Upstream Codebase — [Lumidarin/agy-capsule](https://github.com/Lumidarin/agy-capsule)** (`Copyright (c) 2026 Lumidarin`, MIT License): Core sidecar telemetry, SQLite/protobuf parser, CDP footer injector, settings store, self-reload watcher, and install scripts are derived from `agy-capsule` and redistributed under GNU GPL-3.0. Carries forward upstream credits to [z21100644's PR #1](https://github.com/Lumidarin/agy-capsule/pull/1) and [Krwaby123's PR #2](https://github.com/Lumidarin/agy-capsule/pull/2).
- **Optical UI Inspiration — [RMvdesi/obsidian-prism](https://github.com/RMvdesi/obsidian-prism)** (`Copyright (C) 2026 RMvdesi`, GPL-3.0-only): Optical palettes, smoked-glass surfaces, Gemini Prism halo marquee, ink-fade motion, and foldable code blocks were clean-room implemented in `optical_theme.mjs`.
- **Insights Heatmap Inspiration — [rayeesoft/context-lens](https://github.com/rayeesoft/context-lens)** (`Copyright (c) 2026 rayeesoft`, MIT License): 52-week token activity heatmap and usage/cost breakdown were clean-room implemented in `heatmap.mjs` / `heatmap_ui.mjs`.
- **AI Assistance & Code Review**: Developed with **Google Antigravity (Gemini)** (core modifications, clean-room Optical UI / Insights / Overview Telemetry, tests) and audited with **OpenAI Codex / ChatGPT** (independent code review & robustness audit).

## License

**[GNU GPL-3.0](./LICENSE)** — `Copyright (C) 2026 IMMO-CHIRON`

Full upstream license texts and copyright notices are preserved in **[NOTICE](./NOTICE)** and **[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)**.
