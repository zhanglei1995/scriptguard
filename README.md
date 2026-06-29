# 🛡️ ScriptGuard

> **用户脚本健康监控与管理平台** — 浏览器插件 + 云端服务

ScriptGuard 是一个面向用户脚本开发者和重度使用者的浏览器插件 + 可选服务端的一体化解决方案。当目标网站改版导致脚本失效时，ScriptGuard 第一时间发现并通知你。

[📋 PRD](./PRD.md) · [🏗️ TDD](./TDD.md) · [🎨 Wireframes](./Wireframes.md) · [🎫 Tickets](./tickets/INDEX.md) · [📊 Project Board](https://github.com/users/zhanglei1995/projects/1)

---

## ✨ 核心特性

- 🔍 **自动健康检测** — 注入后立即检查关键 DOM/API
- 🚨 **失效智能告警** — 桌面通知 + 邮件 + 飞书/钉钉/Slack
- ⏰ **定期自动测试** — 本地或云端 Playwright Runner
- 🎯 **可视化零代码断言** — 点选元素生成检查规则
- 📦 **脚本版本管理** — 变更追踪 + 一键回滚
- 👥 **团队协作** — 共享脚本库 + 权限分级

---

## 📁 仓库结构

```
scriptguard/
├── apps/
│   ├── extension/          # Plasmo 浏览器插件 (MV3)
│   ├── server/             # Fastify 云端服务
│   ├── runner/             # Playwright Runner 容器
│   ├── docs/               # Fumadocs 文档站 (Next.js)
│   └── marketing/          # 营销官网 (Next.js + Tailwind)
├── packages/
│   ├── shared/             # 共享 TS 类型、Zod schema、队列契约
│   ├── sdk/                # 用户嵌入 SDK（规划中 / 占位）
│   ├── ui/                 # 共享 React 组件（规划中 / 占位）
│   └── db/                 # Drizzle ORM schema
├── e2e/                    # Playwright E2E 测试
├── docker/                 # 生产部署 (Compose + Nginx + Dockerfile)
├── chrome-store/           # Chrome Web Store 上架物料
├── tickets/                # 55 张 MVP ticket
├── .github/                # GitHub Actions
├── .github-project/        # 看板自动化脚本
├── scripts/                # 辅助工具脚本
├── PRD.md                  # 需求文档
├── TDD.md                  # 技术设计文档
├── Wireframes.md           # UI/UX 线框图
├── pnpm-workspace.yaml     # pnpm 工作区配置
├── turbo.json              # Turborepo 任务编排
└── package.json            # 根 package.json
```

---

## 🚀 快速开始

### 前置条件

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0（推荐 11.x）
- **Git** >= 2.30

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/zhanglei1995/scriptguard.git
cd scriptguard

# 2. 安装依赖
pnpm install

# 3. 构建所有 packages
pnpm build
```

### 开发

```bash
# 启动所有 app 的 dev 模式
pnpm dev

# 仅启动浏览器插件
pnpm --filter @scriptguard/extension dev

# 仅启动服务端
pnpm --filter @scriptguard/server dev
```

### 常用命令

| 命令             | 作用                  |
| ---------------- | --------------------- |
| `pnpm build`     | 构建所有包            |
| `pnpm dev`       | 启动 dev 模式（并行） |
| `pnpm lint`      | 运行所有 ESLint 检查  |
| `pnpm typecheck` | 运行所有 TS 类型检查  |
| `pnpm test`      | 运行单元测试          |
| `pnpm test:unit` | 运行单元测试          |
| `pnpm test:e2e`  | 运行 E2E 测试         |
| `pnpm test:all`  | 运行所有 test 任务    |
| `pnpm format`    | 格式化所有文件        |
| `pnpm clean`     | 清理所有 build 产物   |

---

## 🏗️ 技术栈

| 类别             | 选型                            | 理由                      |
| ---------------- | ------------------------------- | ------------------------- |
| **包管理**       | pnpm + Turborepo                | 节省空间、Monorepo 友好   |
| **插件框架**     | Plasmo                          | MV3 零配置、TS/React 优化 |
| **UI 库**        | React 18 + Tailwind + shadcn/ui | 性能、Bundle 小、可定制   |
| **状态**         | Zustand                         | 轻量、persist 友好        |
| **云端框架**     | Fastify + Drizzle               | 高性能、TS-first          |
| **任务队列**     | BullMQ + Redis                  | Cron 原生、可观测         |
| **浏览器自动化** | Playwright                      | 跨浏览器、稳定            |
| **测试**         | Vitest                          | 与 Vite 生态统一          |
| **CI/CD**        | GitHub Actions                  | 与 GitHub 深度集成        |

详见 [TDD.md §1](./TDD.md#1-技术栈选型)。

---

## 📊 项目状态

当前仓库处于 MVP 工程化与核心链路建设阶段，已包含浏览器插件、Fastify 服务端、独立 Playwright Runner、共享契约包、Drizzle schema、Docker/CI 基础设施与 E2E 骨架。

计划类文档（PRD/TDD/tickets）仍保留完整产品蓝图，实际进度以 [Project Board](https://github.com/users/zhanglei1995/projects/1) 和仓库代码为准。

---

## 🤝 贡献

我们欢迎任何形式的贡献！请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发流程。

- 🐛 **报告 Bug**：[新建 Issue](https://github.com/zhanglei1995/scriptguard/issues/new?template=bug.md)
- 💡 **功能建议**：[新建 Feature Request](https://github.com/zhanglei1995/scriptguard/issues/new?template=feature.md)
- 📝 **文档改进**：直接提交 PR

---

## 📄 许可证

本项目采用 **MIT 协议** — 详见 [LICENSE](./LICENSE) 文件。

---

## 🙏 致谢

- [Tampermonkey](https://www.tampermonkey.net/) — 用户脚本管理器的灵感来源
- [Plasmo](https://www.plasmo.com/) — 优秀的 MV3 框架
- [shadcn/ui](https://ui.shadcn.com/) — 高质量 UI 组件
- 所有贡献者 💖

---

_Built with ❤️ by the ScriptGuard team_
