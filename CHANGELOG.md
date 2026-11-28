# 更新日志 / Changelog

本文件按时间倒序记录 **Agy Prism UI (`agy-prism-ui`)** 各正式版本面向用户的功能更新、视觉优化与稳定性修复。

This file documents user-facing feature additions, visual refinements, and stability fixes for **Agy Prism UI (`agy-prism-ui`)** in reverse chronological order.

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
