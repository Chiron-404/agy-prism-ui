# Contributing to Agy Prism UI

[中文](#中文) | [English](#english)

## 中文

> **基本分工：建议、讨论与 Bug 反馈放 Issue；代码修复与功能改动放 PR。**

| 类型 | 适用场景 |
|---|---|
| **[Issue](../../issues)** | Bug 反馈、使用问题、功能建议、视觉与交互讨论（大型改动建议先开 Issue 对齐方向） |
| **[PR (Pull Request)](../../pulls)** | Bug 修复、性能优化、文档勘误或明确可合入的代码改动（建议基于最新 `main` 分支） |

### 贡献原则

1. **简洁克制的体验**：本项目由 **IMMO-CHIRON** ([@Chiron-404](https://github.com/Chiron-404)) 借助 AI 辅助维护，强调开箱即用与简洁视觉。新增展示或交互时，优先复用现有视觉体系（Optical UI、Insights、Overview Telemetry、Prism Lens），避免堆砌零散开关或多余的后台轮询。
2. **Bug 修复与边界兼容**：明确的问题修复可直接开 PR。涉及 SQLite/protobuf 解析、CDP 注入或配额/缓存逻辑时，请注意兼容未开启调试端口、字段缺失及边界状态。
3. **聚焦改动与测试门槛**：每个 PR 尽量只做一件事；涉及 UI 与样式的改动请附前后对比截图（注意遮挡个人路径、账号或对话标题隐私）。提交前请先在根目录跑通零依赖内置测试（基于 Node.js 标准库 `node:test`，详见[开发测试](./README.md#开发测试)），并在 PR 中说明验证内容：
   ```sh
   node --test "test/*.test.mjs"
   ```
4. **GPL-3.0 与来源合规**：本仓库整体遵循 **[GNU GPL-3.0](./LICENSE)**，所有贡献默认按 GPL-3.0 协议发布。借鉴或参考其他开源项目时须遵守原项目协议并优先采用净室实现，禁止引入与 GPL-3.0 不兼容或缺少合规署名的第三方代码（详见 [NOTICE](./NOTICE) 与 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)）。

## English

> **Core rule: Suggestions, ideas & bug reports go in Issues; code fixes & changes go in PRs.**

| Type | When to use |
|---|---|
| **[Issue](../../issues)** | Bug reports, usage questions, feature suggestions, UI/UX discussions (open an Issue first before major changes) |
| **[PR (Pull Request)](../../pulls)** | Bug fixes, performance improvements, doc fixes, or ready-to-merge code changes (branch from latest `main`) |

### Guidelines

1. **Clean, cohesive experience**: Maintained by **IMMO-CHIRON** ([@Chiron-404](https://github.com/Chiron-404)) with AI assistance, Agy Prism UI prioritizes an out-of-the-box, uncluttered interface. Reuse existing UI systems (Optical UI, Insights, Overview Telemetry, Prism Lens) rather than adding scattered toggles or unnecessary background polling.
2. **Bug fixes & edge-case resilience**: Direct PRs for clear bug fixes are welcome. Changes to SQLite/protobuf parsing, CDP injection, or quota/cache tracking must degrade gracefully when the debugging port is off, fields are missing, or states hit edge cases.
3. **Focused PRs & testing**: Keep each PR focused on a single change. Include before/after screenshots for UI or styling updates (redacting private chat titles, account info, or local paths). Before opening a PR, pass the zero-dependency built-in test suite (`node:test`, see [Development tests](./README.en.md#development-tests)) and state what you verified:
   ```sh
   node --test "test/*.test.mjs"
   ```
4. **GPL-3.0 & provenance compliance**: This repository is licensed as a whole under **[GNU GPL-3.0](./LICENSE)**, and submitted contributions are licensed under GPL-3.0 by default. When drawing inspiration from other open-source projects, follow their licenses, prefer clean-room reimplementations, and never introduce GPL-3.0-incompatible or unattributed third-party code (see [NOTICE](./NOTICE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)).
