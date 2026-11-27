# Third-Party Notices & Upstream Licenses

`Agy Prism UI` (`Copyright (C) 2026 IMMO-CHIRON`, [@Chiron-404](https://github.com/Chiron-404), released under [GNU GPL-3.0](./LICENSE)) incorporates and/or draws inspiration from the following open-source projects. Original copyright notices and full license texts required for redistribution are preserved below.

---

## 1. `Lumidarin/agy-capsule` (Primary Upstream Codebase)

- **Repository**: <https://github.com/Lumidarin/agy-capsule>
- **Author / Copyright**: `Copyright (c) 2026 Lumidarin`
- **License**: MIT License
- **Attribution**: Substantial portions of `Agy Prism UI`—including the sidecar HTTP/SSE transport, SQLite/protobuf conversation telemetry parsing, Antigravity DevTools (CDP) injection runtime, composer footer quota/context/error capsules, multi-language presentation core (`server.mjs`, `deck_injector.mjs`, `ui.mjs`, `errors.mjs`, `metrics.mjs`, `turn_metrics.mjs`, `turn_ui.mjs`, `sqlite_cache.mjs`, `host_bridge.mjs`, `reload.mjs`, `settings.mjs`), installation/CDP helper scripts (`scripts/`, `*.bat`, `*.sh`), and original test suites—are adapted and modified directly from `Lumidarin/agy-capsule` (including ideas/fixes previously credited upstream to `@z21100644` in PR #1 and `@Krwaby123` in PR #2). Per MIT terms, the original copyright and permission notice are preserved verbatim below and redistributed within this project under GNU GPL-3.0:

```text
MIT License

Copyright (c) 2026 Lumidarin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. `RMvdesi/obsidian-prism` (Optical UI Visual & Interaction Inspiration)

- **Repository**: <https://github.com/RMvdesi/obsidian-prism>
- **Author / Copyright**: `Copyright (C) 2026 RMvdesi`
- **License**: GNU General Public License v3.0 (`GPL-3.0-only`)
- **Attribution**: The Optical UI themes (`Crystal`, `Alabaster`, `Obsidian`, `Warm Charcoal`), smoked-glass surface bevels, Gemini prism-spectrum halo marquee (`pointermove` / typing / queued states), streaming ink-fade animation, and collapsible code block toolbar in `optical_theme.mjs` were clean-room implemented inspired by `RMvdesi/obsidian-prism`. No source files or All-Rights-Reserved `prism-periodic-console` assets from that repository were copied, and this project is licensed under GNU GPL-3.0 in full compatibility with `obsidian-prism`.

---

## 3. `rayeesoft/context-lens` (Insights Heatmap & Usage Breakdown Inspiration)

- **Repository**: <https://github.com/rayeesoft/context-lens>
- **Author / Copyright**: `Copyright (c) 2026 rayeesoft`
- **License**: MIT License
- **Attribution**: The 52-week token activity heatmap, Home compact activity strip, per-day/per-conversation token & estimated cost breakdown UI in `heatmap.mjs` and `heatmap_ui.mjs` were clean-room implemented inspired by the feature design documented in `rayeesoft/context-lens`. No source files from `context-lens` were copied.
