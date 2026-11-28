# Agy Prism UI (`agy-prism-ui`)

**中文** | [English](./README.en.md) | [更新日志](./CHANGELOG.md)

> [!NOTE]
> **来源、非原创声明与致谢（IMMO-CHIRON · GPL-3.0）**
> 本项目由 **IMMO-CHIRON** ([@Chiron-404](https://github.com/Chiron-404)) 借助 AI 辅助进行二次开发与改版，**核心功能与源码并非从零原创**：
> - **核心代码底座**：直接基于 [@Lumidarin](https://github.com/Lumidarin) 的 **[agy-capsule](https://github.com/Lumidarin/agy-capsule)**（MIT License）修改扩展（含 SQLite/protobuf 遥测解析、CDP 底栏胶囊注入、配额与缓存监控及安装脚本）。
> - **光学视觉灵感**：Optical UI 配色、烟熏玻璃切面、棱镜边框流光与水墨微动效参考自 [@RMvdesi](https://github.com/RMvdesi) 的 **[obsidian-prism](https://github.com/RMvdesi/obsidian-prism)**（GPL-3.0），在本项目中进行了轻量化净室重实现。
> - **热力图灵感**：Insights 首页活动条与 52 周 Token 活跃热力图交互参考自 [@rayeesoft](https://github.com/rayeesoft) 的 **[context-lens](https://github.com/rayeesoft/context-lens)**（MIT License），数据统计逻辑于本项目中独立实现。
>
> 本项目为独立衍生修改版本，**非任何上述原项目的官方发行版，亦未获得原作者背书**；衍生作品整体遵循 **[GNU GPL-3.0](./LICENSE)** 开源发布，完整上游版权声明见 [NOTICE](./NOTICE) 与 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

为 Antigravity 桌面端提供 **Optical UI（白昼/午夜光学配色、通透玻璃质感、Gemini 棱镜流光与流式渐现动效）**、**Insights（首页近 14 天活动条、52 周热力图与会话用量统计）**、**Overview 会话遥测展开面板** 以及 **Prism Lens（输入框底栏实时遥测透镜）**（上下文占用、模型路由分工、多模型配额、缓存状态和生成速度）。悬停透镜即可查看面板详情，点击上下文透镜可一键展开右侧 Overview Telemetry 面板。

## 核心特性

- **Optical UI**：浅色（`Frost` 白昼 / `Ivory` 晨光）与深色（`Noir` 午夜 / `Graphite` 暮色）光学配色、通透玻璃质感、Gemini 棱镜流光、流式输出渐现动效与长代码块折叠/吸顶工具栏。
- **Insights 活动热力图**：首页紧凑 14 天 / 84 天活动条、完整 52 周热力图面板（含每日请求/思考/估算费用浮窗）与会话列表悬停用量预览。
- **Overview 会话遥测（`Overview → Telemetry`）**：点击输入框底栏上下文/速度透镜一键开关右侧 Overview 面板并展开紧凑的 `Telemetry` 面板（保持原生 320px 宽度），内含模型路由分工、上下文/缓存明细、压缩与速度趋势图，以及可点击展开/折叠的「轮次历史」与「请求历史」。
- **Prism Lens（底栏遥测透镜）**：由模型路由（Step Model）、上下文与速度、额度、报错四类透镜组成；模型路由透镜实时展示当前活跃模型、思考强度档位（`Low` / `Medium` / `High` / `XHigh` / `auto`）、单步思考 token 以及 Orchestrator 的 `Plan` / `Execute` / `Direct` 路由占比。

## 上下文与速度

显示上下文占用百分比、缓存命中率与缓存状态（上限按当前会话和模型实时读取）。

- **缓存过期提醒**：透镜图标距上一轮满 3 分钟变黄，满 4 分钟变红提示 `Cache` 过期，面板里的 Cache 行同步变化。
- **上下文过载提醒**：上下文超过 75% 时透镜数字变黄，超过 90% 时变红。
- **生成速度与速度动效**：显示最近一次已完成请求的速度（`tok/s`）；模型生成时呼吸圆点按速度变色（低于 10 tok/s 红色，10 至低于 25 黄色，25 及以上绿色），结束后保持颜色 15 秒再变灰。
- **上下文明细、最近请求与本轮统计**：将上下文拆分为首轮、读取、思考、写入四部分展示数值和占比，并显示最近一次请求耗时（如 `4.5s–8.6s`）及本轮累计指标。

## 额度

显示匹配模型池的 5 小时与每周剩余额度及重置倒计时，自动高亮当前所选模型池并隐藏不存在的配额窗口。

**Vertex AI（Google Cloud 按量计费）**：当未返回套餐额度且 Antigravity 确认账号使用 Cloud 按量计费时，自动隐藏整个额度透镜。

## 报错提示

仅在请求失败时自动弹出报错透镜，悬停或点击可在面板查看原始报错与分类说明（额度耗尽、限流 429、断连、验证异常、服务繁忙、未知原因）。

## 侧栏统计

在对话顶部 **… → Extensions → Agy Prism UI** 打开侧栏，可查看完整的会话**统计**视图。

## 安装

1. 下载或拉取仓库后，运行对应脚本：

   | 操作 | Windows | macOS / Linux |
   |---|---|---|
   | 安装 | `install.bat` | `sh install.sh` |
   | 更新 | `update.bat`（先拉取新版代码） | `sh update.sh`（先拉取新版代码） |
   | 卸载 | `uninstall.bat` | `sh uninstall.sh` |

   安装／更新会将插件同步到 <code>~/.gemini/config/plugins/agy-prism-ui</code>（Windows 为 <code>%USERPROFILE%\.gemini\config\plugins\agy-prism-ui</code>）。卸载会删除插件目录。
2. 在 Antigravity 的 **Plugins** 面板启用 **Agy Prism UI**。
3. 在对话顶部的 **… → Extensions → Agy Prism UI** 打开侧栏。

更新后插件会自动重启并重连侧栏，无需手动操作。

### 启用调试端口（界面注入与 Prism Lens）

**Optical UI、Insights 活动热力图、Overview Telemetry 面板与 Prism Lens（底栏透镜）** 均通过 Antigravity 的本机调试端口（CDP）注入界面。Antigravity 默认不开启该端口；未开启时仅「侧栏统计」可用，且侧栏顶部会提示未启用。开启方式：

- **Windows 安装引导**：运行 `install.bat` 或 `update.bat` 时，若检测到 Antigravity 快捷方式未带参数，会提示是否自动添加，按回车即可。
- **Windows 一键脚本**：如需事后补设，可在仓库目录运行以下命令，为桌面、开始菜单与任务栏的 Antigravity 快捷方式添加 `--remote-debugging-port=0`（加 `-Undo` 可撤销）：

  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts\enable-cdp.ps1
  ```
- **手动设置**：在 Antigravity 快捷方式「属性 → 目标」末尾追加 ` --remote-debugging-port=0`；macOS 可使用 `open -a Antigravity --args --remote-debugging-port=0` 启动。

> **安全说明**：该端口仅监听本机回环地址（`127.0.0.1`），不会暴露至局域网或公网；开启期间，本机其他程序也可通过它调试或控制 Antigravity 窗口。

### 常见问题

- **改完参数后界面仍未生效**：请**完全退出** Antigravity 再从已配置参数的快捷方式启动。以下方式不会携带快捷方式参数，需重启或重新运行一次 `enable-cdp.ps1`：无运行窗口时通过 `antigravity://` 链接或资源管理器右键启动；Antigravity 自动更新后自行重启；安装程序重建了快捷方式。
- **Windows 移动了 Antigravity 安装目录**：先从新位置打开一次 Antigravity，再运行 `update.bat` 重新记录启动路径（无需额外安装 Node）；若插件仍未启动，完全退出 Antigravity 后重新打开即可。

## 数据口径

- **生成速度** = 总输出 ÷（TTFT + 流式耗时），包含等待首 token 的时间。
- **最近请求**只看最近一次模型请求，不是整轮；缺失的数据显示 `—`。
- **本轮统计**从你最近一条消息开始累计，耗时包含排队、等待和工具执行。
- **缓存过期提醒仅供参考**：缓存状态（3 分钟变黄 / 4 分钟过期）系根据距上一轮对话的时间间隔本地估算，实际命中情况以服务端为准。

<details>
<summary>详细说明</summary>

**最近请求**

- 速度的分子是总输出，等于回复（含工具调用指令）加思考。计时不全或分母为零时，不计算速度。
- TTFT 和流式耗时都取自 Antigravity 的记录，请求耗时是两者之和，不含工具执行。TTFT 的计时起点和首 token 的判定边界尚未确认，不能当作纯 prefill 耗时。

**本轮统计**

- 从最近一条已发送的用户消息开始，包含排队时间；新消息重新累计。
- 耗时用首尾时间相减，包含等待和工具；运行中本地计时，结束后固定，取消且缺少明确时间则显示未知。
- 请求数包含已记录的重试，不含纯预检和注入回复，不保证覆盖未记录的后端调用。

</details>

## 开发测试

在仓库根目录运行 Node 测试，无需安装 Playwright：

```sh
node --test "test/*.test.mjs"
```

浏览器回归是可选的。装好 Playwright 和 Chromium 后，可单独运行 `node test/browser-regressions.mjs`。面向开发者与 AI Agent 的架构规范及提示词见 [AI_DEV_GUIDE.md](./AI_DEV_GUIDE.md)。

## 贡献

欢迎提 Issue 和 PR，详见[贡献指南](./CONTRIBUTING.md#中文)。

## 声明与致谢

1. **非原创与衍生声明（IMMO-CHIRON）**：本项目由 **IMMO-CHIRON** ([@Chiron-404](https://github.com/Chiron-404)) 借助 AI 辅助对上游开源项目进行二次开发与改版，并非独立原创作品，亦非任何原项目的官方版本。
2. **核心代码底座 — [@Lumidarin](https://github.com/Lumidarin) ([agy-capsule](https://github.com/Lumidarin/agy-capsule), MIT License)**：本项目的 Sidecar 服务端架构、SQLite/protobuf 对话遥测读取、CDP 底栏胶囊注入、配额/缓存监测与安装维护脚本均直接基于 `agy-capsule` 修改扩展；依 MIT 协议条款，原版权声明（`Copyright (c) 2026 Lumidarin`）与许可全文完整保留于 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。同时保留原项目对以下贡献者的致谢：
   - **参考 @z21100644 ([PR #1](https://github.com/Lumidarin/agy-capsule/pull/1))**：多语言、部分面板视觉、点击固定、生成指标与速度动效、缓存/配额提示与工程优化思路。
   - **参考 @Krwaby123 ([PR #2](https://github.com/Lumidarin/agy-capsule/pull/2))**：网页翻译插件下配额面板对齐与不翻译属性改进建议。
3. **光学视觉灵感 — [@RMvdesi](https://github.com/RMvdesi) ([obsidian-prism](https://github.com/RMvdesi/obsidian-prism), GPL-3.0-only)**：Optical UI 的深浅配色、烟熏玻璃切面、Gemini 棱镜微光动效与代码块工具栏参考自 Obsidian Prism 视觉设计，于 [optical_theme.mjs](./agy-prism-ui/sidecars/agy_prism_ui/optical_theme.mjs) 中净室独立实现。
4. **热力图灵感 — [@rayeesoft](https://github.com/rayeesoft) ([context-lens](https://github.com/rayeesoft/context-lens), MIT License)**：Insights 的 52 周活跃热力图与费用分解展示形态参考自 Context Lens，于 [heatmap.mjs](./agy-prism-ui/sidecars/agy_prism_ui/heatmap.mjs) 与 [heatmap_ui.mjs](./agy-prism-ui/sidecars/agy_prism_ui/heatmap_ui.mjs) 中独立实现。
5. **AI 协作致谢**：
   - **Google Antigravity (Gemini)**：参与核心功能改版、Optical UI / Insights / Overview Telemetry 净室实现、测试与仓库工程化配置。
   - **OpenAI Codex / ChatGPT**：参与独立代码审查（Code Review），协助排查冗余逻辑、竞态隐患与边界健壮性问题。

## License

[GNU GPL-3.0](./LICENSE) — `Copyright (C) 2026 IMMO-CHIRON`

本项目整体遵循 **GNU General Public License v3.0 (GPL-3.0)** 开源发布，包含来自 `Lumidarin/agy-capsule` 的 MIT 授权基础代码。上游版权声明、致谢与完整协议文本详见 [NOTICE](./NOTICE) 与 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
