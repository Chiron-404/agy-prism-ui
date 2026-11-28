# 更新日志 / Changelog

本文件按时间倒序记录 **Agy Prism UI (`agy-prism-ui`)** 各正式版本面向用户的功能更新、视觉优化与稳定性修复。

This file documents user-facing feature additions, visual refinements, and stability fixes for **Agy Prism UI (`agy-prism-ui`)** in reverse chronological order.

---

## v2.1.0-pre-dev (Dev Channel) — 2026-11-28

### 中文

- **融合 `v2.1.0-pre` 全模块四语言支持 + `dev` 开发者扩展能力**：完整继承 `v2.1.0-pre` 的简体中文 / 繁體中文 / English / 日本語四语适配及 Insights「外观」语言切换器，同时保留 `dev` 通道的侧栏「设置」页、`globalThis.__agyPrismExt` 运行时扩展总线、自定义 CSS/覆写开关与 AI 开发 Prompt 一键复制功能。

### English

- **Combines `v2.1.0-pre` 4-Locale UI + `dev` Extension Platform**: Includes complete Simplified Chinese, Traditional Chinese, English, and Japanese localization and the Insights Appearance language switcher alongside the `dev` channel Settings tab, `globalThis.__agyPrismExt` extension bus, custom CSS/overrides, and copy-ready AI dev prompt.

---

## [v2.1.0-pre](https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.1.0-pre) (Preview) — 2026-11-28

### 中文

- **全模块四语言适配（`zh-CN` / `zh-TW` / `en` / `ja`）**：为 `settings.mjs`、`ui.mjs`、`turn_ui.mjs`、`heatmap_ui.mjs`（Insights 52 周看板、首页卡片、更新与外观浮窗）及 `optical_theme.mjs`（长代码块折叠按钮）完整补齐 **简体中文、繁體中文、English、日本語** 四套语言支持，彻底移除 Insights 中的硬编码简体中文。
- **Insights「外观」浮窗内置语言切换器**：在 Insights 顶部「外观」浮窗新增轻量语言切换行（`简中` / `繁中` / `EN` / `日本語`），切换后实时同步更新 Prism Lens、Overview Telemetry、Insights 看板、首页活动卡片与代码块按钮文案。
- **窄宽与长文案多语言防溢出优化**：针对英文与日文文案宽度调优 `Overview → Telemetry`（锁定原生 `320px`）、上下文与速率浮窗、外观浮窗与更新浮窗布局，确保四语言均无换行错位或文字遮挡。

### English

- **Full 4-Locale Multilingual Support (`zh-CN` / `zh-TW` / `en` / `ja`)**: Added complete **Simplified Chinese, Traditional Chinese, English, and Japanese** dictionaries across `settings.mjs`, `ui.mjs`, `turn_ui.mjs`, `heatmap_ui.mjs` (Insights 52-week dashboard, Home card, Appearance & Update popovers), and `optical_theme.mjs` (code block fold controls), eliminating all hardcoded Simplified Chinese strings from Insights.
- **In-Popover Language Switcher in Insights Appearance**: Added a compact language selector (`简中` / `繁中` / `EN` / `日本語`) inside the Insights **Appearance** popover that updates Prism Lens, Overview Telemetry, Insights, Home card, and code-folding labels live.
- **Multilingual Layout Hardening**: Tuned popover and `320px` `Overview → Telemetry` spacing/wrapping across compact (`zh-*`) and wide (`en`, `ja`) locales for zero text overlap or horizontal clipping.

---

## [v2.0.3-dev](https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.0.3-dev) — 2026-11-28 (Dev Channel)

### 中文

- **恢复并增强侧栏设置页**：在 `… → Extensions → Agy Prism UI` 中开放「统计 / 设置」双页切换，支持界面外观、上下文列排序、更新通道检测与一键热更新操作。
- **扩展总线与高可自定义性**：新增运行时扩展接口 `window.__agyPrismExt`（支持注册自定义底栏透镜、Overview 卡片、Insights 热力图色盘、受控样式与数据监听），并支持注入自定义 CSS、调整 Overview 宽度与底栏缩放比例。
- **AI 开发 Prompt 一键复制**：设置页内置「复制 AI 开发 Prompt」按钮，可携带当前安装路径、接口说明与热重载指令，方便其他 AI Agent 直接理解并二次开发插件。

### English

- **Restored & Enhanced Sidebar Settings Tab**: Re-enabled the **Statistics / Settings** switcher in `… → Extensions → Agy Prism UI` with appearance controls, context field ordering, and integrated updater controls.
- **Runtime Extension Bus & High Customizability**: Added `globalThis.__agyPrismExt` (custom lenses, Overview cards, Insights heatmap themes, managed CSS, and snapshot/heatmap hooks) alongside custom `custom.css` injection, Overview width tuning, and composer font scaling.
- **One-Click AI Agent Prompt**: Added a **Copy AI Dev Prompt** button inside Settings exporting the live install path, extension API, and hot-reload workflow for external AI coding agents.

---

## [v2.0.3](https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.0.3) — 2026-11-28

### 中文

- **Overview Telemetry 悬停与箭头动效对齐原生**：对齐 Antigravity 原生 `Subagents` / `Artifacts` 交互风格，悬停时取消灰底并提亮标题与状态为黑色实显，折叠箭头紧跟在徽章右侧、平时隐藏并在悬停/聚焦时渐显及旋转 `90°`。
- **修复上下文与速率浮窗文字挤占**：适当放宽浮窗宽度（并针对英文等长文本语言自动预留宽度），精简浮窗内重复会话前缀、改用弹性换行排版，解决长耗时与均速（`tok/s`）重叠问题，同时为 `v2.1.0` 多语言适配预留布局与词典基础。
- **内置三通道更新器与一键热更新**：
  - 在 Insights 顶栏新增独立 **「更新」** 按钮与毛玻璃浮窗（检测到新版本时在首页卡片与顶栏显示轻提示），支持 **正式版（`stable`）**、**预览版（`preview`）** 与 **开发版（`dev`）** 三条通道切换；
  - 支持每日 **09:00 / 19:00** 定时自动检查（含休眠/重启错过时段补检，可随时开关），也可点击「立即检查」手动检查；
  - 发现新版或跨通道切换时提供 **「一键更新 / 一键切换」**，校验 SHA-256 后自动下载、安全替换并热重载（保留非 ASCII 路径兼容与异常自动回滚）；
  - 更新检测支持 `ETag` (`If-None-Match` / `304`) 缓存及无 API 限流限制的 `releases.atom` 自动回退，切换通道优先复用已缓存结果，避免触发 GitHub API `403` 限流。
- **新增 AI 开发者参考指南**：新增 [AI_DEV_GUIDE.md](./AI_DEV_GUIDE.md)，梳理模块结构、运行约束与可直接复制的 AI Agent 开发提示词。

### English

- **Native `Subagents`/`Artifacts`-Style Hover & Chevron on Overview Telemetry**: Removed the hover gray background, sharpened the title/badge hover contrast to full opacity, and moved the chevron inline right next to the badge so it stays hidden at rest and fades in + rotates `90°` on hover/focus/expand.
- **Fixed Context & Speed Popover Text Overlap (+ v2.1.0 i18n Headroom)**: Widened the popover (`264px` / `278px` for wider languages), hid the redundant session label prefix inside the compact summary row, and switched the request/session speed row to flex-wrap with ellipsis clamping to eliminate overlaps and prepare layout headroom for upcoming `v2.1.0` multilingual support.
- **Built-in 3-Channel Updater & One-Click Hot Update**:
  - Added an **Update** button and frosted-glass popover in the Insights topbar (plus a subtle Home banner pill when an upgrade is ready), supporting **Stable**, **Preview**, and **Dev** channels;
  - Supports scheduled daily checks at **09:00 & 19:00** (including startup catch-up if missed, toggleable) as well as manual checks;
  - Provides **One-Click Update / Switch** with SHA-256 verification, pure-Node ZIP extraction, automatic non-ASCII Windows sidecar preservation, rollback protection, and instant hot-reload;
  - Uses `ETag` (`If-None-Match` / `304`) caching, avoids redundant checks when switching channels, and automatically falls back to GitHub's zero-rate-limit `releases.atom` feed if the REST API returns `403`/`429`.
- **Added AI Developer Guide**: Added [AI_DEV_GUIDE.md](./AI_DEV_GUIDE.md) documenting the architecture, serialization invariants, and a copy-ready prompt for AI coding agents.

---

## [v2.0.2](https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.0.2) — 2026-11-28

### 中文

- **Insights 热力图动态颜色分级**：根据实际每日用量上下限自动划分 4–8 档色阶，并在深浅色全部 6 套主题配色中平滑插值，解决高用量日与次高日相差悬殊却显示相同颜色的问题。
- **图例区间悬停提示**：将鼠标移到热力图 `少 … 多` 图例的任意色块上，即可查看该档位对应的精确 Token 范围。
- **极端值与刷新体验优化**：单日极高用量不再压平其余普通日期的色阶层次，相近用量日期也不会被过度拉开反差；后台数据刷新与首页卡片同步更加稳健。

### English

- **Dynamic Range-Adaptive Insights Heatmap Grading**: Automatically chooses 4–8 active intensity tiers based on your actual `[min, max]` daily token range and smoothly interpolates colors across all 6 light/dark themes, ensuring high-usage days and secondary peaks remain visually distinct.
- **Exact Range Tooltips on Legends**: Hover any swatch in the `Less … More` heatmap legend to inspect the exact token interval for that tier.
- **Outlier Balance & Refresh Stability**: Single extreme-usage days no longer flatten the contrast of normal days, near-equal days are not exaggerated, and background refreshes stay smoothly in sync on both Home and Dashboard views.

---

## [v2.0.1](https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.0.1) — 2026-11-27

### 中文

- **主页 Insights 展开/收起体验优化**：修复展开或收起时棱镜流光跳变的问题，改为平滑高度过渡并与下方输入框的光效坐标实时联动。
- **交互与稳定性加固**：后台数据轮询刷新时保持主页卡片当前的展开状态、按钮焦点与动画不中断；优化日期浮层点击关闭与 `Esc` 退出清理，并修复部分环境下的本地存储与缓存命中率边界问题。

### English

- **Smooth Home Insights Prism-Glow & Expand/Collapse**: Eliminated pointer-glow jumps during Home Insights expand/collapse transitions with an in-place smooth height transition synchronized frame-by-frame with the composer halo below.
- **Lifecycle & Robustness Hardening**: Preserved live Home card state, keyboard focus, and ongoing animations across background polling updates; improved popover dismissal (`Esc` / outside click) and edge-case resilience for storage and cache metrics.

---

## [v2.0.0](https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.0.0) — 2026-11-27

### 中文

- **Optical UI 光学界面**：提供白昼（`Frost`）/ 晨光（`Ivory`）浅色与午夜（`Noir`）/ 暮色（`Graphite`）深色光学配色、通透玻璃质感、Gemini 棱镜流光边框、流式输出渐现动效与长代码块折叠/吸顶工具栏。
- **Insights 活动热力图**：首页紧凑 14 天 / 12 周活动卡片、完整 52 周热力图看板（周日置顶、6 套主题色盘、累计 Token 悬停明细、单日用量/请求/思考/估算费用浮窗）以及侧边栏会话悬停用量预览。
- **Overview Telemetry 面板**：点击底栏上下文透镜即可一键开关右侧 `Overview → Telemetry` 抽屉（保持原生 `320px` 宽度），查看模型路由分工、上下文明细、压缩与速度曲线及可展开的轮次/请求历史。
- **Prism Lens 底栏透镜**：包含模型路由、上下文与速度、配额与报错四类透镜，支持 4 级窄宽自适应降级；支持 Windows / macOS / Linux 一键安装与自动热重载更新。

### English

- **Optical UI**: Light (`Frost`, `Ivory`) and Dark (`Noir`, `Graphite`) optical palettes, frosted-glass surfaces, Gemini Prism pointer/typing/queued halo marquee, smooth stream fade-in, and collapsible/sticky code blocks.
- **Insights Dashboard**: Compact Home 14-day / 12-week activity strip, full 52-week heatmap dashboard (Sunday-aligned, 6 themes, total-token hover breakdown, daily requests/thinking/cost popover), and sidebar conversation token hover previews.
- **Overview Telemetry Drawer**: Click the composer Context & Speed Lens to toggle Antigravity's right-hand `Overview → Telemetry` drawer (kept at native `320px` width) with Step Model routing, context/cache breakdown, compaction/TPS charts, and expandable Turn & Request History.
- **Prism Lens (Composer Footer Telemetry)**: Step Model, Context & Speed, Quota, and Request Failure Lenses with 4-level narrow-width fallback, plus one-click install and automatic hot-reload updates on Windows, macOS, and Linux.
