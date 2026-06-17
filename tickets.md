# ScriptGuard — MVP Ticket 拆分

## MVP Implementation Tickets v1.0

| 字段 | 值 |
|------|-----|
| 关联文档 | [PRD.md](./PRD.md) v1.0-merged · [TDD.md](./TDD.md) v1.0 · [Wireframes.md](./Wireframes.md) v1.0 |
| 文档版本 | v1.0 |
| 创建日期 | 2026-06-17 |
| 状态 | 待评审与分配 |
| 目标 | 18 周内交付 v1.0 GA |
| 范围 | Alpha(6w) + Beta(12w) + GA 收尾(18w) |

---

## 目录

1. [估算与约定](#1-估算与约定)
2. [Epic 与里程碑划分](#2-epic-与里程碑划分)
3. [Sprint 计划](#3-sprint-计划)
4. [Ticket 清单（45 张）](#4-ticket-清单45-张)
5. [依赖图](#5-依赖图)
6. [风险 Ticket](#6-风险-ticket)
7. [Definition of Done](#7-definition-of-done)

---

## 1. 估算与约定

### 1.1 Story Point 标准（斐波那契）

| 点数 | 工作量 | 含义 |
|---|---|---|
| **1** | < 2h | 微小变更、配置、文案 |
| **2** | 2-4h | 小型 bug、单个组件 |
| **3** | 0.5-1d | 单个功能点 |
| **5** | 1-3d | 中等功能 |
| **8** | 3-5d | 大型功能（**需拆分**） |
| **13** | 1-2w | Epic 级别（**必须拆分**） |

**总预算**：MVP 约 **220 story points**（2.5 个工程师 × 18 周 × ~5 pt/人/周）

### 1.2 优先级定义

| 级别 | 含义 | SLA |
|---|---|---|
| **P0** | MVP 必做，缺失则无法发布 | 阻塞其他 |
| **P1** | MVP 强烈建议，影响产品完整性 | 1 周内必须解决 |
| **P2** | MVP 可选，能在 GA 前完成即可 | 排期灵活 |

### 1.3 Type 定义

| Type | 含义 |
|---|---|
| **Feature** | 新功能 |
| **Enhancement** | 已有功能增强 |
| **Bug** | 缺陷修复 |
| **Chore** | 工具/重构/依赖 |
| **Docs** | 文档 |
| **Test** | 测试相关 |
| **Spike** | 调研类（限时） |

### 1.4 Owner 角色

| 角色 | 缩写 | 主要负责 |
|---|---|---|
| **Frontend Engineer** | FE | 浏览器插件、UI、Popup、Options |
| **Backend Engineer** | BE | 云端 API、DB、Runner |
| **Full-stack** | FS | 横跨前后端 |
| **DevOps** | DO | CI/CD、部署、监控 |
| **Designer** | DS | UI/UX、Logo、品牌 |
| **QA** | QA | 测试、自动化、兼容性 |
| **Tech Lead** | TL | 架构、Code Review |

### 1.5 Label 体系（GitHub 同步用）

**领域**（`area:*`）：
- `area:plugin` 浏览器插件
- `area:popup` Popup 页面
- `area:options` Options 后台
- `area:overlay` 页面内浮层
- `area:server` 云端服务
- `area:runner` Playwright Runner
- `area:db` 数据库
- `area:notify` 通知系统
- `area:infra` 基础设施
- `area:design` 设计

**类型**（`type:*`）：
- `type:feature` `type:bug` `type:chore` `type:docs` `type:test` `type:spike`

**优先级**（`prio:*`）：
- `prio:P0` `prio:P1` `prio:P2`

**里程碑**（`milestone:*`）：
- `m:foundation` `m:alpha` `m:beta` `m:ga`

---

## 2. Epic 与里程碑划分

| ID | Epic | 范围 | 周次 | 故事点 |
|---|---|---|---|---|
| **E1** | 基础设施与脚手架 | Monorepo、CI、设计系统、DB | T+0~2w | 28 |
| **E2** | 插件核心架构 | Background SW、Content Script、状态 | T+2~4w | 24 |
| **E3** | 健康检查引擎 | 规则执行器、检测流程 | T+4~5w | 18 |
| **E4** | 插件 UI（Alpha） | Popup、Options MVP、浮层 | T+5~6w | 22 |
| **E5** | 云端服务基础 | API、认证、同步、DB | T+6~9w | 30 |
| **E6** | 云端测试引擎 | Playwright Runner、队列、报告 | T+9~11w | 26 |
| **E7** | 通知与集成 | Webhook、邮件、GitHub Actions | T+11~13w | 20 |
| **E8** | Beta 完善 | 仪表盘、设置、Tampermonkey、选择器 | T+13~15w | 22 |
| **E9** | GA 收尾 | 性能、测试、上架、文档 | T+15~18w | 30 |
| **合计** | | | **18w** | **220** |

---

## 3. Sprint 计划

每个 Sprint 为 2 周。9 个 Sprint = 18 周。

| Sprint | 周次 | 主题 | 主要 Ticket | 目标 |
|---|---|---|---|---|
| **S1** | T+0~2w | 基础脚手架 | SG-001 ~ SG-010 | Monorepo + CI + 设计系统 + DB |
| **S2** | T+2~4w | 插件核心 | SG-011 ~ SG-018 | Background + Content + Script 存储 |
| **S3** | T+4~6w | Alpha 收口 | SG-019 ~ SG-027 | 规则引擎 + 浮层 + 通知 + 手动测试 |
| **S4** | T+6~8w | 云端服务 | SG-028 ~ SG-034 | API + 认证 + 同步 + DB Schema |
| **S5** | T+8~10w | 云端测试 | SG-035 ~ SG-039 | Playwright + 队列 + 报告 |
| **S6** | T+10~12w | 通知集成 | SG-040 ~ SG-043 | Webhook + 邮件 + GH Actions + Tampermonkey |
| **S7** | T+12~14w | Beta 完善 | SG-044 ~ SG-046 | 仪表盘 + 设置 + 选择器助手 |
| **S8** | T+14~16w | 质量加固 | SG-047 ~ SG-050 | E2E + 性能 + 兼容性 + 文档 |
| **S9** | T+16~18w | GA 发布 | SG-051 ~ SG-053 | Web Store + 部署 + 营销页 |

---

## 4. Ticket 清单（45 张）

> **格式说明**：每张 ticket 包含 ID、标题、类型/优先级/估算/Owner/依赖、Description、AC、Technical Notes。可直接复制到 GitHub Issue / Linear / Jira。

---

### Epic 1：基础设施与脚手架（Sprint 1）

#### SG-001 | Chore | 初始化 Monorepo 与工具链

| 字段 | 值 |
|---|---|
| **Type** | Chore |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | TL + DO |
| **Dependencies** | 无 |
| **Labels** | `area:infra`, `type:chore`, `m:foundation` |
| **Milestone** | Alpha |

**Description**：
搭建 pnpm + Turborepo 的 Monorepo 结构，初始化 Git、EditorConfig、.gitignore、README、CONTRIBUTING。

**Acceptance Criteria**：
- [ ] `pnpm-workspace.yaml` 定义 `apps/*` 和 `packages/*`
- [ ] `turbo.json` 配置 build / test / lint / typecheck pipeline
- [ ] 根目录 `.gitignore` / `.editorconfig` / `.prettierrc` 完整
- [ ] README 包含项目介绍、本地开发指南、目录结构
- [ ] `pnpm install` 在干净环境一次成功
- [ ] `pnpm build` 跑通空 pipeline

**Technical Notes**：
参考 TDD §11.1 仓库结构。

---

#### SG-002 | Feature | Plasmo 浏览器插件骨架

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-001 |
| **Labels** | `area:plugin`, `type:feature`, `m:foundation` |

**Description**：
初始化 Plasmo 浏览器插件项目（`apps/extension`），配置 Manifest V3、TypeScript、React 18、Tailwind CSS。

**Acceptance Criteria**：
- [ ] Plasmo 项目创建成功，可 `pnpm dev` 启动
- [ ] Manifest V3 配置正确（permissions、host_permissions）
- [ ] TypeScript 5.4+ 配置，strict 模式开启
- [ ] Tailwind 集成，自定义设计 token 生效
- [ ] Background SW、Content Script、Popup 三个 entrypoint 存在
- [ ] 可在 Chrome `chrome://extensions` 加载 unpacked 扩展
- [ ] `pnpm build` 输出 `build/chrome-mv3-prod` 目录

**Technical Notes**：
参考 TDD §1.1 选型 + Wireframes §1 设计 Token。

---

#### SG-003 | Feature | Fastify 云端服务骨架

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | BE |
| **Dependencies** | SG-001 |
| **Labels** | `area:server`, `type:feature`, `m:foundation` |

**Description**：
初始化 Fastify 服务项目（`apps/server`），集成 Drizzle ORM、Pino 日志、Zod 校验、OpenAPI 文档、健康检查端点。

**Acceptance Criteria**：
- [ ] Fastify 服务可在 `localhost:3000` 启动
- [ ] `/health` 端点返回 `{ status: 'ok' }`
- [ ] `/docs` Swagger UI 可访问
- [ ] Pino 日志 JSON 格式输出
- [ ] Zod 校验统一错误格式
- [ ] 配置通过环境变量 + Zod 校验启动
- [ ] `Dockerfile.server` 可成功构建镜像

**Technical Notes**：
参考 TDD §5.2 REST API 约定。

---

#### SG-004 | Chore | GitHub Actions CI 工作流

| 字段 | 值 |
|---|---|
| **Type** | Chore |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | DO |
| **Dependencies** | SG-001, SG-002, SG-003 |
| **Labels** | `area:infra`, `type:chore`, `m:foundation` |

**Description**：
建立 PR + push 触发的 CI 工作流：安装依赖、类型检查、Lint、单元测试、构建、E2E（仅 main 分支）。

**Acceptance Criteria**：
- [ ] PR 触发：typecheck + lint + test:unit + build
- [ ] push main 触发：上述 + test:e2e + docker build
- [ ] 覆盖率上传到 Codecov
- [ ] 构建产物在 GitHub Actions 中可下载
- [ ] Status check 阻塞 PR 合并

**Technical Notes**：
参考 TDD §11.2 YAML 模板。

---

#### SG-005 | Chore | Docker Compose 本地开发环境

| 字段 | 值 |
|---|---|
| **Type** | Chore |
| **Priority** | P1 |
| **Estimate** | 3 pt |
| **Owner** | DO |
| **Dependencies** | SG-003 |
| **Labels** | `area:infra`, `type:chore`, `m:foundation` |

**Description**：
编写 `docker-compose.yml`，启动 PostgreSQL 16 + Redis 7 服务，供本地开发。

**Acceptance Criteria**：
- [ ] `docker compose up -d` 一键启动 PG + Redis
- [ ] 服务健康检查通过
- [ ] 数据卷持久化
- [ ] `.env.example` 列出所有配置项
- [ ] README 包含初始化步骤

---

#### SG-006 | Chore | 设计 Token 与 Tailwind 主题

| 字段 | 值 |
|---|---|
| **Type** | Chore |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | FE + DS |
| **Dependencies** | SG-002 |
| **Labels** | `area:design`, `type:chore`, `m:foundation` |

**Description**：
把 Wireframes §1 的设计 Token 落地为 Tailwind 配置 + CSS 变量。

**Acceptance Criteria**：
- [ ] `tailwind.config.ts` 包含所有颜色、字体、间距、圆角 token
- [ ] CSS 变量在 `:root` 与 `.dark` 定义
- [ ] 提供 `getToken()` TS 工具函数
- [ ] Storybook 或展示页验证 token 生效
- [ ] 暗色模式跟随 `prefers-color-scheme`

**Technical Notes**：
参考 Wireframes §1.1-1.4 完整 token 列表。

---

#### SG-007 | Chore | shadcn/ui 组件库初始化

| 字段 | 值 |
|---|---|
| **Type** | Chore |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | FE |
| **Dependencies** | SG-006 |
| **Labels** | `area:plugin`, `type:chore`, `m:foundation` |

**Description**：
按需添加 shadcn/ui 组件：Button、Card、Badge、Input、Switch、Dialog、Drawer、Tabs、Table、Toast、Tooltip、Empty、Skeleton、Command。

**Acceptance Criteria**：
- [ ] `components.json` 配置正确
- [ ] 14+ 基础组件添加到 `components/ui/`
- [ ] 所有组件在 Popup 中可见可用
- [ ] 主题切换（亮/暗）正常

**Technical Notes**：
参考 Wireframes §2 组件库约定。

---

#### SG-008 | Design | Logo 与品牌物料

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P1 |
| **Estimate** | 3 pt |
| **Owner** | DS |
| **Dependencies** | 无 |
| **Labels** | `area:design`, `type:feature`, `m:foundation` |

**Description**：
设计 ScriptGuard Logo（SVG）、Favicon、Chrome Web Store 图标（16/32/48/128）、营销海报。

**Acceptance Criteria**：
- [ ] Logo SVG 矢量文件
- [ ] 4 种尺寸 PNG 图标
- [ ] 暗色模式适配
- [ ] 品牌色规范文档
- [ ] 简单使用说明 README

---

#### SG-009 | Feature | Drizzle 数据库 Schema

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | BE |
| **Dependencies** | SG-003 |
| **Labels** | `area:db`, `type:feature`, `m:foundation` |

**Description**：
实现 TDD §4.2.2 的完整 Drizzle Schema，含 users、teams、scripts、check_rules、test_schedules、test_runs、alerts、notify_channels、script_versions 九张表与所有索引。

**Acceptance Criteria**：
- [ ] `apps/server/src/db/schema.ts` 包含所有表定义
- [ ] 所有 enum 类型定义（plan、health_status、run_at、alert_level）
- [ ] 外键 + 索引 + 唯一约束齐全
- [ ] `pnpm db:generate` 生成迁移文件
- [ ] `pnpm db:migrate` 在干净库成功执行
- [ ] Seed 脚本可创建测试用户 + 脚本

**Technical Notes**：
参考 TDD §4.2 Drizzle Schema + §4.2.3 索引。

---

#### SG-010 | Feature | 客户端存储封装层

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-002 |
| **Labels** | `area:plugin`, `type:feature`, `m:foundation` |

**Description**：
封装 chrome.storage（结构化配置）+ IndexedDB（via Dexie，日志和快照）+ chrome.storage.session（临时态）。提供统一 Store API。

**Acceptance Criteria**：
- [ ] `storage/chrome.ts` 封装 chrome.storage.local，提供 KV API
- [ ] `storage/db.ts` 用 Dexie 定义 checks / snapshots / alerts 三张表
- [ ] `storage/session.ts` 封装 chrome.storage.session
- [ ] Zod schema 校验所有写入
- [ ] 30 天日志自动清理（`chrome.alarms` 每日 03:00 触发）
- [ ] 单元测试覆盖所有读写路径

**Technical Notes**：
参考 TDD §4.1 客户端存储分层。

---

### Epic 2：插件核心架构（Sprint 2）

#### SG-011 | Feature | Background Service Worker 架构

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-010 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
搭建 Background SW 核心：消息路由、Tab 注册表、生命周期管理（休眠处理）。

**Acceptance Criteria**：
- [ ] `background/index.ts` 入口
- [ ] `background/router.ts` 类型化消息路由
- [ ] `background/registry.ts` Tab 状态注册表
- [ ] `background/alarms.ts` chrome.alarms 封装
- [ ] `chrome.runtime.onInstalled` / `onStartup` 处理
- [ ] 关键状态写入 storage，不依赖内存
- [ ] E2E 测试：发送消息 → 路由 → 响应正确

**Technical Notes**：
参考 TDD §3.1.1 + §6.2。

---

#### SG-012 | Feature | Content Script 注入框架

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-011 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
实现 Content Script 框架：URL 匹配 → 注入用户脚本 → 错误捕获 → 上报。

**Acceptance Criteria**：
- [ ] Content Script 在 `document_start` 注入
- [ ] 错误捕获脚本 `< 1KB`（error + unhandledrejection）
- [ ] ISOLATED world 与 MAIN world 通信
- [ ] 注入用户脚本超时保护（默认 10s 可配置）
- [ ] 通过 `chrome.runtime.sendMessage` 获取当前 URL 匹配脚本
- [ ] 注入完成后上报 `{ status, failedRules, error }`

**Technical Notes**：
参考 TDD §3.1.2 + §9.4 错误隔离。

---

#### SG-013 | Feature | 脚本匹配引擎

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | FE |
| **Dependencies** | SG-011 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
实现 URL 匹配引擎：通配符、正则、域名匹配。

**Acceptance Criteria**：
- [ ] `matcher/index.ts` 导出 `matchScript(url, rules)` 函数
- [ ] 支持通配符 `*` 和 `?`
- [ ] 支持正则 `/pattern/`
- [ ] 支持纯域名 `example.com`
- [ ] 支持 Tampermonkey `@match` 语法（简化版）
- [ ] 100 个匹配规则 < 5ms 完成匹配
- [ ] 单元测试覆盖率 100%

---

#### SG-014 | Feature | 脚本 CRUD（本地）

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-010, SG-013 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
实现脚本元数据的本地 CRUD：创建、读取、更新、删除、启用、禁用、分组、标签。

**Acceptance Criteria**：
- [ ] `store/scripts.ts` Zustand store + persist 到 chrome.storage
- [ ] API: `createScript`、`updateScript`、`deleteScript`、`enableScript`、`disableScript`
- [ ] 支持按 `tags` / `groupId` / `enabled` 过滤
- [ ] 支持按 `updatedAt` 排序
- [ ] 完整 Zod schema 校验
- [ ] 操作前后数据持久化正确

**Technical Notes**：
参考 TDD §6.1 客户端 Store。

---

#### SG-015 | Feature | 用户脚本注入与执行

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-012, SG-014 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
Content Script 获取匹配的脚本后，按 `runAt` 时机注入到目标页面。

**Acceptance Criteria**：
- [ ] 支持 `document_start` / `document_idle` / `document_end` / `manual` 四种时机
- [ ] 注入方式：`page.evaluate` 或 `chrome.scripting.executeScript`
- [ ] 注入超时保护
- [ ] 注入失败时记录错误日志
- [ ] 注入成功时记录开始时间
- [ ] 执行完成后自动运行关联规则

---

#### SG-016 | Feature | 规则执行器接口与基类

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | FE |
| **Dependencies** | SG-015 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
定义规则执行器接口 `RuleExecutor`、执行上下文 `ExecutionContext`、结果 `RuleResult`。

**Acceptance Criteria**：
- [ ] `rules/types.ts` 定义所有接口
- [ ] `rules/base.ts` 提供 `BaseExecutor` 抽象类
- [ ] `rules/registry.ts` 维护 type → executor 映射
- [ ] 单元测试覆盖接口契约
- [ ] JSDoc 完整

**Technical Notes**：
参考 TDD §3.2.1 执行器接口定义。

---

#### SG-017 | Feature | 6 类规则执行器（MVP 子集）

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | FE |
| **Dependencies** | SG-016 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
实现 MVP 必做的 6 类规则执行器：`selector_exists`、`selector_visible`、`selector_text`、`js_assertion`、`console_clean`、`duration`。

**Acceptance Criteria**：
- [ ] 6 个执行器实现完整
- [ ] 每个执行器单元测试覆盖率 ≥ 90%
- [ ] 性能：单规则 < 100ms
- [ ] 错误信息友好
- [ ] 集成测试：综合场景

**Technical Notes**：
MVP 阶段先实现 6 类，剩余 `selector_clickable` / `selector_inputable` / `url_match` / `network_status` 放到 v1.5（SG-051）。

---

#### SG-018 | Feature | Popup 页面 MVP

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-014, SG-011 |
| **Labels** | `area:popup`, `type:feature`, `m:alpha` |

**Description**：
实现 Popup 页面（W1）：当前 URL、匹配脚本列表、状态、立即测试、打开后台。

**Acceptance Criteria**：
- [ ] 380×500px 固定窗口
- [ ] 当前 URL 显示（域名 + 路径截断）
- [ ] 匹配脚本列表（状态 + 版本 + 时间）
- [ ] "立即测试" 按钮触发手动测试
- [ ] "打开后台" 跳转到 Options 页
- [ ] 首屏 < 500ms
- [ ] 离线可用

**Technical Notes**：
参考 Wireframes W1。

---

### Epic 3 & 4：Alpha 收口（Sprint 3）

#### SG-019 | Feature | 页面内失效浮层

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | FE + DS |
| **Dependencies** | SG-012, SG-017 |
| **Labels** | `area:overlay`, `type:feature`, `m:alpha` |

**Description**：
实现页面内失效浮层（W11）：成功/降级/失败/展开 4 种状态。

**Acceptance Criteria**：
- [ ] 浮层在目标页右上角，z-index 最高
- [ ] 4 种状态视觉区分（颜色 + 图标）
- [ ] 失败时常驻 + 微抖动动画
- [ ] 成功 3s 后自动收起
- [ ] 拖拽到任意位置（位置持久化）
- [ ] ESC 关闭，方向键切换多个浮层
- [ ] 点击"详情"打开 Options 详情页

**Technical Notes**：
参考 Wireframes W11 全部状态。

---

#### SG-020 | Feature | 浏览器桌面通知

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | FE |
| **Dependencies** | SG-019 |
| **Labels** | `area:notify`, `type:feature`, `m:alpha` |

**Description**：
实现 `chrome.notifications` 桌面通知，含失败通知与恢复通知。

**Acceptance Criteria**：
- [ ] 失败时发送桌面通知（含脚本名、原因、链接）
- [ ] 恢复时发送"已恢复"通知
- [ ] 点击通知跳转到 Options 详情页
- [ ] 用户可在设置中关闭
- [ ] 通知包含图标（128x128）

---

#### SG-021 | Feature | 手动测试功能

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-017, SG-018 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
实现"立即测试"功能：手动触发当前页面的健康检查，立即返回结果。

**Acceptance Criteria**：
- [ ] Popup 立即测试按钮可用
- [ ] 后台执行规则，实时显示进度
- [ ] 完成后显示结果摘要（通过/失败/规则详情）
- [ ] 失败时自动弹出浮层
- [ ] 测试记录写入 IndexedDB

---

#### SG-022 | Feature | 本地运行日志

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-010, SG-021 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Acceptance Criteria**：
- [ ] `db.checks` 写入 CheckRecord
- [ ] Options 页"日志" Tab 展示列表
- [ ] 支持按脚本、时间、状态筛选
- [ ] 失败日志可查看 DOM 快照
- [ ] 30 天自动清理
- [ ] 导出 CSV

**Technical Notes**：
参考 TDD §4.1.2 Dexie Schema。

---

#### SG-023 | Feature | chrome.alarms 本地定时检测

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P1 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-021, SG-011 |
| **Labels** | `area:plugin`, `type:feature`, `m:alpha` |

**Description**：
实现本地定时检测：`chrome.alarms` 按用户设定的频率静默打开后台标签页测试。

**Acceptance Criteria**：
- [ ] 每个脚本可配置 `checkInterval`（秒）
- [ ] `chrome.alarms` 注册 `check:<scriptId>` 定时器
- [ ] 定时到点时打开后台标签页（无痕），注入并执行
- [ ] 完成后关闭标签页，释放资源
- [ ] 失败时走通知策略
- [ ] SW 休眠后 alarms 仍能触发

---

#### SG-024 | Feature | Options 页面骨架

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | FE |
| **Dependencies** | SG-018 |
| **Labels** | `area:options`, `type:feature`, `m:alpha` |

**Description**：
实现 Options 后台骨架（W2/W3）：侧边栏、路由、布局、Header。

**Acceptance Criteria**：
- [ ] React Router 6 路由配置
- [ ] 侧边栏 7 个 Tab：概览 / 脚本 / 测试 / 告警 / 日志 / 设置 / 关于
- [ ] Header 含搜索、通知、用户头像
- [ ] 总览页（W2）显示统计卡 + 环形图 + 趋势图
- [ ] 响应式：平板 2 列、桌面 3-4 列
- [ ] 暗色模式

**Technical Notes**：
参考 Wireframes W2 完整设计。

---

#### SG-025 | Feature | 脚本列表与详情

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | FE |
| **Dependencies** | SG-024, SG-014 |
| **Labels** | `area:options`, `type:feature`, `m:alpha` |

**Description**：
实现脚本列表（W3）+ 详情页（W6）的基础版本。

**Acceptance Criteria**：
- [ ] 列表页：状态卡 + 筛选 + 搜索
- [ ] 详情页：基本信息 + 趋势图（30 天）
- [ ] "编辑" 跳转到编辑器
- [ ] "立即测试" 触发测试
- [ ] "删除" 二级确认
- [ ] 批量操作：启用/禁用/删除/导出

**Technical Notes**：
参考 Wireframes W3 + W6。

---

#### SG-026 | Feature | 脚本编辑器 MVP

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | FE |
| **Dependencies** | SG-025 |
| **Labels** | `area:options`, `type:feature`, `m:alpha` |

**Description**：
实现脚本编辑器（W4）：基本信息和 Monaco 代码编辑。

**Acceptance Criteria**：
- [ ] 基本信息表单（名称、版本、URL、运行时机、超时）
- [ ] Monaco Editor 集成（JS/TS 高亮）
- [ ] Tabs：代码 / 配置 / 版本 / 历史
- [ ] ⌘S 保存，弹 changelog
- [ ] 5 秒自动保存草稿
- [ ] 保存前 checklist（规则、lint、测试）

**Technical Notes**：
参考 Wireframes W4。

---

#### SG-027 | Feature | 健康检查规则配置 UI

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | FE + DS |
| **Dependencies** | SG-025, SG-017 |
| **Labels** | `area:options`, `type:feature`, `m:alpha` |

**Description**：
实现健康检查规则配置 UI（W5）：规则列表、表单、添加、删除、排序。

**Acceptance Criteria**：
- [ ] 规则列表（拖拽排序）
- [ ] 6 类规则的可视化配置表单
- [ ] "在页面上选择" 按钮触发 W14
- [ ] "全部测试" 按钮
- [ ] 组合逻辑选择（AND/OR）
- [ ] 超时配置
- [ ] 必需/可选切换

**Technical Notes**：
参考 Wireframes W5 + W14。

---

### Epic 5：云端服务（Sprint 4）

#### SG-028 | Feature | Fastify 路由与 Zod 校验

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | BE |
| **Dependencies** | SG-003, SG-009 |
| **Labels** | `area:server`, `type:feature`, `m:beta` |

**Description**：
搭建 Fastify 路由结构 + Zod 校验 + 统一错误处理。

**Acceptance Criteria**：
- [ ] `/v1/scripts` 等 30+ 端点的 Zod schema
- [ ] `setErrorHandler` 统一错误响应
- [ ] 401 / 403 / 404 / 409 / 422 / 500 错误格式
- [ ] OpenAPI spec 自动生成
- [ ] Swagger UI 可交互测试
- [ ] 集成测试覆盖所有端点

**Technical Notes**：
参考 TDD §5.2 REST API 完整端点表。

---

#### SG-029 | Feature | 认证与 JWT

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | BE |
| **Dependencies** | SG-028, SG-009 |
| **Labels** | `area:server`, `type:feature`, `m:beta` |

**Description**：
实现邮箱密码注册登录 + JWT 颁发与校验。

**Acceptance Criteria**：
- [ ] `POST /v1/auth/register` 注册
- [ ] `POST /v1/auth/login` 登录返回 JWT
- [ ] `POST /v1/auth/refresh` 刷新 token
- [ ] `POST /v1/auth/logout` 登出
- [ ] bcrypt 哈希密码（cost 12）
- [ ] JWT 包含 userId / plan / exp
- [ ] Fastify hook 校验所有受保护端点
- [ ] 速率限制（5 次/分钟/IP）

---

#### SG-030 | Feature | 脚本云端 CRUD API

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | BE |
| **Dependencies** | SG-028, SG-029 |
| **Labels** | `area:server`, `type:feature`, `m:beta` |

**Acceptance Criteria**：
- [ ] 实现 TDD §5.2.1 的 8 个端点
- [ ] 团队空间支持（team_id 关联）
- [ ] 分页（cursor-based）
- [ ] 软删除（`deletedAt`）
- [ ] 集成测试

---

#### SG-031 | Feature | 同步协议（增量同步 + 冲突解决）

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | FS |
| **Dependencies** | SG-010, SG-030 |
| **Labels** | `area:server`, `area:plugin`, `type:feature`, `m:beta` |

**Description**：
实现客户端 ↔ 云端的双向同步协议：增量推送、增量拉取、冲突检测与解决。

**Acceptance Criteria**：
- [ ] `POST /v1/sync/push` 推送本地变更
- [ ] `POST /v1/sync/pull` 拉取云端变更（基于 lastSyncAt）
- [ ] 冲突返回 `conflicts[]` 数组
- [ ] 客户端弹冲突解决弹窗
- [ ] last-write-wins 默认策略
- [ ] E2E 测试双向同步

**Technical Notes**：
参考 TDD §4.3 同步协议。

---

#### SG-032 | Feature | 检查规则云端 API

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | BE |
| **Dependencies** | SG-030 |
| **Labels** | `area:server`, `type:feature`, `m:beta` |

**Acceptance Criteria**：
- [ ] TDD §5.2.2 全部端点
- [ ] 规则与脚本级联删除
- [ ] order 字段支持拖拽排序

---

#### SG-033 | Feature | 测试调度 API

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | BE |
| **Dependencies** | SG-030, SG-032 |
| **Labels** | `area:server`, `type:feature`, `m:beta` |

**Acceptance Criteria**：
- [ ] TDD §5.2.3 全部端点
- [ ] 创建 schedule 时校验 cron 格式
- [ ] 立即执行（`run-now`）触发 BullMQ 任务
- [ ] run 历史分页查询

---

#### SG-034 | Spike | BullMQ vs Inngest 调研

| 字段 | 值 |
|---|---|
| **Type** | Spike |
| **Priority** | P2 |
| **Estimate** | 2 pt |
| **Owner** | BE |
| **Dependencies** | 无 |
| **Labels** | `area:server`, `type:spike`, `m:beta` |
| **Timebox** | 3 天 |

**Description**：
验证 BullMQ 选型合理性，评估 Inngest / Trigger.dev 等替代方案。

**Acceptance Criteria**：
- [ ] 输出对比文档（功能、性能、成本、生态）
- [ ] BullMQ POC：实现一个 repeat job
- [ ] 给出最终决策与理由

---

### Epic 6：云端测试引擎（Sprint 5）

#### SG-035 | Feature | BullMQ 任务队列基础设施

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | BE |
| **Dependencies** | SG-003 |
| **Labels** | `area:server`, `area:runner`, `type:feature`, `m:beta` |

**Description**：
搭建 BullMQ：Redis 连接、Worker、Queue、Schedule、监控。

**Acceptance Criteria**：
- [ ] `test-runs` queue + worker
- [ ] repeat jobs 支持 cron
- [ ] 并发控制（默认 3）
- [ ] 失败重试（指数退避）
- [ ] 队列深度指标（Prometheus）
- [ ] Bull Board UI（开发环境）

---

#### SG-036 | Feature | Playwright Runner 容器

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | BE |
| **Dependencies** | SG-035 |
| **Labels** | `area:runner`, `type:feature`, `m:beta` |

**Description**：
实现 Playwright Runner：Docker 镜像、Worker 消费任务、启动浏览器、执行检测。

**Acceptance Criteria**：
- [ ] `Dockerfile.runner` 基于 `mcr.microsoft.com/playwright`
- [ ] Worker 启动 chromium + 监听 jobs
- [ ] 注入错误捕获脚本
- [ ] `page.goto` + `addScriptTag` 注入用户脚本
- [ ] 执行 SDK.check() 序列
- [ ] 收集结果 + 截图 + DOM 快照
- [ ] 资源控制：context 30s 超时 + 强制 close
- [ ] 单 Runner 最多 3 context

**Technical Notes**：
参考 TDD §3.2.3 Runner 设计。

---

#### SG-037 | Feature | 测试报告持久化

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | BE |
| **Dependencies** | SG-033, SG-036 |
| **Labels** | `area:server`, `type:feature`, `m:beta` |

**Acceptance Criteria**：
- [ ] `test_runs` 表写入完成
- [ ] 截图上传到 S3
- [ ] DOM 快照上传到 S3
- [ ] 失败时按告警策略触发通知
- [ ] 历史归档任务（月度）

---

#### SG-038 | Feature | 测试报告 UI

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-024, SG-037 |
| **Labels** | `area:options`, `type:feature`, `m:beta` |

**Description**：
实现测试报告页（W7）：截图、规则结果、错误日志、网络请求、DOM 快照。

**Acceptance Criteria**：
- [ ] 顶部摘要：状态、耗时、URL、模式
- [ ] 截图缩略图（点击放大）
- [ ] 检查结果列表（pass/fail + 详情）
- [ ] 错误日志面板
- [ ] 网络请求列表（可展开）
- [ ] "下载报告" / "重跑" 按钮

**Technical Notes**：
参考 Wireframes W7。

---

#### SG-039 | Feature | 告警与通知 API

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | BE |
| **Dependencies** | SG-033, SG-037 |
| **Labels** | `area:server`, `area:notify`, `type:feature`, `m:beta` |

**Acceptance Criteria**：
- [ ] `alerts` 表写入（失败 / 恢复 / 降级）
- [ ] TDD §5.2.4 端点
- [ ] 指数退避策略执行
- [ ] 静默窗口检查
- [ ] 告警合并逻辑

---

### Epic 7：通知与集成（Sprint 6）

#### SG-040 | Feature | 通知中心（多通道适配器）

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FS |
| **Dependencies** | SG-039 |
| **Labels** | `area:notify`, `type:feature`, `m:beta` |

**Description**：
实现通知分发中心：浏览器通知、邮件、Webhook 等通道的统一抽象。

**Acceptance Criteria**：
- [ ] `NotificationChannel` 接口
- [ ] `BrowserNotificationChannel`（插件端）
- [ ] `EmailChannel`（服务端）
- [ ] `WebhookChannel`（服务端）
- [ ] `dispatcher.ts` 路由到正确通道
- [ ] 失败重试（指数退避 3 次）

**Technical Notes**：
参考 TDD §3.2.4 通知服务。

---

#### SG-041 | Feature | Webhook 适配器（飞书/钉钉/Slack/通用）

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FS |
| **Dependencies** | SG-040 |
| **Labels** | `area:notify`, `type:feature`, `m:beta` |

**Acceptance Criteria**：
- [ ] 4 套模板：飞书、钉钉、Slack、通用
- [ ] 用户选择模板后自动渲染
- [ ] `POST /v1/channels/:id/test` 发送测试消息
- [ ] HMAC 签名支持
- [ ] 集成测试每个通道

**Technical Notes**：
参考 TDD §5.3 模板定义。

---

#### SG-042 | Feature | 邮件通知（Nodemailer）

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | BE |
| **Dependencies** | SG-040 |
| **Labels** | `area:notify`, `type:feature`, `m:beta` |

**Acceptance Criteria**：
- [ ] SMTP 配置（支持主流供应商）
- [ ] HTML 邮件模板
- [ ] 每日 09:00 摘要邮件
- [ ] 失败立即邮件
- [ ] 退订链接

---

#### SG-043 | Feature | GitHub Actions 集成

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FS |
| **Dependencies** | SG-037, SG-039 |
| **Labels** | `area:plugin`, `type:feature`, `m:beta` |

**Description**：
实现 GH Actions 集成：用户生成 YAML 模板 → 仓库运行 → 回传结果。

**Acceptance Criteria**：
- [ ] Options 页 W13 向导：4 步流程
- [ ] 生成 `.github/workflows/scriptguard.yml`
- [ ] 公开 `scriptguard/action@v1` Docker action
- [ ] Action 接收 SG_TOKEN + script-id
- [ ] 结果通过 `POST /v1/webhook/gh-actions/:token` 回传
- [ ] 签名验证
- [ ] 文档完整

---

### Epic 8：Beta 完善（Sprint 7）

#### SG-044 | Feature | 告警中心 UI

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-024, SG-039 |
| **Labels** | `area:options`, `type:feature`, `m:beta` |

**Description**：
实现告警中心页面（W8）：告警列表、级别筛选、静默规则。

**Acceptance Criteria**：
- [ ] 4 个级别 Tab
- [ ] 告警卡片（级别 + 时间 + 脚本 + 操作）
- [ ] "确认告警" 按钮
- [ ] "静默 1 小时" 按钮
- [ ] 静默规则配置

**Technical Notes**：
参考 Wireframes W8。

---

#### SG-045 | Feature | 设置页面（通知 + 通用）

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | FE |
| **Dependencies** | SG-024 |
| **Labels** | `area:options`, `type:feature`, `m:beta` |

**Description**：
实现设置页（W9 + W10）：通知渠道、检测设置、存储、主题、快捷键、调试。

**Acceptance Criteria**：
- [ ] W9 通知设置：9 种渠道开关 + Webhook 配置弹窗
- [ ] W10 通用设置：检测频率、存储、主题、快捷键
- [ ] 配置保存到 chrome.storage
- [ ] 修改即时生效

**Technical Notes**：
参考 Wireframes W9 + W10。

---

#### SG-046 | Feature | 选择器采集助手

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P1 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-027 |
| **Labels** | `area:options`, `type:feature`, `m:beta` |

**Description**：
实现"在页面上选择"功能（W14）：点选元素生成稳定选择器。

**Acceptance Criteria**：
- [ ] 激活选择模式后悬停高亮元素
- [ ] 点击后生成选择器
- [ ] 按 9 级优先级降级
- [ ] 稳定性评分（0-100）
- [ ] 多候选展示
- [ ] 验证匹配数量
- [ ] "确认选择" 保存为规则

**Technical Notes**：
参考 Wireframes W14 + TDD §3.2.2 选择器生成器算法。

---

### Epic 9：GA 收尾（Sprint 8-9）

#### SG-047 | Test | 关键流程 E2E 自动化

| 字段 | 值 |
|---|---|
| **Type** | Test |
| **Priority** | P0 |
| **Estimate** | 8 pt |
| **Owner** | QA |
| **Dependencies** | SG-024, SG-027, SG-038 |
| **Labels** | `type:test`, `m:ga` |

**Description**：
用 Playwright 编写 5 个关键流程的 E2E 测试。

**Acceptance Criteria**：
- [ ] 流程 1：安装插件 → 创建脚本 → 配置规则 → 访问目标页 → 浮层弹出
- [ ] 流程 2：定时任务 → 云端执行 → 报告生成
- [ ] 流程 3：失败 → 通知 → 告警中心 → 确认
- [ ] 流程 4：Tampermonkey 导入 .user.js
- [ ] 流程 5：GitHub Actions 触发 + 回传
- [ ] CI 中每次 PR 跑通

**Technical Notes**：
参考 TDD §10.4 E2E 测试。

---

#### SG-048 | Chore | 性能优化（Bundle 与首屏）

| 字段 | 值 |
|---|---|
| **Type** | Chore |
| **Priority** | P1 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-024, SG-027 |
| **Labels** | `area:plugin`, `type:chore`, `m:ga` |

**Description**：
优化插件 Bundle 体积与首屏加载时间。

**Acceptance Criteria**：
- [ ] Background SW < 50KB
- [ ] Content Script < 30KB
- [ ] Popup 首屏 < 500ms
- [ ] Options 首屏 < 1s
- [ ] 路由懒加载
- [ ] 重型库按需加载（Monaco）

**Technical Notes**：
参考 TDD §8 性能优化。

---

#### SG-049 | Test | 跨浏览器兼容性测试

| 字段 | 值 |
|---|---|
| **Type** | Test |
| **Priority** | P1 |
| **Estimate** | 3 pt |
| **Owner** | QA |
| **Dependencies** | SG-002 |
| **Labels** | `type:test`, `m:ga` |

**Acceptance Criteria**：
- [ ] Chrome 120+ 全部通过
- [ ] Edge 120+ 全部通过
- [ ] Firefox 115+ 全部通过
- [ ] Firefox 兼容性修复（如 `browser.*` vs `chrome.*`）
- [ ] 隐身模式测试
- [ ] 多标签页并发测试

---

#### SG-050 | Docs | 文档站（v1.0）

| 字段 | 值 |
|---|---|
| **Type** | Docs |
| **Priority** | P1 |
| **Estimate** | 5 pt |
| **Owner** | DS + FE |
| **Dependencies** | 无 |
| **Labels** | `type:docs`, `m:ga` |

**Description**：
搭建 Vercel + Fumadocs 文档站，覆盖快速开始、用户指南、API、SDK、FAQ。

**Acceptance Criteria**：
- [ ] 快速开始（5 分钟跑通）
- [ ] 用户指南（所有功能）
- [ ] API 文档（自动从 OpenAPI 生成）
- [ ] SDK 文档
- [ ] FAQ
- [ ] 中英双语
- [ ] 搜索功能

---

#### SG-051 | Feature | Chrome Web Store 上架

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P0 |
| **Estimate** | 3 pt |
| **Owner** | DO + DS |
| **Dependencies** | SG-002, SG-008 |
| **Labels** | `area:infra`, `type:feature`, `m:ga` |

**Acceptance Criteria**：
- [ ] Chrome Web Store 开发者账号注册
- [ ] 商品详情：标题、描述、截图（1280×800，5 张）
- [ ] 隐私政策页面
- [ ] 权限说明文档
- [ ] 一次性付费 $5 注册费
- [ ] 提交审核
- [ ] 通过审核 → 公开

---

#### SG-052 | Chore | 服务端生产部署

| 字段 | 值 |
|---|---|
| **Type** | Chore |
| **Priority** | P0 |
| **Estimate** | 5 pt |
| **Owner** | DO |
| **Dependencies** | SG-003, SG-005, SG-009 |
| **Labels** | `area:infra`, `type:chore`, `m:ga` |

**Description**：
部署 Fastify + PG + Redis + Runner 到生产环境（Hetzner / DigitalOcean）。

**Acceptance Criteria**：
- [ ] 生产环境机器初始化
- [ ] Docker Compose 部署所有服务
- [ ] Nginx 反代 + SSL（Let's Encrypt）
- [ ] 数据库备份策略（每日）
- [ ] 监控接入（Sentry + Grafana）
- [ ] 健康检查 + 自动重启
- [ ] 域名 + DNS 配置

---

#### SG-053 | Design | 营销官网

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P1 |
| **Estimate** | 5 pt |
| **Owner** | DS |
| **Dependencies** | SG-008 |
| **Labels** | `area:design`, `type:feature`, `m:ga` |

**Acceptance Criteria**：
- [ ] 首页（Hero + 特性 + 用户场景 + 截图 + 价格 + FAQ）
- [ ] 定价页
- [ ] 文档入口
- [ ] 博客模板
- [ ] SEO 优化
- [ ] GA / Plausible 统计

---

#### SG-054 | Feature | 4 类补充规则执行器（v1.0 收口）

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P1 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-017 |
| **Labels** | `area:plugin`, `type:feature`, `m:ga` |

**Description**：
补齐剩余 4 类规则：`selector_clickable`、`selector_inputable`、`url_match`、`network_status`。

**Acceptance Criteria**：
- [ ] 4 个执行器实现
- [ ] 单元测试覆盖率 ≥ 85%
- [ ] 与现有 6 类无缝集成
- [ ] 文档更新

---

#### SG-055 | Feature | Tampermonkey 协同与导入

| 字段 | 值 |
|---|---|
| **Type** | Feature |
| **Priority** | P1 |
| **Estimate** | 5 pt |
| **Owner** | FE |
| **Dependencies** | SG-014, SG-046 |
| **Labels** | `area:plugin`, `type:feature`, `m:ga` |

**Description**：
支持从 Tampermonkey 导入 .user.js 文件，解析 `@name`、`@version`、`@match` 等元信息。

**Acceptance Criteria**：
- [ ] 拖拽 / 选择 .user.js 文件
- [ ] 解析 Tampermonkey 元信息头
- [ ] 自动填充表单
- [ ] 智能生成基础规则（基于常见模式）
- [ ] 跨插件通信检测（`externally_connectable`）

**Technical Notes**：
参考 PRD §2.2 F1 脚本管理。

---

## 5. 依赖图

### 5.1 关键路径（Critical Path）

```
SG-001 → SG-002 → SG-011 → SG-012 → SG-015 → SG-019 → SG-027 → SG-047
                                  ↓
                              SG-014
                                  ↓
                              SG-018
                                  ↓
                              SG-021

SG-003 → SG-009 → SG-028 → SG-029 → SG-030 → SG-031 → SG-035 → SG-036 → SG-037 → SG-039 → SG-040 → SG-041 → SG-043
```

### 5.2 依赖矩阵（节选）

| Ticket | 直接依赖 | 被依赖 |
|---|---|---|
| SG-001 | — | 002, 003, 008 |
| SG-002 | 001 | 010, 011, 048 |
| SG-003 | 001 | 004, 009, 028, 035 |
| SG-009 | 003 | 028, 029, 030 |
| SG-010 | 002 | 011, 014, 022 |
| SG-011 | 010 | 012, 013, 023, 018 |
| SG-014 | 010, 013 | 015, 018, 025, 055 |
| SG-027 | 025, 017 | 046 |
| SG-036 | 035 | 037, 043 |

### 5.3 并行机会

**Sprint 1-2（无服务端依赖，可并行）**：
- FE：SG-002、SG-006、SG-007、SG-010
- BE：SG-003、SG-009
- DS：SG-008
- DO：SG-004、SG-005

**Sprint 3（FE 主要工作，BE 可准备）**：
- FE：SG-019、SG-020、SG-021、SG-024、SG-025、SG-026、SG-027
- BE：开始 SG-028、SG-029

**Sprint 4-5（前后端并行）**：
- FE：仪表盘、报告页
- BE：API、认证、Runner

---

## 6. 风险 Ticket

独立标记的高风险 / 不确定项，建议每项分配"调研 + 兜底"双倍时间。

| Ticket | 风险 | 缓解 |
|---|---|---|
| **SG-012** | Content Script 与用户脚本的执行时机冲突 | 多种 runAt 实测，必要时降级 |
| **SG-023** | chrome.alarms 在 SW 休眠后的触发可靠性 | 实测多个浏览器版本；fallback 用 setTimeout + chrome.idle |
| **SG-031** | 离线优先 + 云端同步的冲突解决边界 | 先做 last-write-wins，复杂情况调研 CRDT |
| **SG-035** | BullMQ 替代品（Inngest）可能在 Beta 期有更好的 DX | SG-034 已铺垫 spike |
| **SG-036** | Playwright Runner 资源消耗大，云端成本高 | 资源限制 + 监控 + 容量规划 |
| **SG-043** | GitHub Action 镜像构建时间和大小 | 复用 Playwright 基础镜像，预构建缓存 |
| **SG-048** | Bundle 体积膨胀（特别是 Monaco） | 提前 benchmark，按需加载 |
| **SG-049** | Firefox MV3 兼容性（`browser.*` vs `chrome.*`） | 抽象层 + 充分测试 |
| **SG-051** | Chrome Web Store 审核被拒 | 严格遵循最小权限；详细权限说明 |
| **SG-055** | Tampermonkey 跨插件 API 不开放 | 已设计导入导出兜底（PRD §4.3） |

---

## 7. Definition of Done

每张 ticket 必须满足以下条件才能关闭：

### 7.1 代码质量

- [ ] 代码合并到主分支（或对应 feature 分支）
- [ ] 通过 ESLint + TypeScript 严格类型检查
- [ ] Code Review 通过（至少 1 个 reviewer）
- [ ] 无新增 lint warning
- [ ] 无新增 `any` 类型（特殊情况需注释说明）

### 7.2 测试

- [ ] 单元测试覆盖：核心逻辑 ≥ 80%
- [ ] 集成测试 / E2E 覆盖关键路径
- [ ] 手动 QA 通过
- [ ] 无 P0/P1 缺陷遗留
- [ ] P2 缺陷记录到 backlog

### 7.3 文档

- [ ] 公共 API / 函数有 JSDoc
- [ ] 用户可见功能有用户文档更新
- [ ] 复杂逻辑有代码内注释
- [ ] 变更更新到 CHANGELOG

### 7.4 部署与可观测

- [ ] 涉及运行时的 ticket 在 staging 验证
- [ ] 关键路径有日志 / 埋点
- [ ] 性能影响已评估（特别是 SG-019、SG-024、SG-027）
- [ ] 错误处理路径已测试

### 7.5 Issue 关闭

- [ ] 所有 AC checkbox 已勾选
- [ ] 关联 PR 链接已贴入
- [ ] 关闭时填写实际完成时间 vs 估算
- [ ] 若超期 > 50%，root cause 记录到 retro

---

## 附录 A：Story Point 总览

| Epic | Ticket 数 | 故事点 | 占比 |
|---|---:|---:|---:|
| E1 基础设施 | 10 | 40 | 18% |
| E2 插件核心 | 8 | 37 | 17% |
| E3 健康检查 | 1 | 8 | 4% |
| E4 插件 UI | 6 | 44 | 20% |
| E5 云端服务 | 7 | 33 | 15% |
| E6 云端测试 | 5 | 26 | 12% |
| E7 通知集成 | 4 | 18 | 8% |
| E8 Beta 完善 | 3 | 18 | 8% |
| E9 GA 收尾 | 9 | 31 | 14% |
| **合计** | **53** | **255** | **100%** |

> 注：实际 MVP 45 + Beta 完善 5 + GA 收尾 3 = 53 张 ticket，覆盖 PRD MVP + 必要 GA 收口项。

## 附录 B：人员分配建议（2.5 工程师团队）

| 角色 | 占比 | 主要负责 Epic |
|---|---|---|
| **FE 全栈** (1 人) | 50% | E1 部分、E2、E3、E4、E8 |
| **BE 全栈** (1 人) | 50% | E1 部分、E5、E6、E7 |
| **DevOps/QA 兼职** (0.5 人) | 25% | E1 CI/CD、E9 测试与部署 |
| **设计师 兼职** (0.3 人) | 15% | SG-008、E1 设计系统、E9 营销页 |

> 关键风险：MVP 17 周内单 FE 单 BE 工作量较重。**建议至少 2 FE + 1 BE** 才能按时交付。

---

## 附录 C：GitHub Issue 同步脚本

如果你要把这些 ticket 推送到 GitHub Issues，可使用以下脚本：

```bash
# 创建所有 ticket（需 gh CLI 已认证）
gh issue create \
  --title "[SG-001] 初始化 Monorepo 与工具链" \
  --body-file tickets/sg-001.md \
  --label "area:infra,type:chore,prio:P0,milestone:foundation" \
  --assignee "@me"

# 批量创建脚本（建议写一个 Node 脚本）
node scripts/create-tickets.js
```

每个 ticket 的 `.md` 文件可按本文档第 4 节的格式生成。

---

*ScriptGuard MVP Tickets v1.0 · 2026-06-17 · 配套 PRD/TDD/Wireframes 使用*
