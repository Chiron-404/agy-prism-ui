# Agy Prism UI (`agy-prism-ui`)

[中文](./README.md) | **English** | [Changelog](./CHANGELOG.md)

> [!NOTE]
> **Provenance, Non-Originality & Credits (IMMO-CHIRON · GPL-3.0)**
> This repository is an **AI-assisted derivative modification** maintained by **IMMO-CHIRON** ([@Chiron-404](https://github.com/Chiron-404)) and is **NOT an original work built from scratch**:
> - **Primary Upstream Codebase**: Directly built upon and modified from **[Lumidarin/agy-capsule](https://github.com/Lumidarin/agy-capsule)** by [@Lumidarin](https://github.com/Lumidarin) (MIT License), including the SQLite/protobuf telemetry engine, CDP composer-footer capsule injector, quota/cache tracking, and installer scripts.
> - **Optical UI Design Inspiration**: Daylight/dark palettes, smoked-glass specular surfaces, Gemini prism halo marquee, and ink-fade motion were clean-room reimplemented after studying **[RMvdesi/obsidian-prism](https://github.com/RMvdesi/obsidian-prism)** by [@RMvdesi](https://github.com/RMvdesi) (GPL-3.0).
> - **Insights Heatmap Design Inspiration**: The compact Home activity strip and 52-week token usage heatmap were clean-room reimplemented inspired by **[rayeesoft/context-lens](https://github.com/rayeesoft/context-lens)** by [@rayeesoft](https://github.com/rayeesoft) (MIT License).
>
> This is an unofficial community derivative and is **not affiliated with or endorsed by any upstream author**. It is redistributed as a whole under **[GNU GPL-3.0](./LICENSE)**, preserving all upstream notices in [NOTICE](./NOTICE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

**Optical UI** (`Frost` / `Ivory` / `Noir` / `Graphite` palettes, frosted-glass surfaces, Gemini Prism halo marquee, and smooth stream fade-in), **Insights** (compact Home activity strip + 52-week dashboard & per-conversation token stats), **Overview Telemetry** panel, and **Prism Lens** (real-time context usage, model routing breakdown, multi-model quotas, cache status, and generation speed in the Antigravity composer footer). Hover any Lens to see its panel; click the Context Lens to expand Overview Telemetry.

## Highlights

- **Optical UI**: Light (`Frost`, `Ivory`) and Dark (`Noir`, `Graphite`) optical palettes, frosted-glass surfaces, Gemini Prism halo marquee, smooth stream fade-in, and collapsible/sticky code blocks.
- **Insights Dashboard**: Compact Home 14-day / 84-day activity strip, full 52-week heatmap dashboard (with daily requests, thinking, and estimated cost popover), and sidebar conversation token hover previews.
- **Overview Telemetry (`Overview → Telemetry`)**: Click the composer footer Context & Speed Lens to toggle Antigravity's right-hand Overview panel and expand the compact `Telemetry` drawer (kept at native `320px` width) with Step Model routing, context/cache breakdown, compaction and speed charts, and click-to-expand **Turn History** and **Request History**.
- **Prism Lens (Footer Telemetry Lenses)**: Includes Step Model, Context & Speed, Quota, and Error Lenses; the Step Model Lens displays the live active model, thinking effort tier (`Low` / `Medium` / `High` / `XHigh` / `auto`), step thinking tokens, and Orchestrator `Plan` / `Execute` / `Direct` routing breakdown.

## Context & Speed

Shows context usage percentage, cache hit rate, and cache status (limits are read live for the current session and model).

- **Cache expiry alert**: The Lens icon turns yellow three minutes after the last turn and red at four minutes to indicate an expired `Cache`; the panel's Cache row updates in sync.
- **Context overload alert**: The Lens percentage turns yellow above 75% and red above 90%.
- **Generation speed & indicator**: Shows the speed (`tok/s`) of the latest completed request; a breathing dot shifts color while generating (red below 10 tok/s, yellow from 10 to under 25, green at 25 and above) and holds its color for 15 seconds after stopping before turning gray.
- **Context breakdown, last request & turn metrics**: Splits context into `turn0`, `read`, `think`, and `write` with token counts and shares, alongside latest request duration (e.g. `4.5s–8.6s`) and cumulative turn stats.

## Quota

Shows the remaining 5-hour and weekly quotas and reset countdowns across matched model pools, automatically highlighting the active model pool and hiding absent quota windows.

**Vertex AI (Google Cloud pay-as-you-go):** When no subscription quota is returned and Antigravity confirms the account uses Cloud pay-as-you-go billing, the entire Quota Lens is hidden.

## Error alerts

An Error Lens appears automatically only when a request fails; hover or click it to inspect the raw error and classification (quota exhausted, rate limited `429`, disconnected, authentication error, service busy, or unknown reason).

## Sidebar Statistics

Open **… → Extensions → Agy Prism UI** from the conversation header to view the full **Statistics** pane.

## Installation

1. Download or pull this repository, then run the appropriate script:

   | Action | Windows | macOS / Linux |
   |---|---|---|
   | Install | `install.bat` | `sh install.sh` |
   | Update | `update.bat` (pull the latest code first) | `sh update.sh` (pull the latest code first) |
   | Uninstall | `uninstall.bat` | `sh uninstall.sh` |

   Install and update sync the plugin to <code>~/.gemini/config/plugins/agy-prism-ui</code> (<code>%USERPROFILE%\.gemini\config\plugins\agy-prism-ui</code> on Windows). Uninstall removes the plugin directory.
2. Enable **Agy Prism UI** in Antigravity's **Plugins** panel.
3. Open **… → Extensions → Agy Prism UI** from the conversation header.

After an update, the plugin restarts itself and reconnects the sidebar automatically.

### Enable the Debugging Port (UI Injection & Prism Lens)

**Optical UI, Insights, Overview Telemetry, and Prism Lens** attach to Antigravity through its local remote debugging port (CDP). Antigravity does not enable this port by default; without it, only the **Sidebar Statistics** pane is available and the sidebar shows a notice at the top. To enable it:

- **Windows installer prompt**: When running `install.bat` or `update.bat`, press Enter if prompted to add the debugging flag to your Antigravity shortcuts.
- **Windows one-step script**: Run the command below from the repository root to add `--remote-debugging-port=0` to Antigravity shortcuts on your desktop, Start menu, and taskbar (pass `-Undo` to revert):

  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts\enable-cdp.ps1
  ```
- **Manual setup**: Append ` --remote-debugging-port=0` to the end of the shortcut's **Properties → Target** on Windows, or launch on macOS with `open -a Antigravity --args --remote-debugging-port=0`.

> **Security note**: This port listens only on localhost (`127.0.0.1`) and is not exposed to the network. While open, other local programs on your computer can also inspect or control Antigravity windows through it.

### Troubleshooting

- **UI changes or Prism Lens still don't appear**: **Quit Antigravity completely** and relaunch it from an updated shortcut. Launches that bypass the shortcut will not carry the flag (for example: opening an `antigravity://` link or Explorer's "Open with Antigravity" when no window is running, self-restarts after an Antigravity auto-update, or an installer recreating shortcuts — re-run `enable-cdp.ps1` in that case).
- **Moved Antigravity on Windows**: Launch Antigravity once from its new location, then run `update.bat` so the plugin records the new path (no separate Node installation required). If the plugin still fails to start, quit Antigravity completely and reopen it.

## Metric definitions

- **Generation speed** = total output ÷ (TTFT + streaming time). It includes the wait for the first token.
- **Last request** covers only the most recent model request, not the whole turn; missing values show `—`.
- **Turn metrics** start at your latest message; elapsed time includes queueing, waiting and tool execution.
- **Cache expiry alerts are only a guide**: the cache state (yellow at 3 minutes, expired at 4) is estimated locally from the time since the last turn; actual cache hits depend on the server.

<details>
<summary>Details</summary>

**Last request**

- The speed's numerator is total output: response (including tool-call instructions) plus thinking. Incomplete or zero timings produce no speed.
- TTFT and streaming time come from Antigravity's records, and request duration is their sum, excluding tool execution. TTFT's timer start and first-token boundary are unverified, so it is not a prefill-only measurement.

**Turn metrics**

- Starts at the latest sent user message, including queueing; each new message resets the totals.
- Elapsed time uses wall-clock boundaries, including waits and tools. It advances locally while running and freezes at a known end; if a cancellation has no clear timestamp it shows unknown.
- Requests include recorded retries, excluding pure preflight and injected responses; unrecorded backend calls are not guaranteed to be covered.

</details>

## Development tests

Run the Node tests from the repository root. Playwright is not required:

```sh
node --test "test/*.test.mjs"
```

Browser regression tests are optional. With Playwright and Chromium installed, run `node test/browser-regressions.mjs` separately. For architecture invariants and copy-ready AI agent prompts, see [AI_DEV_GUIDE.md](./AI_DEV_GUIDE.md).

## Contributing

Issues and pull requests are welcome. See the [contribution guide](./CONTRIBUTING.md#english).

## Notices & Credits

1. **Provenance & Non-Originality Notice (`IMMO-CHIRON`)**: `Agy Prism UI` is an **AI-assisted derivative modification** maintained by **IMMO-CHIRON** ([@Chiron-404](https://github.com/Chiron-404)). It is not an original codebase written from scratch, and is neither affiliated with nor endorsed by any upstream author.
2. **Primary Upstream Codebase — [@Lumidarin](https://github.com/Lumidarin) ([agy-capsule](https://github.com/Lumidarin/agy-capsule), MIT License)**: The sidecar server, SQLite/protobuf conversation reader, CDP composer-footer injector, quota/cache monitors, settings/reload infrastructure, and install scripts are directly built upon and modified from `agy-capsule`. Per MIT terms, the original copyright (`Copyright (c) 2026 Lumidarin`) and license text are preserved in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md), alongside credits carried from upstream:
   - **Inspired by @z21100644 ([PR #1](https://github.com/Lumidarin/agy-capsule/pull/1))**: Multilingual support, panel visuals, click-to-pin, generation speed/effects, cache & quota tooltips, overload alerts, error classification, and engineering architecture.
   - **Inspired by @Krwaby123 ([PR #2](https://github.com/Lumidarin/agy-capsule/pull/2))**: Quota column alignment and page-translation overflow prevention.
3. **Optical UI Design Inspiration — [@RMvdesi](https://github.com/RMvdesi) ([obsidian-prism](https://github.com/RMvdesi/obsidian-prism), GPL-3.0-only)**: Palettes, smoked-glass surfaces, Gemini prism halo marquee, ink-fade motion, and foldable code blocks were clean-room implemented in [optical_theme.mjs](./agy-prism-ui/sidecars/agy_prism_ui/optical_theme.mjs) inspired by Obsidian Prism.
4. **Insights Heatmap Inspiration — [@rayeesoft](https://github.com/rayeesoft) ([context-lens](https://github.com/rayeesoft/context-lens), MIT License)**: The 52-week token activity heatmap and usage breakdown design were clean-room implemented in [heatmap.mjs](./agy-prism-ui/sidecars/agy_prism_ui/heatmap.mjs) and [heatmap_ui.mjs](./agy-prism-ui/sidecars/agy_prism_ui/heatmap_ui.mjs) inspired by Context Lens.
5. **AI Assistance & Code Review**:
   - **Google Antigravity (Gemini)**: Assisted with core modifications, clean-room implementation of Optical UI, Insights, and Overview Telemetry, testing, and repository tooling.
   - **OpenAI Codex / ChatGPT**: Provided independent code review for redundancy, race conditions, and edge-case robustness.

## License

[GNU GPL-3.0](./LICENSE) — `Copyright (C) 2026 IMMO-CHIRON`

This derivative work as a whole is licensed under the **GNU General Public License v3.0 (GPL-3.0)**, incorporating modified MIT-licensed source code from `Lumidarin/agy-capsule`. Full upstream notices and license texts are preserved in [NOTICE](./NOTICE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
