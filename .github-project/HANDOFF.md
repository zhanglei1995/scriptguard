# ScriptGuard 项目交接文档

> 给接手 ScriptGuard 项目的其他 Agent 使用。
> 阅读时间：10 分钟。

---

## 1. 项目是什么

**ScriptGuard** 是一个**浏览器插件 + 云端服务**的 MVP 项目，用于监控用户脚本（Tampermonkey 等）是否因为目标网站改版而失效。

- **周期**：18 周 MVP
- **规模**：55 张 ticket、9 个 Epic、4 个 milestone（Foundation / Alpha / Beta / GA）
- **当前进度**：3/55 完成（5.5%）

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

### 已完成

| Ticket | 说明 | Commit |
|---|---|---|
| SG-001 | Monorepo 初始化（pnpm + Turborepo） | `29ce78f` |
| SG-002 | Plasmo 浏览器插件骨架 | `68698da` |
| SG-003 | Fastify 云端服务骨架 | `3feacd8` |

---

## 4. 接下来的任务

按 Project Board 的 **Todo** 状态筛选，从 Sprint 1 剩余开始：

| 优先级 | Ticket | 说明 | 依赖 |
|---|---|---|---|
| ⭐⭐⭐ | **SG-009** | Drizzle Schema（9 张表） | SG-001 |
| ⭐⭐ | SG-006 | 设计 Token + Tailwind 主题 | SG-001 |
| ⭐⭐ | SG-004 | GitHub Actions CI 工作流 | SG-001 |
| ⭐ | SG-007 | shadcn/ui 组件库初始化 | SG-006 |

> **推荐下一个做 SG-009**（Drizzle Schema），它阻塞 SG-028~043 一整批云端 ticket。

完整 Sprint 计划见 `tickets.md` §3。

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
| UI 组件 | shadcn/ui + Radix | TDD §1 |
| 鉴权 | JWT (Lucia Auth / Auth.js) | TDD §1 |
| Lint | ESLint + Prettier | 已用 |

---

## 6. 工作区结构

```
ScriptGuard/
├── apps/
│   ├── extension/         SG-002 ✅ Plasmo 浏览器插件
│   └── server/            SG-003 ✅ Fastify 云端
├── packages/              预留（shared, sdk, ui, db 暂为空）
│   └── shared/            最小占位
├── tickets/               55 张 ticket .md + INDEX + CSV + JSON
├── scripts/               generate-tickets.js
├── .github-project/       看板自动化脚本 + 本文档
├── PRD.md / TDD.md / Wireframes.md / tickets.md
├── package.json           根 workspaces + turbo
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json     strict TS 基线
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
```

### 8.2 完成一张 ticket 的步骤

1. 找到对应 ticket（如 SG-009），读 `tickets/SG-009.md` 了解 AC
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

---

## 10. 你的第一个任务

**实现 SG-009 (Drizzle Schema) 并提交。**

### SG-009 简介

- **位置**：`packages/db/src/schema.ts`（创建 packages/db/）
- **规模**：9 张表，约 255 story points
- **AC**（完整版见 `tickets/SG-009.md`）：
  - [ ] 9 张表 schema：users, teams, scripts, check_rules, test_schedules, test_runs, alerts, notify_channels, script_versions
  - [ ] 完整 enum：plan, health_status, run_at, alert_level
  - [ ] 外键 + 索引 + 唯一约束齐全
  - [ ] `pnpm db:generate` 生成迁移文件
  - [ ] `pnpm db:migrate` 在干净库成功执行
  - [ ] Seed 脚本可创建测试用户 + 脚本

- **技术参考**：`TDD.md` §4.2 有完整 Drizzle Schema 模板
- **Owner Role**：BE
- **依赖**：SG-001（已完成）

### 完成后

1. commit 信息：`feat(db): initialize Drizzle schema (SG-009)\n\nRefs SG-009`
2. 关闭 issue #9（SG-009 在 GitHub Issues 中的编号）
3. 更新 Project Status 为 Done（用 §8.4 脚本）
4. **来这里确认**，我（zhanglei1995）会继续做后续任务

---

## 11. 工具速查

```bash
# 安装
pnpm install

# 开发
pnpm --filter @scriptguard/extension dev
pnpm --filter @scriptguard/server dev

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

> **ScriptGuard 是 18 周 MVP 浏览器插件 + 云端。**
> **现在做 SG-009 (Drizzle Schema)，所有信息都在本文档和 TDD.md 里。**
> **写完代码 → commit + push → 关闭 issue → 更新看板状态。**
> **来这里确认，我继续。**

---

*Generated 2026-06-17 · Project Owner: zhanglei1995*
