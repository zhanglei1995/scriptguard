# ScriptGuard 项目交接文档

> 给接手 ScriptGuard 项目的其他 Agent 使用。
> 阅读时间：10 分钟。

---

## 1. 项目是什么

**ScriptGuard** 是一个**浏览器插件 + 云端服务**的 MVP 项目，用于监控用户脚本（Tampermonkey 等）是否因为目标网站改版而失效。

- **周期**：18 周 MVP
- **规模**：55 张 ticket、9 个 Epic、4 个 milestone（Foundation / Alpha / Beta / GA）
- **当前进度**：55/55 完成（100%）— 全部 Sprint 完成 🎉

核心价值：让 Tampermonkey 脚本作者在网站改版后第一时间发现脚本失效问题。

---

## 2. 关键文档（动手前必读）

仓库根目录已有一整套文档，**先读这些**再动手：

| 文档 | 路径 | 作用 |
|---|---|---|
| PRD | `PRD.md` | 需求文档（融合 4 个 AI 工具生成的合并版） |
| TDD | `TDD.md` | 技术设计（架构、API、DB、部署、安全） |
| Wireframes | `Wireframes.md` | UI/UX 线框图（ASCII 草图） |
| Tickets 清单 | `tickets/INDEX.md` | 55 张 ticket 索引 |
| Board 预览 | `.github-project/board-preview.md` | 看板最终效果 |

> ⚠️ **严禁凭直觉决策**。所有技术选型、API 规范、字段类型在 TDD 里有定论。

---

## 3. 仓库 & 看板

- **仓库**：https://github.com/zhanglei1995/scriptguard
- **Project Board**：https://github.com/users/zhanglei1995/projects/1
- **Owner**：zhanglei1995

### 已完成（Sprint 1 Foundation）

| Ticket | 说明 | Commit |
|---|---|---|
| SG-001 | Monorepo 初始化（pnpm + Turborepo） | `29ce78f` |
| SG-002 | Plasmo 浏览器插件骨架 | `68698da` |
| SG-003 | Fastify 云端服务骨架 | `3feacd8` |
| SG-004 | GitHub Actions CI 工作流 | `aa1f971` |
| SG-006 | 设计 Token + Tailwind 主题 | `ce6e328` |
| SG-007 | shadcn/ui 组件库初始化（17 组件） | `18c3a92` |
| SG-009 | Drizzle Schema（9 张表 + 索引） | `1a0dc9a` |
| SG-010 | 客户端存储封装层（chrome + Dexie + session） | `ff26893` |
| SG-005 | Docker Compose 本地开发环境 | `f6fd64b` |
| SG-011 | Background Service Worker 架构 | `e1724e1` |
| SG-012 | Content Script 注入框架 ⚠️ | `54cb052` |
| SG-013 | 脚本匹配引擎 | `47ae0d0` |
| SG-014 | 脚本 CRUD（本地） | `91f4176` |
| SG-015 | 用户脚本注入与执行 | `b998067` |
| SG-016 | 规则执行器接口与基类 | `8d5e767` |
| SG-017 | 6 类规则执行器（MVP 子集） | `870effe` |
| SG-018 | Popup 页面 MVP | `9ab916e` |
| SG-019 | 页面内失效浮层 ⚠️ | `1c77f24` |
| SG-021 | 手动测试功能 | `d65984e` |
| SG-020 | 浏览器桌面通知 | `96bfed1` |
| SG-022 | 本地运行日志 | `5e8b7b2` |
| SG-023 | chrome.alarms 本地定时检测 ⚠️ | `c41c4c3` |

### 已完成（Sprint 4 Beta — 云端服务）

| Ticket | 说明 | Commit |
|---|---|---|
| SG-028 | Fastify 路由与 Zod 校验 | `967b6d1` |
| SG-029 | 认证与 JWT | `890d3d1` |
| SG-030 | 脚本云端 CRUD API | `eed7f16` |
| SG-032 | 检查规则云端 API | `34bc238` |
| SG-033 | 测试调度 API | `a88d2df` |
| SG-031 | 同步协议（增量同步 + 冲突解决）⚠️ | `1b03181` |

---

## 4. 接下来的任务

### 4.1 Sprint 1 剩余（Foundation milestone）

| 优先级 | Ticket | 说明 | 依赖 |
|---|---|---|---|
| ⭐ | SG-008 | Logo 与品牌物料 | — |

> Sprint 1 仅剩 SG-008（品牌物料），可与 Sprint 2 并行。

### 4.2 Sprint 2（Alpha — 插件核心架构）✅ 已完成

| Ticket | 说明 | Commit |
|---|---|---|
| SG-011 | Background Service Worker 架构 | `e1724e1` |
| SG-012 | Content Script 注入框架 | `54cb052` |
| SG-013 | 脚本匹配引擎 | `47ae0d0` |
| SG-014 | 脚本 CRUD（本地） | `91f4176` |
| SG-015 | 用户脚本注入与执行 | `b998067` |
| SG-016 | 规则执行器接口与基类 | `8d5e767` |
| SG-017 | 6 类规则执行器（MVP） | `870effe` |
| SG-018 | Popup 页面 MVP | `9ab916e` |

### 4.3 Sprint 3（Alpha — 健康检查引擎 + UI）

| 优先级 | Ticket | 说明 | 依赖 | 状态 |
|---|---|---|---|---|
| ⭐⭐⭐ | SG-019 | 页面内失效浮层 ⚠️ | SG-012 | ✅ |
| ⭐⭐ | SG-020 | 浏览器桌面通知 | SG-019 | ✅ |
| ⭐⭐ | SG-021 | 手动测试功能 | SG-017, SG-018 | ✅ |
| ⭐⭐ | SG-022 | 本地运行日志 | SG-010, SG-021 | ✅ |
| ⭐ | **SG-023** | chrome.alarms 本地定时检测 ⚠️ | SG-011 | ✅ |

> **Sprint 3 全部完成！** 准备进入 Sprint 4（Beta — 云端服务）。

### 4.4 Sprint 4（Beta — 云端服务）

| 优先级 | Ticket | 说明 | 依赖 | 状态 |
|---|---|---|---|---|
| ⭐⭐⭐ | **SG-028** | Fastify 路由与 Zod 校验 | SG-009 | ✅ `967b6d1` |
| ⭐⭐⭐ | **SG-029** | 认证与 JWT | SG-028 | ✅ `890d3d1` |
| ⭐⭐⭐ | **SG-030** | 脚本云端 CRUD API | SG-028, SG-029 | ✅ `eed7f16` |
| ⭐⭐ | **SG-031** | 同步协议（增量同步 + 冲突解决）⚠️ | SG-030 | ✅ `1b03181` |
| ⭐⭐ | **SG-033** | 测试调度 API | SG-030, SG-032 | ✅ `a88d2df` |

> **Sprint 4 全部完成！**

### 已完成（Sprint 5 — 任务队列 + Runner）

| Ticket | 说明 |
|---|---|
| SG-034 | BullMQ vs Inngest 调研（Spike） |
| SG-035 | BullMQ 任务队列基础设施 |
| SG-036 | Playwright Runner 容器 |
| SG-037 | 测试报告持久化 |
| SG-038 | 测试报告 UI |

### 已完成（Sprint 6 — 通知与集成）

| Ticket | 说明 |
|---|---|
| SG-039 | 告警与通知 API |
| SG-040 | 通知中心（多通道适配器） |
| SG-041 | Webhook 适配器（飞书/钉钉/Slack/通用） |
| SG-042 | 邮件通知（Nodemailer） |
| SG-043 | GitHub Actions 集成 |

### 已完成（Sprint 7 — Beta 完善）

| Ticket | 说明 |
|---|---|
| SG-044 | 告警中心 UI |
| SG-045 | 设置页面（通知 + 通用） |
| SG-046 | 选择器采集助手 |

### 已完成（Sprint 8-9 — GA 收尾）

| Ticket | 说明 |
|---|---|
| SG-047 | 关键流程 E2E 自动化 |
| SG-048 | 性能优化（Bundle 与首屏） |
| SG-049 | 跨浏览器兼容性测试 |
| SG-050 | 文档站（v1.0） |
| SG-051 | Chrome Web Store 上架 |
| SG-052 | 服务端生产部署 |
| SG-053 | 营销官网 |
| SG-054 | 4 类补充规则执行器（v1.0 收口） |
| SG-055 | Tampermonkey 协同与导入 |

---

## 5. 已锁定的技术选型

**不要更换这些**，除非有充分理由并更新 TDD：

| 维度 | 选型 | 来源 |
|---|---|---|
| 包管理 | pnpm 11 + Turborepo | SG-001 |
| 插件框架 | Plasmo 0.90.5 + React 18 + TS 5.4 + Tailwind 3.4 | SG-002 |
| 云端 | Fastify 5 + Drizzle ORM + Pino + Zod | SG-003 |
| 数据库 | PostgreSQL 16 + Drizzle | TDD §1 |
| 任务队列 | BullMQ + Redis | TDD §1 |
| 浏览器自动化 | Playwright | TDD §1 |
| 测试 | Vitest + happy-dom | 已用 |
| UI 组件 | shadcn/ui + Radix + 17 个组件 | SG-007 |
| 鉴权 | JWT (Lucia Auth / Auth.js) | TDD §1 |
| Lint | ESLint + Prettier | 已用 |

---

## 6. 工作区结构

```
ScriptGuard/
├── apps/
│   ├── extension/              SG-002 ✅ Plasmo 浏览器插件
│   │   ├── background/        SG-011 ✅ SW 架构（router, registry, alarms）
│   │   ├── content/           SG-012 ✅ 注入框架 + SG-046 选择器采集
│   │   ├── matcher/           SG-013 ✅ URL 匹配引擎
│   │   ├── store/             SG-014 ✅ Zustand scripts store
│   │   ├── rules/             SG-016+017+054 ✅ 10 个执行器 + BaseExecutor
│   │   ├── popup/             SG-018 ✅ Popup MVP (Tailwind/shadcn)
│   │   ├── options/           SG-024 ✅ Options 页骨架
│   │   │   ├── views/         SG-025~027+038+044+045 ✅ 7 个视图组件
│   │   │   ├── index.tsx      路由 + React.lazy 按需加载
│   │   │   ├── logs.tsx       SG-022 运行日志
│   │   │   └── import-tab.tsx SG-055 Tampermonkey 导入
│   │   ├── components/ui/     SG-007 ✅ 17 个 shadcn/ui 组件
│   │   ├── storage/           SG-010 ✅ 客户端存储封装层
│   │   ├── lib/               工具函数（tokens.ts, utils.ts, tampermonkey.ts）
│   │   ├── assets/            SG-008 ✅ Logo SVG + 品牌规范
│   │   ├── styles/            globals.css（设计 Token CSS 变量）
│   │   ├── tailwind.config.ts SG-006 ✅ 完整 Tailwind 主题
│   │   └── components.json    SG-007 ✅ shadcn/ui 配置
│   ├── server/                SG-003 ✅ Fastify 云端
│   │   ├── src/lib/           queue.ts + metrics.ts + notify/ 通知适配器
│   │   ├── src/plugins/       bull-board.ts + metrics.ts + auth.ts
│   │   ├── src/routes/v1/     9 个 API 路由模块
│   │   ├── src/workers/       SG-037 测试报告持久化处理器
│   │   └── src/spike/         SG-034 BullMQ POC
│   ├── runner/                SG-036 ✅ Playwright Runner 容器
│   │   ├── src/worker.ts      BullMQ Worker + Playwright 执行
│   │   ├── src/browser-pool.ts 浏览器池管理（max 3）
│   │   └── Dockerfile         基于 Playwright 官方镜像
│   ├── marketing/             SG-053 ✅ 营销官网（Next.js 14）
│   └── docs/                  SG-050 ✅ Fumadocs 文档站
├── packages/
│   ├── db/                    SG-009 ✅ Drizzle Schema（9 表 + 索引）
│   ├── shared/                共享类型
│   ├── sdk/                   预留
│   └── ui/                    预留
├── e2e/                       SG-047 ✅ Playwright E2E 测试
├── docker/                    SG-052 ✅ 生产部署
│   ├── server.Dockerfile
│   ├── runner.Dockerfile
│   ├── docker-compose.prod.yml
│   └── nginx/nginx.conf
├── chrome-store/              SG-051 ✅ Chrome Web Store 上架
├── .github/workflows/
│   └── ci.yml                 SG-004 ✅ CI 工作流（含 E2E + 跨浏览器）
├── docker-compose.yml         SG-005 ✅ PostgreSQL 16 + Redis 7
├── tickets/                   55 张 ticket .md + INDEX + CSV + JSON
├── scripts/                   generate-tickets.js + deploy.sh
├── .github-project/           看板自动化脚本 + 本文档
├── PRD.md / TDD.md / Wireframes.md / tickets.md
├── package.json               根 workspaces + turbo
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json         strict TS 基线
```

---

## 7. 环境要求

```bash
# Node.js >= 20（已用 v22.22.3）
node --version

# pnpm 11.7.0（通过 corepack 启用）
corepack enable pnpm
pnpm --version

# gh CLI（GitHub 操作）
gh --version

# 安装依赖
pnpm install
```

---

## 8. 工作流程

### 8.1 Commit 规范（Conventional Commits）

```
feat(extension): ...        新功能
fix(server): ...            修复
chore(monorepo): ...        工具/构建
docs: ...                   文档
refactor: ...               重构
test: ...                   测试
ci: ...                     CI/CD
```

### 8.2 完成一张 ticket 的步骤

1. 找到对应 ticket（如 SG-010），读 `tickets/SG-010.md` 了解 AC
2. 创建/修改代码
3. `pnpm install`（如新增依赖）→ `pnpm build` → `pnpm test` 全部通过
4. `git add -A && git commit -m "feat(...): ... Refs SG-XXX"`
5. `git push origin main`
6. 关闭 issue 并附 commit hash
7. 更新 Project Status 为 Done

### 8.3 关闭 issue 模板

```bash
gh issue close <num> --repo zhanglei1995/scriptguard --comment "✅ 完成 by commit <hash>

实现内容：
- ...

验证：
- tsc --noEmit: 0 错误
- pnpm test: X/X 通过
- pnpm build: 成功
- ...

Refs SG-XXX"
```

### 8.4 更新 Project Status 脚本

```bash
# 找到对应 issue 的 item ID
gh project item-list 1 --owner zhanglei1995 --format json --limit 100 > /tmp/items.json
item_id=$(jq -r --argjson num <ISSUE_NUM> '.items[] | select(.content.number == <ISSUE_NUM>) | .id' /tmp/items.json)

# 获取 Done option ID
done_id=$(gh api graphql -f query='query { node(id: "PVTSSF_lAHOALGbl84Ba5-dzhVuN00") { ... on ProjectV2SingleSelectField { options { id name } } } }' --jq '.data.node.options[] | select(.name == "Done") | .id')

# 写 mutation 并执行
cat > /tmp/m.gql << GQL
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwHOALGbl84Ba5-d"
    itemId: "$item_id"
    fieldId: "PVTSSF_lAHOALGbl84Ba5-dzhVuN00"
    value: { singleSelectOptionId: "$done_id" }
  }) { projectV2Item { id } }
}
GQL
gh api graphql -f query="$(cat /tmp/m.gql)" --jq '.data.updateProjectV2ItemFieldValue.projectV2Item.id'
```

### 8.5 代码质量标准（Definition of Done）

- [ ] `tsc --noEmit` 无错误
- [ ] 单元测试覆盖：核心逻辑 ≥ 80%
- [ ] 代码通过 ESLint + Prettier
- [ ] 所有 AC checkbox 已完成
- [ ] commit 信息引用 `Refs SG-XXX`
- [ ] 远程推送成功
- [ ] Issue 已关闭并附 commit hash
- [ ] Project Status 设为 Done

---

## 9. 已知坑（避坑指南）

### 9.1 pnpm 11 build scripts 限制

pnpm 11 默认拒绝运行依赖的 build scripts。已在 `pnpm-workspace.yaml` 配置 `onlyBuiltDependencies`：

```yaml
onlyBuiltDependencies:
  - '@parcel/watcher'
  - '@parcel/core'
  - '@parcel/fs'
  - '@parcel/package-manager'
  - '@swc/core'
  - esbuild
  - lmdb
  - msgpackr-extract
  - better-sqlite3
  - playwright
```

**新增原生依赖时记得加到这个列表**。

### 9.2 Plasmo 0.90 popup 检测 quirk

Plasmo 0.90.5 的 popup 自动检测有 bug。需要在 `apps/extension/package.json` 手动指定：

```json
"manifest": {
  "action": {
    "default_title": "ScriptGuard",
    "default_popup": "popup.html"
  }
}
```

### 9.3 Plasmo entrypoint 必须在根目录

`popup/index.tsx` 这种子目录形式**不被识别**。必须用 `popup.tsx` 放在项目根。

### 9.4 Pino 版本冲突

不要在 server 自定义 Pino 实例。直接让 Fastify 用内置 logger：

```typescript
const fastify = Fastify({
  logger: { level: config.LOG_LEVEL, transport: ... }
})
```

如果自己 new Pino，会和 Fastify 内部 pino 9/10 产生类型冲突。

### 9.5 Husky pre-commit 当前禁用

`pnpm install` 的 `prepare` 脚本被移除了，因为 husky pre-commit 钩子会触发 pnpm install 失败。

**之后重启用**：
```bash
pnpm dlx husky init
# 在 .husky/pre-commit 写: pnpm exec lint-staged
# 在 package.json 加 "prepare": "husky"
```

### 9.6 Plasmo icon 路径

图标源文件**必须是** `assets/icon.png`。Plasmo 自动生成 5 种尺寸。不要自己放 `icon-16.png` 等命名。

### 9.7 shadcn/ui 组件库（SG-007）

已在 `apps/extension/components/ui/` 添加 17 个组件。CSS 变量已配置在 `globals.css`（light + dark）。

- Toast 是自建的（非 Radix），适合浏览器插件场景
- Command 使用 `cmdk` 包实现 ⌘K 搜索
- `lib/utils.ts` 的 `cn()` 函数用于合并 className
- 新增组件用 `npx shadcn@latest add <component>` 或手动创建

### 9.8 Drizzle Schema（SG-009）

Schema 位于 `packages/db/src/schema.ts`。9 张表 + 4 个 enum + 完整索引。

- 连接配置在 `packages/db/src/drizzle.ts`（读 `DATABASE_URL` 环境变量）
- 种子脚本：`pnpm --filter @scriptguard/db db:seed`
- 生成迁移：`pnpm --filter @scriptguard/db db:generate`
- 条件索引使用 `sql` 模板字面量（如 `where(sql\`${t.enabled} = true\`)`）

### 9.9 CI 工作流（SG-004）

位于 `.github/workflows/ci.yml`。

- PR 触发：typecheck + lint + test:unit + build
- push main：额外 e2e + 跨浏览器测试
- PostgreSQL 16 service container 用于 server 测试
- Codecov 覆盖率上传
- Docker build 已启用（server + runner 镜像）

### 9.10 客户端存储（SG-010）

位于 `apps/extension/storage/`。

- `chrome.ts`: chrome.storage.local 封装，typed stores（scripts, rules, schedules, channels, preferences, syncMeta, auth）
- `db.ts`: Dexie IndexedDB（checks, snapshots, alerts）+ 30 天自动清理
- `session.ts`: chrome.storage.session 临时态（页面检测状态、通信 token）
- `schemas.ts`: Zod schema + 版本迁移链（ScriptV1 → ScriptV2）
- 测试：5 个测试文件，49 个测试用例
- 注意：Dexie 在 Plasmo Content Script 中可能受限，优先用 chrome.storage

---

## 10. 项目已完成 🎉

**55/55 tickets 全部完成 (100%)。** 所有 9 个 Sprint（Foundation → Alpha → Beta → GA）均已交付。

### 已交付的关键模块

| 模块 | 位置 | 说明 |
|------|------|------|
| 浏览器插件 | `apps/extension/` | Plasmo + React 18，含 7 个 Options 视图 |
| 云端服务 | `apps/server/` | Fastify + BullMQ + Prometheus |
| Runner | `apps/runner/` | Playwright 容器化测试执行 |
| 文档站 | `apps/docs/` | Fumadocs MDX 文档 |
| 营销官网 | `apps/marketing/` | Next.js 14 + Tailwind |
| E2E 测试 | `e2e/` | 6 个 Playwright 测试用例 |
| 生产部署 | `docker/` | Docker Compose + Nginx + Dockerfile |
| Chrome 上架 | `chrome-store/` | 商店文案 + 隐私政策 + 提交脚本 |

### 下一步（GA 后）

- 发布到 Chrome Web Store
- 部署生产环境（`docker-compose.prod.yml`）
- 收集用户反馈
- 迭代 v1.1+

---

## 11. 工具速查

```bash
# 安装
pnpm install

# 开发
pnpm --filter @scriptguard/extension dev
pnpm --filter @scriptguard/server dev
pnpm --filter @scriptguard/runner dev
pnpm --filter @scriptguard/docs dev
pnpm --filter @scriptguard/marketing dev

# 构建
pnpm build

# 测试
pnpm test
pnpm --filter @scriptguard/extension test
pnpm --filter @scriptguard/server test

# Lint
pnpm lint

# 单包操作
pnpm --filter @scriptguard/server typecheck
pnpm --filter @scriptguard/server build
pnpm --filter @scriptguard/db typecheck

# DB 操作
pnpm --filter @scriptguard/db db:generate
pnpm --filter @scriptguard/db db:migrate
pnpm --filter @scriptguard/db db:seed

# GitHub
gh issue list --repo zhanglei1995/scriptguard
gh issue view <num> --repo zhanglei1995/scriptguard
gh issue close <num> --repo zhanglei1995/scriptguard --comment "..."
gh project item-list 1 --owner zhanglei1995
```

---

## 12. 沟通原则

- **写代码 → commit + push**（不要问"我做完对吗"这种问题）
- 遇到技术分歧 → **回 TDD.md 找依据**
- 任务清单 → `tickets/INDEX.md`
- 当前进度 → Project Board
- 阻塞问题 → 创建 issue 标注 `prio:P0` 或留 comment 说明
- 不要修改已锁定的技术选型

---

## 13. 风险标记（参考）

以下 ticket 有额外风险，已在 `tickets.md` §6 标记：

| Ticket | 风险 |
|---|---|
| SG-012 | Content Script 执行时机冲突 |
| SG-023 | chrome.alarms 休眠触发可靠性 |
| SG-031 | 离线优先同步冲突边界 |
| SG-035 | BullMQ vs Inngest 选型（已铺垫 SG-034 spike） |
| SG-036 | Playwright Runner 资源消耗 |
| SG-043 | GH Action 镜像构建时间 |
| SG-048 | Bundle 体积（特别是 Monaco） |
| SG-049 | Firefox MV3 兼容性 |
| SG-051 | Chrome Web Store 审核 |
| SG-055 | Tampermonkey 跨插件 API |

建议：每张风险 ticket 预留 **20% buffer**。

---

## 14. 一句话总结

> **ScriptGuard 是 18 周 MVP 浏览器插件 + 云端，55/55 tickets 全部完成 (100%)。**
> **已交付：插件核心 + 云端服务 + Playwright Runner + 通知系统 + 文档 + 营销 + 部署。**
> **下一步：发布到 Chrome Web Store，部署生产环境。**

---

*Updated 2026-06-19 · Project Owner: zhanglei1995 · Status: COMPLETE ✅*
