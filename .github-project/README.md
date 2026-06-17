# ScriptGuard · GitHub Project 自动化设置

> 一键创建 GitHub Project V2 看板、添加 55 个 issue、设置字段值。

## 📋 目录

- [快速开始](#快速开始)
- [功能特性](#功能特性)
- [文件清单](#文件清单)
- [执行流程](#执行流程)
- [字段说明](#字段说明)
- [View 与自动化](#view-与自动化)
- [故障排查](#故障排查)

---

## 快速开始

### 前置条件

1. **安装 gh CLI**（≥ 2.40）
   ```bash
   brew install gh   # macOS
   ```

2. **安装 jq**
   ```bash
   brew install jq
   ```

3. **认证 GitHub**
   ```bash
   gh auth login
   ```

4. **创建 GitHub 仓库**（如果还没有）
   ```bash
   gh repo create your-username/scriptguard --public --source=. --remote=origin --push
   ```

### 一键执行

```bash
cd /Users/mac/Documents/ScriptGuard/.github-project
./setup-github-project.sh <github-owner> <repo-name>

# 示例
./setup-github-project.sh zhangsan scriptguard
```

### 高级选项

```bash
# 重置: 删除已有 Project 并重建
./setup-github-project.sh zhangsan scriptguard --reset

# 只执行某个阶段
./setup-github-project.sh zhangsan scriptguard --phase 1
./setup-github-project.sh zhangsan scriptguard --phase 5

# 跳过创建 issues（假设已存在）
./setup-github-project.sh zhangsan scriptguard --skip-issues
```

---

## 功能特性

| 自动化 | 说明 |
|---|---|
| ✅ Project 创建 | 创建/复用 "ScriptGuard MVP v1.0" Project |
| ✅ 9 个自定义字段 | Status, Priority, Epic, Sprint, Type, Owner Role, Estimate, Start Date, Target Date |
| ✅ 55 个 issue | 自动调用 push-to-github.sh 逻辑 |
| ✅ Issue → Project | 全部 55 个 issue 添加到 Project |
| ✅ 字段值映射 | 从 frontmatter 自动解析并写入 |
| 📋 Views | 提供模板，需在 UI 中创建（API 限制） |
| 📋 Workflows | 提供模板，需在 UI 中配置 |

---

## 文件清单

```
.github-project/
├── README.md                   本文档
├── config.json                 所有配置（字段、views、automations）
├── setup-github-project.sh     主入口（一键执行）
├── lib/                        （预留：辅助函数）
└── .project-number, .project-id, .field-ids.tsv, .issue-map.tsv
                                自动生成的缓存（可删除重跑）
```

---

## 执行流程

### 阶段 0: 准备（自动）

- 验证 `gh` / `jq` 已安装
- 验证 `gh auth status`
- 验证 `tickets/` 目录
- 验证仓库存在

### 阶段 1: 创建 Project

```bash
gh project create --owner <owner> --title "ScriptGuard MVP v1.0" --description "..."
```

输出：Project number (如 `1`) 和 GraphQL ID

### 阶段 2: 创建 9 个自定义字段

通过 GraphQL `createProjectV2Field` mutation 创建：

| 字段 | 类型 | Options |
|---|---|---|
| Status | SINGLE_SELECT | Todo / In Progress / In Review / Done / Blocked |
| Priority | SINGLE_SELECT | P0 / P1 / P2 |
| Epic | SINGLE_SELECT | E1-E9 |
| Sprint | SINGLE_SELECT | Sprint 1-9 |
| Type | SINGLE_SELECT | Feature / Bug / Chore / Docs / Test / Spike |
| Owner Role | SINGLE_SELECT | FE / BE / FS / DevOps / Designer / QA / Tech Lead |
| Estimate | NUMBER | - |
| Start Date | DATE | - |
| Target Date | DATE | - |

### 阶段 3: 创建 55 个 Issues

复用 `../tickets/push-to-github.sh` 的逻辑：
- 创建 22 个 labels
- 创建 4 个 milestones (Foundation / Alpha / Beta / GA)
- 为每个 `tickets/SG-XXX.md` 创建 issue

### 阶段 4: 添加到 Project

对每个 issue：
```bash
gh project item-add <project-num> --owner <owner> --url https://github.com/<owner>/<repo>/issues/<num>
```

### 阶段 5: 设置字段值

从 `tickets/SG-XXX.md` 的 frontmatter 解析，通过 GraphQL `updateProjectV2ItemFieldValue` 写入：

```yaml
priority: P0           → Status: Todo, Priority: P0
epic: E4               → Epic: E4 - 插件 UI
milestone: Alpha       → Sprint: Sprint 2
estimate: 8            → Estimate: 8
owner: FE              → Owner Role: FE
type: Feature          → Type: Feature
```

### 阶段 6: 创建 Views（手动）

由于 GitHub API 对 Views 创建支持有限，需要在 UI 中创建。

**6 个推荐 Views**：

| 名称 | 布局 | 分组 | 用途 |
|---|---|---|---|
| 📋 Board (by Status) | Board | Status | 日常看板 |
| 🎯 By Priority | Board | Priority | 优先级排序 |
| 🚀 By Sprint | Board | Sprint | Sprint 进度 |
| 📦 By Epic | Board | Epic | 按 Epic 跟踪 |
| 👤 By Owner | Board | Owner Role | 工作分配 |
| 📊 Backlog Table | Table | - | 完整数据 |

**创建方法**：访问 Project → 右上 `+` → New view

### 阶段 7: 设置 Workflows（手动）

进入 Project → ⚙️ Settings → **Workflows** → 添加：

1. ✅ Item added to project → Set Status to `Todo`
2. ✅ Pull request opened → Set Status to `In Review`
3. ✅ Item closed → Set Status to `Done`
4. ✅ Pull request merged → Set Status to `Done`
5. ✅ Label `prio:P0` added → Set Priority to `P0`

---

## 字段说明

### Status（5 状态）

```
┌──────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────┐
│   Todo   │ → │ In Progress  │ → │  In Review  │ → │ Done │
└──────────┘   └──────────────┘   └─────────────┘   └──────┘
                      │                                 ↑
                      └──────→ Blocked ←──────────────┘
```

### Priority（3 级别）

| 值 | 颜色 | 含义 |
|---|---|---|
| P0 | 🔴 Red | 必须，缺失阻塞发布 |
| P1 | 🟠 Orange | 强烈建议，影响产品完整性 |
| P2 | 🟡 Yellow | 可选，GA 前完成即可 |

### Epic（9 个）

| ID | 名称 | 周期 | Sprint |
|---|---|---|---|
| E1 | 基础设施 | Foundation | 1 |
| E2 | 插件核心 | Alpha | 2 |
| E3 | 规则引擎 | Alpha | 3 |
| E4 | 插件 UI | Alpha | 3 |
| E5 | 云端服务 | Beta | 4 |
| E6 | 云端测试 | Beta | 5 |
| E7 | 通知集成 | Beta | 6 |
| E8 | Beta 完善 | Beta | 7 |
| E9 | GA 收尾 | GA | 8-9 |

### Sprint（9 个）

| Sprint | 周次 | 主题 |
|---|---|---|
| Sprint 1 | T+0-2w | 基础脚手架 |
| Sprint 2 | T+2-4w | 插件核心 |
| Sprint 3 | T+4-6w | Alpha 收口 |
| Sprint 4 | T+6-8w | 云端服务 |
| Sprint 5 | T+8-10w | 云端测试 |
| Sprint 6 | T+10-12w | 通知集成 |
| Sprint 7 | T+12-14w | Beta 完善 |
| Sprint 8 | T+14-16w | 质量加固 |
| Sprint 9 | T+16-18w | GA 发布 |

---

## 故障排查

### `gh: command not found`

```bash
brew install gh
```

### `gh auth status` 失败

```bash
gh auth login
# 选择 GitHub.com → HTTPS → Yes (authenticate git) → Login with browser
```

### `project not found`

确保仓库有 Projects 权限：
- User-level: `https://github.com/users/<owner>/projects`
- Org-level: `https://github.com/orgs/<org>/projects`

### GraphQL 速率限制

`gh api graphql` 默认 5000 req/h。脚本已添加 `sleep 0.5`。

如果遇到：
```bash
API rate limit exceeded
```

等待 1 小时或使用 `gh auth refresh -s project,admin:org`。

### 字段已存在错误

脚本会自动跳过已存在的字段。如需重建：
```bash
./setup-github-project.sh <owner> <repo> --reset
```

### Issue 编号映射失败

Issue 标题搜索依赖 `[SG-XXX]` 前缀。如果手动修改过标题，映射会失败。修复：
```bash
# 删除缓存
rm .github-project/.issue-map.tsv
# 重新建立映射（不创建新 issue）
./setup-github-project.sh <owner> <repo> --phase 4
```

### 字段值设置失败

GraphQL field value mutation 复杂，常见问题：
- Option ID 不正确 → 重新执行阶段 2 获取最新 IDs
- Item 不在 Project 中 → 先执行阶段 4
- 权限不足 → 确认 token 有 `project` scope

---

## 重跑与重置

### 部分重跑

```bash
# 只重建字段
./setup-github-project.sh <owner> <repo> --phase 2

# 重新添加 issues (跳过已存在)
./setup-github-project.sh <owner> <repo> --phase 4
```

### 完全重置

```bash
# 删除 Project (UI: Settings → Danger Zone → Delete)
gh project delete <num> --owner <owner>

# 删除所有 issues
gh issue list --repo <owner>/<repo> --state all --json number --jq '.[].number' | \
  xargs -I {} gh issue delete {} --repo <owner>/<repo> --yes

# 删除所有 labels (保留系统默认)
# 在 UI 中: Issues → Labels → 批量删除

# 删除所有 milestones
gh api repos/<owner>/<repo>/milestones --jq '.[].number' | \
  xargs -I {} gh api -X DELETE repos/<owner>/<repo>/milestones/{}

# 完全重跑
./setup-github-project.sh <owner> <repo>
```

---

## 相关链接

- 📋 [PRD](../../PRD.md)
- 🛠️ [TDD](../../TDD.md)
- 🎨 [Wireframes](../../Wireframes.md)
- 🎫 [Tickets](../../tickets/INDEX.md)
- 📊 [Tickets CSV](../../tickets/tickets.csv)（可导入 Jira / Linear）
- 🐙 [GitHub Projects 文档](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- 🔧 [GitHub Projects GraphQL API](https://docs.github.com/en/graphql/reference/objects#projectv2)

---

*Generated 2026-06-17 · 配套 PRD v1.0-merged / TDD v1.0 / Wireframes v1.0 / tickets v1.0*
