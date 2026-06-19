# ScriptGuard — 技术设计文档 (TDD)

## Technical Design Document v1.0

| 字段 | 值 |
|------|-----|
| 关联 PRD | [PRD.md](./PRD.md) v1.0-merged |
| 文档版本 | v1.0 |
| 创建日期 | 2026-06-17 |
| 作者 | 工程团队 |
| 文档状态 | 设计稿 - 待评审 |
| 保密级别 | 内部公开 |

---

## 目录

1. [技术栈选型](#1-技术栈选型)
2. [系统架构](#2-系统架构)
3. [模块详细设计](#3-模块详细设计)
4. [数据模型与存储](#4-数据模型与存储)
5. [API 设计](#5-api-设计)
6. [状态管理](#6-状态管理)
7. [安全设计](#7-安全设计)
8. [性能优化](#8-性能优化)
9. [错误处理策略](#9-错误处理策略)
10. [测试策略](#10-测试策略)
11. [部署与 CI/CD](#11-部署与-cicd)
12. [可观测性](#12-可观测性)
13. [技术风险与缓解](#13-技术风险与缓解)
14. [附录：技术决策记录 (ADR)](#14-附录技术决策记录-adr)

---

## 1. 技术栈选型

### 1.1 浏览器插件端

| 类别 | 选型 | 版本 | 选型理由 |
|------|------|------|----------|
| **框架** | Plasmo | ^0.85 | 专为 MV3 设计、零配置 HMR、内置 TypeScript/React 优化、Bundle 体积小 |
| **UI 库** | React | 18.3 | 生态成熟、并发渲染、Suspense 支持 |
| **语言** | TypeScript | 5.4+ | 类型安全、IDE 提示、降低维护成本 |
| **样式** | Tailwind CSS | 3.4 | 原子化、Tree-shake 友好、Bundle 小 |
| **组件库** | shadcn/ui | latest | 复制源码可定制、无运行时依赖、Radix 底座无障碍 |
| **状态管理** | Zustand | 4.5 | 轻量（1.2KB）、无 Provider、持久化插件支持 |
| **数据校验** | Zod | 3.23 | TS 友好、运行时校验、类型推导 |
| **IndexedDB** | Dexie.js | 4.0 | Promise API、Schema 版本管理、性能优 |
| **代码编辑器** | CodeMirror 6 | latest | 轻量、Tree-shake 友好、内置 TS/JS 高亮 |
| **图表** | Recharts | 2.12 | 轻量、React 友好、SVG 渲染 |
| **HTTP** | fetch + ky | latest | ky 提供重试、超时、拦截器 |
| **国际化** | react-i18next | 14.x | 成熟、命名空间、懒加载 |
| **测试** | Vitest + Playwright | latest | 单元 + E2E 统一 |
| **打包** | Vite (via Plasmo) | 5.x | HMR 极快、ESM 原生 |
| **代码规范** | ESLint + Prettier + tsc | latest | 团队一致性 |
| **Git Hooks** | husky + lint-staged | latest | 提交前质量门禁 |

### 1.2 云端服务

| 类别 | 选型 | 版本 | 选型理由 |
|------|------|------|----------|
| **运行时** | Node.js | 20 LTS | 性能稳定、Playwright 支持成熟 |
| **Web 框架** | Fastify | 4.27 | 比 Express 快 2x、原生 TS Schema、插件生态丰富 |
| **数据库** | PostgreSQL | 16 | 关系型 + JSONB 兼顾、可靠性高 |
| **ORM** | Drizzle ORM | 0.30+ | TS-first、迁移工具完善、零运行时开销 |
| **缓存** | Redis | 7 | 会话、限流、分布式锁 |
| **任务队列** | BullMQ | 5.x | 基于 Redis、原生 Cron、并发控制、可观测 |
| **浏览器自动化** | Playwright | 1.45+ | 跨浏览器、原生等待 API、稳定性高 |
| **邮件** | Nodemailer | 6.x | 成熟、SMTP 多供应商支持 |
| **日志** | Pino | 8.x | 高性能 JSON 日志、Fastify 原生集成 |
| **API 文档** | OpenAPI 3.1 (via @fastify/swagger) | latest | 自动生成、交互式 UI |
| **配置** | Zod + envalid | latest | 启动时校验、类型安全 |
| **鉴权** | Lucia Auth / Auth.js | latest | 团队版 SSO 友好 |
| **测试** | Vitest + Supertest | latest | 单元 + 集成 |

### 1.3 基础设施

| 类别 | 选型 |
|------|------|
| **容器** | Docker + Docker Compose |
| **编排** | Kubernetes (生产) / 单机 Docker Compose (MVP) |
| **CI/CD** | GitHub Actions |
| **托管** | Hetzner / DigitalOcean / Fly.io (MVP)；AWS / GCP (GA) |
| **CDN** | Cloudflare |
| **对象存储** | S3 / R2 (截图、日志归档) |
| **监控** | Sentry (前端 + 后端) + Grafana + Prometheus |
| **错误追踪** | Sentry |
| **特性开关** | Unleash / Flagsmith (可选) |
| **Secrets** | Doppler / 1Password CLI (开发)；K8s Secrets (生产) |

### 1.4 关键决策

| 决策 | 结论 | 理由 |
|------|------|------|
| 框架 vs WebExtension 原生 | ✅ Plasmo | MV3 兼容、零配置、Parcel 打包快、React 集成简单 |
| 状态管理：Redux vs Zustand | ✅ Zustand | Redux 模板代码多；Zustand 1.2KB 即可覆盖 90% 场景 |
| Tailwind vs CSS-in-JS | ✅ Tailwind | Bundle 体积、运行时性能、IDE 提示 |
| 服务端框架：Express vs Fastify | ✅ Fastify | 性能、Schema 内置、TS 友好 |
| 任务队列：自研 vs BullMQ | ✅ BullMQ | 成熟、可观测、Cron 原生 |
| ORM：Prisma vs Drizzle | ✅ Drizzle | 运行时开销、Edge 兼容、SQL 透明度 |
| PostgreSQL JSONB vs 独立文档库 | ✅ JSONB | 简单场景够用；后期可拆 MongoDB |

---

## 2. 系统架构

### 2.1 整体架构图

```
+============================================================================+
|                            终端用户浏览器                                   |
+============================================================================+
|                                                                            |
|  +----------------+   +----------------+   +-------------------+          |
|  | Target Page A  |   | Target Page B  |   | Target Page N     |          |
|  | (Content Script|<->| (Content Script|<->| (Content Script)  |          |
|  |  + 浮层)       |   |  + 浮层)       |   |  + 浮层)          |          |
|  +-------+--------+   +-------+--------+   +---------+---------+          |
|          |                    |                      |                    |
|          +--------------------+----------------------+                    |
|                               | chrome.runtime messaging                 |
|                               v                                          |
|  +-----------------------------------------------------------------+     |
|  |             Background Service Worker (Plasmo + React)            |     |
|  |  +---------------+ +---------------+ +-------------------+         |     |
|  |  | 脚本注册表    | | 健康检查调度器| | 通知分发中心      |         |     |
|  |  +---------------+ +---------------+ +-------------------+         |     |
|  +-----+-------------+---------------+-----------------+------------+     |
|        |                             |                 |                  |
|        v                             v                 v                  |
|  +-----------+                +------------+    +-------------+          |
|  | chrome.   |                | chrome.    |    | chrome.     |          |
|  | storage.  |                | storage.   |    | indexedDB  |          |
|  | local     |                | session    |    | (via Dexie)|          |
|  +-----------+                +------------+    +-------------+          |
|                                                                            |
|  +-------------------+  +-------------------+  +-------------------+      |
|  | Popup (轻量总览)  |  | Options (完整后台)|  | Editor (代码编辑) |      |
|  |                   |  |                   |  |                   |      |
|  +-------------------+  +-------------------+  +-------------------+      |
|                                                                            |
+========================= 浏览器边界 =======================================+
                                  |
                                  | HTTPS / WebSocket
                                  v
+============================================================================+
|                          ScriptGuard 云端服务                               |
+============================================================================+
|                                                                            |
|  +----------------+  +----------------+  +----------------+               |
|  | API Gateway    |  | Auth Service   |  | Webhook        |               |
|  | (Fastify)      |  | (Lucia)        |  | Receiver       |               |
|  +-------+--------+  +----------------+  +----------------+               |
|          |                                                                 |
|          v                                                                 |
|  +----------------+  +----------------+  +----------------+               |
|  | Script Service |  | Test Service   |  | Notify Service |               |
|  | (CRUD)         |  | (Cron + Run)   |  | (Multi-channel)|               |
|  +-------+--------+  +-------+--------+  +-------+--------+               |
|          |                   |                     |                      |
|          v                   v                     v                      |
|  +----------------+  +----------------+  +----------------+               |
|  | PostgreSQL     |  | BullMQ (Redis) |  | 通知 Worker    |               |
|  | (主数据)       |  | (任务队列)     |  | Pool           |               |
|  +----------------+  +-------+--------+  +----------------+               |
|                              |                                             |
|                              v                                             |
|                       +----------------+                                    |
|                       | Runner Pool    |                                    |
|                       | (Playwright)   |                                    |
|                       | 容器化浏览器   |                                    |
|                       +----------------+                                    |
|                                                                            |
+============================================================================+
|                          第三方依赖                                         |
+============================================================================+
|  GitHub Actions (用户自带) | 邮件 SMTP | 飞书/钉钉/Slack Webhook         |
+============================================================================+
```

### 2.2 部署拓扑

#### 2.2.1 MVP 阶段（单机 Docker Compose）

```
+-----------------------------+
|  单台 VPS (4C8G)            |
|  +-----------+              |
|  | Nginx     | :80/443      |
|  | (反代+SSL)|              |
|  +-----+-----+              |
|        |                    |
|  +-----v-----+   +-------+  |
|  | Fastify   |   | Redis |  |
|  | API :3000 |---| :6379 |  |
|  +-----+-----+   +-------+  |
|        |                    |
|  +-----v-----+   +-------+  |
|  |PostgreSQL |   |Runner |  |
|  |   :5432   |   |Play.  |  |
|  +-----------+   +-------+  |
+-----------------------------+
```

#### 2.2.2 GA 阶段（K8s）

- **API 层**：3 副本 Fastify (HPA 自动扩缩)
- **Worker 层**：BullMQ Worker (动态扩缩)
- **Runner 层**：Deployment (受限扩缩，按队列深度)
- **数据层**：PostgreSQL (主从) + Redis (Sentinel) + S3 (归档)
- **Ingress**：Cloudflare → Nginx Ingress

### 2.3 数据流向

#### 2.3.1 页面内检测流

```
Target Page 加载
  → Content Script 启动
    → chrome.runtime.sendMessage({type: 'GET_SCRIPTS', url})
      → Background SW 查询匹配脚本
        → 返回 scripts[] + rules[]
          → Content Script 注入并执行
            → 执行 CheckRule
              → 上报结果 {status, failedRules, error}
                → Background SW 记录日志（IndexedDB）
                  → 若失败 → 通知中心 → 通知策略引擎
                    → 触发浮层 + 桌面通知
```

#### 2.3.2 云端定时测试流

```
Cron Trigger (BullMQ repeatable)
  → 调度器查询到期的 TestSchedule
    → 加入 test-runs 队列
      → Runner Worker 消费
        → 启动 Playwright (headless)
          → newPage() + setCookies()
            → page.goto(url) + waitUntil('networkidle')
              → 注入 Userscript (content_scripts API)
                → 执行 SDK.check() 序列
                  → 收集结果 + 截图 + DOM 快照
                    → 上报 TestRun
                      → 持久化到 PostgreSQL
                        → 若失败 → Notify Worker → 多通道推送
```

---

## 3. 模块详细设计

### 3.1 浏览器插件模块

#### 3.1.1 Background Service Worker

**职责**：
- 脚本注册表管理（内存缓存 + chrome.storage 持久化）
- Content Script 消息路由
- 健康检查调度（`chrome.alarms`）
- 通知策略执行
- 与云端同步

**关键设计**：

```typescript
// background/index.ts
import { scriptsStore } from '~/store/scripts'
import { scheduler } from '~/modules/scheduler'
import { notifier } from '~/modules/notifier'

chrome.runtime.onInstalled.addListener(async () => {
  await scriptsStore.init()
  await scheduler.init()
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  return router.handle(msg, sender).then(sendResponse)
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('check:')) {
    const scriptId = alarm.name.slice(6)
    await scheduler.runLocalCheck(scriptId)
  }
})
```

**生命周期管理**：
- SW 会被 Chrome 休眠（30s 无活动）
- 关键状态必须 **写入 chrome.storage**，不能只在内存
- 长时间任务用 `chrome.alarms` 唤醒，不要用 `setTimeout`

#### 3.1.2 Content Script

**职责**：
- 注入用户脚本（隔离 world）
- 执行健康检查规则
- 显示浮层提示
- 捕获页面错误

**世界隔离策略**：
```typescript
// manifest.json (Plasmo)
{
  "world": "ISOLATED",  // 默认，不污染页面
  "runAt": "document_start"
}
```

**性能要求**：
- Content Script 自身 < 30KB（gzipped）
- 注入延迟 < 300ms
- 健康检查单脚本 < 2s

#### 3.1.3 Popup 页面

**职责**：当前页面的轻量状态总览

**设计约束**：
- 窗口尺寸：380×500px（Chrome 限制最大 800×600）
- 必须 < 500ms 渲染完成
- 离线可用（不依赖网络）

#### 3.1.4 Options 页面（完整后台）

**技术栈**：React Router v6 + Code Splitting

**路由结构**：

```
/                  → 总览 Dashboard
/scripts           → 脚本列表
/scripts/new       → 新建脚本
/scripts/:id       → 脚本详情
/scripts/:id/edit  → 脚本编辑器
/scripts/:id/rules → 健康检查规则
/scripts/:id/versions → 版本历史
/tests             → 测试任务列表
/tests/:id         → 测试报告
/alerts            → 告警中心
/logs              → 运行日志
/settings          → 设置
  ├── /general     → 通用
  ├── /notifications → 通知渠道
  ├── /integrations → Tampermonkey / GitHub / Greasy Fork
  └── /account     → 账号（云端登录后）
```

### 3.2 核心引擎模块

#### 3.2.1 健康检查规则引擎

**架构**：

```
RuleEngine
  ├── executor/
  │   ├── SelectorExistsExecutor
  │   ├── SelectorVisibleExecutor
  │   ├── SelectorTextExecutor
  │   ├── SelectorClickableExecutor
  │   ├── UrlMatchExecutor
  │   ├── NetworkStatusExecutor
  │   ├── JsAssertionExecutor
  │   ├── ConsoleCleanExecutor
  │   └── DurationExecutor
  ├── combinator/   (AND/OR 逻辑)
  └── reporter/     (结果汇总)
```

**执行器接口**：

```typescript
interface RuleExecutor<T extends CheckRule> {
  type: T['type']
  execute(rule: T, ctx: ExecutionContext): Promise<RuleResult>
}

interface ExecutionContext {
  url: string
  document: Document
  window: Window
  // 注：Content Script 中 window 不是真实的 page window
  // 通过 cloneInto/cloneFrom 通信
  pageContext: PageContextProxy
  timeout: number
  signal: AbortSignal
  capturedErrors: ErrorCapture[]
  capturedRequests: NetworkRequest[]
}

interface RuleResult {
  ruleId: string
  status: 'passed' | 'failed' | 'skipped' | 'timeout'
  duration: number
  errorMessage?: string
  errorStack?: string
  // 调试用
  context?: Record<string, unknown>
}
```

**统一错误捕获**：

```typescript
// 在 Content Script 最早时机注入
const errorCapture = (window as any).__SG_ERROR_CAPTURE__ = {
  errors: [] as Error[],
  rejections: [] as PromiseRejectionEvent[],
}

window.addEventListener('error', (e) => {
  errorCapture.errors.push(e.error)
}, true)

window.addEventListener('unhandledrejection', (e) => {
  errorCapture.rejections.push(e.reason)
}, true)
```

#### 3.2.2 选择器生成器

**算法**（按优先级降级）：

```typescript
function generateStableSelector(el: HTMLElement): string {
  // 1. data-testid
  if (el.dataset.testid) return `[data-testid="${el.dataset.testid}"]`
  // 2. data-test
  if (el.dataset.test) return `[data-test="${el.dataset.test}"]`
  // 3. aria-label
  if (el.getAttribute('aria-label')) {
    return `[aria-label="${el.getAttribute('aria-label')}"]`
  }
  // 4. role + 唯一文本
  const role = el.getAttribute('role')
  const text = el.textContent?.trim().slice(0, 30)
  if (role && text && isUniqueText(el, text)) {
    return `[role="${role}"]:has-text("${text}")`
  }
  // 5. name (form 元素)
  if (el.getAttribute('name')) {
    return `${el.tagName.toLowerCase()}[name="${el.getAttribute('name')}"]`
  }
  // 6. id（去重检查）
  if (el.id && document.querySelectorAll(`#${el.id}`).length === 1) {
    return `#${el.id}`
  }
  // 7. class 组合（去重 + 稳定）
  const stableClass = pickStableClass(el)
  if (stableClass) return `${el.tagName.toLowerCase()}.${stableClass}`
  // 8. CSS 路径（兜底）
  return buildCssPath(el)
}
```

**避免**：
- 长 `nth-child` 链
- 哈希类名（如 CSS-in-JS 生成的 `css-1a2b3c`）
- 自闭合上下文依赖的 XPath

#### 3.2.3 巡检引擎（云端）

**Runner 设计**：

```typescript
// runner/worker.ts
import { chromium, Browser, Page } from 'playwright'
import { Redis } from 'ioredis'
import { Job } from 'bullmq'

class TestRunner {
  private browser: Browser

  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
  }

  async runJob(job: Job<TestJobData>) {
    const { scriptId, url, cookies, rules, timeout } = job.data
    const context = await this.browser.newContext({
      userAgent: randomUA(),
      viewport: { width: 1280, height: 800 },
    })
    if (cookies) await context.addCookies(cookies)

    const page = await context.newPage()
    const startedAt = Date.now()

    try {
      // 注入错误捕获
      await page.addInitScript({ content: ERROR_CAPTURE_SCRIPT })

      // 打开页面
      await page.goto(url, { waitUntil: 'networkidle', timeout })

      // 注入 Userscript
      await page.addScriptTag({ content: scriptCode })

      // 等待脚本执行
      await page.waitForFunction(
        () => (window as any).__SG_REPORT__ !== undefined,
        { timeout }
      )

      // 收集结果
      const report = await page.evaluate(() => (window as any).__SG_REPORT__)

      // 截图
      const screenshot = await page.screenshot({ fullPage: true })

      return { ...report, screenshot, duration: Date.now() - startedAt }
    } catch (e) {
      // 上报失败
      return { status: 'failed', error: serializeError(e), duration: Date.now() - startedAt }
    } finally {
      await context.close()  // 必须关闭，释放资源
    }
  }
}
```

**资源控制**：
- 单 Runner 同时最多 3 个 context
- 每个 context 30s 超时强制销毁
- 每完成一次必须 `context.close()`
- 内存监控：超过 80% 触发自动重启

#### 3.2.4 通知服务

**多通道适配器**：

```typescript
interface NotificationChannel {
  type: ChannelType
  send(payload: NotificationPayload): Promise<SendResult>
}

class BrowserNotificationChannel implements NotificationChannel {
  async send(payload: NotificationPayload) {
    const id = await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: payload.title,
      message: payload.body,
      priority: 2,
    })
    return { success: !!id, id }
  }
}

class WebhookChannel implements NotificationChannel {
  constructor(private config: { url: string; template: 'feishu' | 'dingtalk' | 'slack' | 'generic' }) {}
  async send(payload: NotificationPayload) {
    const body = this.renderTemplate(payload)
    const res = await ky.post(this.config.url, {
      json: body,
      timeout: 5000,
      retry: { limit: 2, methods: ['POST'] },
    })
    return { success: res.ok }
  }
}
```

**模板示例（飞书）**：

```json
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": { "tag": "plain_text", "content": "🚨 脚本失效通知" },
      "template": "red"
    },
    "elements": [
      { "tag": "div", "fields": [
        { "is_short": true, "text": { "tag": "lark_md", "content": "**脚本**\n订单页增强工具 v1.3.2" } },
        { "is_short": true, "text": { "tag": "lark_md", "content": "**时间**\n2026-06-17 12:00" } }
      ]},
      { "tag": "div", "text": { "tag": "lark_md", "content": "**失败原因**\n❌ 找不到选择器 [data-testid='submit']" } },
      { "tag": "action", "actions": [
        { "tag": "button", "text": { "tag": "plain_text", "content": "查看详情" }, "url": "https://scriptguard.dev/scripts/script_001" }
      ]}
    ]
  }
}
```

### 3.3 SDK 设计（GM_healthCheck）

**打包**：UMD + ESM 双格式，单文件 < 5KB gzipped

**API**：

```typescript
// sdk/src/index.ts
export class ScriptGuard {
  constructor(public scriptId: string, options?: { endpoint?: string })
  
  check(name: string, assertion: () => boolean | Promise<boolean>, opts?: { timeout?: number; required?: boolean }): void
  
  report(): Promise<ReportResult>
  
  trackError(error: Error, context?: Record<string, any>): void
  
  // 内部
  private checks: CheckEntry[] = []
  private errors: CapturedError[] = []
  private startTime: number
}

// 兼容 GM_ 风格
export const SG = ScriptGuard
declare global { interface Window { SG: typeof ScriptGuard } }
```

**使用**：

```javascript
// ==UserScript==
// @name         My Script
// @require      https://scriptguard.dev/sdk/v1/sdk.js
// @grant        GM_setValue
// ==/UserScript==

const sg = new SG('my-script-v1')
sg.check('登录态', () => !!window.userInfo?.id)
sg.check('提交按钮', () => !!document.querySelector('[data-testid="submit"]'))

// 脚本主逻辑
document.querySelector('[data-testid="submit"]')?.addEventListener('click', () => {
  // ...
})

sg.report()  // 必须在脚本结束前调用
```

**上报协议**（postMessage 到 Content Script）：

```typescript
window.postMessage({
  source: 'scriptguard-sdk',
  scriptId: 'my-script-v1',
  checks: [{ name: '登录态', passed: true, duration: 5 }],
  errors: [],
  duration: 123
}, '*')
```

---

## 4. 数据模型与存储

### 4.1 客户端存储

#### 4.1.1 chrome.storage.local（结构化配置）

| Key | 内容 | 大小限制 |
|---|---|---|
| `scripts` | `Script[]`（脚本元数据） | < 8MB（浏览器总配额） |
| `rules` | `CheckRule[]` | 同上 |
| `schedules` | `LocalSchedule[]` | 同上 |
| `channels` | `NotifyChannel[]` | 同上 |
| `preferences` | `UserPreferences` | 同上 |
| `syncMeta` | `{ lastSyncAt, lastSyncVersion, cloudId }` | < 1KB |
| `authToken` | 云端登录 token | < 1KB |

**Schema 版本管理**：

```typescript
// store/scripts.ts
import { z } from 'zod'

const ScriptV1 = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  // ...
})

const ScriptV2 = ScriptV1.extend({
  alertLevel: z.enum(['low', 'medium', 'high', 'critical']),
})

const ScriptCurrent = ScriptV2

// 迁移链
const migrations = {
  1: (data: any) => ScriptV1.parse(data),
  2: (data: any) => ScriptV2.parse(ScriptV1.parse(data)),
  // ...
}
```

#### 4.1.2 IndexedDB（via Dexie）

```typescript
// store/db.ts
import Dexie, { Table } from 'dexie'

interface CheckRecord {
  id?: number
  scriptId: string
  timestamp: Date
  status: HealthStatus
  url: string
  duration: number
  failedRules: string[]
  errorMessage?: string
  domSnapshot?: string
  screenshot?: Blob
}

interface DomSnapshot {
  id?: number
  scriptId: string
  url: string
  html: string
  timestamp: Date
  reason: 'failure' | 'manual'
}

class ScriptGuardDB extends Dexie {
  checks!: Table<CheckRecord, number>
  snapshots!: Table<DomSnapshot, number>
  alerts!: Table<AlertRecord, number>

  constructor() {
    super('ScriptGuardDB')
    this.version(1).stores({
      checks: '++id, scriptId, timestamp, status',
      snapshots: '++id, scriptId, url, timestamp',
      alerts: '++id, scriptId, timestamp, acknowledged',
    })
  }
}

export const db = new ScriptGuardDB()
```

**清理策略**：

```typescript
// 后台定期清理（每天 03:00）
async function cleanupOldRecords() {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  await db.checks.where('timestamp').below(thirtyDaysAgo).delete()
  await db.snapshots.where('timestamp').below(thirtyDaysAgo).delete()
}
```

#### 4.1.3 chrome.storage.session

用于临时数据：
- 当前页面检测状态
- Content Script ↔ Background 通信的临时 token
- 跨标签页共享的检测中状态

### 4.2 服务端数据库

#### 4.2.1 ER 关系图

```
+----------------+       +----------------+       +----------------+
|    users       |       |    teams       |       |   team_members |
+----------------+       +----------------+       +----------------+
| id (PK)        |<----->| id (PK)        |<----->| user_id (FK)   |
| email          |       | name           |       | team_id (FK)   |
| password_hash  |       | plan           |       | role           |
| plan           |       | created_at     |       +----------------+
| created_at     |       +----------------+
+----------------+              |
        |                       v
        |              +----------------+
        |              |    scripts    |
        |              +----------------+
        +------------->| id (PK)       |
        |              | user_id (FK)  |
        |              | team_id (FK)  |
        |              | name          |
        |              | version       |
        |              | code          |
        |              | match_rules   |
        |              | run_at        |
        |              | enabled       |
        |              | config (JSONB)|
        |              | created_at    |
        |              | updated_at    |
        |              +----------------+
        |                       |
        |                       v
        |              +----------------+       +----------------+
        |              | check_rules    |       | script_versions|
        |              +----------------+       +----------------+
        +------------->| id (PK)       |       | id (PK)       |
        |              | script_id (FK)|<----->| script_id (FK)|
        |              | type          |       | version       |
        |              | config (JSONB)|       | code          |
        |              | required      |       | changelog     |
        |              | alert_level   |       | created_at    |
        |              +----------------+       +----------------+
        |
        |              +----------------+
        |              |  test_schedules|
        |              +----------------+
        +------------->| id (PK)       |
        |              | script_id (FK)|
        |              | cron          |
        |              | mode          |
        |              | config (JSONB)|
        |              | enabled       |
        |              +----------------+
        |                       |
        |                       v
        |              +----------------+
        |              |   test_runs    |
        |              +----------------+
        +------------->| id (PK)       |
        |              | schedule_id   |
        |              | script_id (FK)|
        |              | status        |
        |              | started_at    |
        |              | ended_at      |
        |              | duration_ms   |
        |              | result (JSONB)|
        |              | screenshot_url|
        |              +----------------+
        |
        |              +----------------+
        |              |    alerts      |
        |              +----------------+
        +------------->| id (PK)       |
        |              | script_id (FK)|
        |              | run_id (FK)   |
        |              | level         |
        |              | message       |
        |              | acknowledged  |
        |              | created_at    |
        |              +----------------+
        |
        |              +----------------+
        |              | notify_channels|
        |              +----------------+
        +------------->| id (PK)       |
                       | user_id (FK)  |
                       | type          |
                       | config (JSONB)|
                       | enabled       |
                       +----------------+
```

#### 4.2.2 Drizzle Schema

```typescript
// server/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan', ['free', 'pro', 'team', 'enterprise'])
export const healthStatusEnum = pgEnum('health_status', ['healthy', 'degraded', 'failed', 'unknown'])
export const runAtEnum = pgEnum('run_at', ['document_start', 'document_idle', 'document_end', 'manual'])
export const alertLevelEnum = pgEnum('alert_level', ['low', 'medium', 'high', 'critical'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  plan: planEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: planEnum('plan').notNull().default('team'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const scripts = pgTable('scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull().default('1.0.0'),
  code: text('code').notNull(),
  matchRules: jsonb('match_rules').$type<string[]>().notNull().default([]),
  runAt: runAtEnum('run_at').notNull().default('document_idle'),
  enabled: boolean('enabled').notNull().default(true),
  config: jsonb('config').$type<ScriptConfig>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const checkRules = pgTable('check_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  scriptId: uuid('script_id').references(() => scripts.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),  // 见 CheckRule['type']
  config: jsonb('config').$type<Record<string, any>>().notNull().default({}),
  required: boolean('required').notNull().default(true),
  timeout: integer('timeout').notNull().default(3000),
  alertLevel: alertLevelEnum('alert_level').notNull().default('medium'),
  order: integer('order').notNull().default(0),
})

export const testSchedules = pgTable('test_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  scriptId: uuid('script_id').references(() => scripts.id, { onDelete: 'cascade' }).notNull(),
  cron: text('cron').notNull(),  // e.g. "0 9 * * *"
  mode: text('mode').notNull(),   // 'cloud' | 'github_actions'
  config: jsonb('config').$type<{ cookies?: string; timeout?: number }>().notNull().default({}),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const testRuns = pgTable('test_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id').references(() => testSchedules.id, { onDelete: 'set null' }),
  scriptId: uuid('script_id').references(() => scripts.id, { onDelete: 'cascade' }).notNull(),
  status: healthStatusEnum('status').notNull(),
  url: text('url').notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  durationMs: integer('duration_ms'),
  result: jsonb('result').$type<TestRunResult>().notNull(),
  screenshotUrl: text('screenshot_url'),
  domSnapshotUrl: text('dom_snapshot_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  scriptId: uuid('script_id').references(() => scripts.id, { onDelete: 'cascade' }).notNull(),
  runId: uuid('run_id').references(() => testRuns.id, { onDelete: 'set null' }),
  level: alertLevelEnum('level').notNull(),
  message: text('message').notNull(),
  payload: jsonb('payload').$type<Record<string, any>>().notNull().default({}),
  acknowledged: boolean('acknowledged').notNull().default(false),
  acknowledgedAt: timestamp('acknowledged_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const notifyChannels = pgTable('notify_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  config: jsonb('config').$type<Record<string, any>>().notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const scriptVersions = pgTable('script_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  scriptId: uuid('script_id').references(() => scripts.id, { onDelete: 'cascade' }).notNull(),
  version: text('version').notNull(),
  code: text('code').notNull(),
  changelog: text('changelog'),
  isStable: boolean('is_stable').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

#### 4.2.3 关键索引

```sql
-- 性能关键查询
CREATE INDEX idx_test_runs_script_created ON test_runs(script_id, created_at DESC);
CREATE INDEX idx_test_runs_status ON test_runs(status) WHERE status IN ('failed', 'degraded');
CREATE INDEX idx_alerts_user_unack ON alerts(user_id, created_at DESC) WHERE acknowledged = false;
CREATE INDEX idx_scripts_user_enabled ON scripts(user_id) WHERE enabled = true;

-- 团队查询
CREATE INDEX idx_scripts_team ON scripts(team_id) WHERE team_id IS NOT NULL;

-- 全文搜索（可选）
CREATE INDEX idx_scripts_name_trgm ON scripts USING gin(name gin_trgm_ops);
```

#### 4.2.4 数据保留与归档

| 表 | 热数据保留 | 冷数据归档 |
|---|---|---|
| `test_runs` | 90 天 | 90 天后归档到 S3 |
| `alerts` | 1 年 | 已确认 30 天后可清理 |
| `check_rules`, `scripts`, `notify_channels` | 永久 | - |
| `script_versions` | 永久 | - |

**归档脚本**（每月执行）：

```typescript
// jobs/archive.ts
export const archiveJob = cron.schedule('0 3 1 * *', async () => {
  const cutoff = subDays(new Date(), 90)
  
  // 1. 导出到 S3
  const oldRuns = await db.select().from(testRuns).where(lt(testRuns.createdAt, cutoff))
  const jsonl = oldRuns.map(r => JSON.stringify(r)).join('\n')
  await s3.putObject({
    Bucket: 'scriptguard-archives',
    Key: `test-runs/${cutoff.toISOString().slice(0, 7)}.jsonl`,
    Body: jsonl,
  })
  
  // 2. 删除原数据
  await db.delete(testRuns).where(lt(testRuns.createdAt, cutoff))
})
```

### 4.3 数据同步策略

**冲突解决**：
- 客户端为单一真实源（offline-first）
- 云端同步时使用 **last-write-wins** 策略
- 冲突时弹窗让用户选择（保留本地/保留云端/合并）

**同步协议**：

```typescript
// sync/protocol.ts
interface SyncRequest {
  clientVersion: number  // 用于服务端检测 schema 升级
  lastSyncAt: number     // 时间戳
  changes: {
    scripts: Script[]    // 仅推送变更
    rules: CheckRule[]
    deletedScriptIds: string[]
  }
}

interface SyncResponse {
  serverVersion: number
  syncedAt: number
  changes: {
    scripts: Script[]
    rules: CheckRule[]
    deletedScriptIds: string[]
  }
  conflicts: Array<{
    entity: 'script' | 'rule'
    id: string
    local: any
    server: any
  }>
}
```

---

## 5. API 设计

### 5.1 内部 API（Background ↔ Content Script）

通过 `chrome.runtime.sendMessage` 通信，类型化封装：

```typescript
// shared/messaging.ts
export type Message =
  | { type: 'GET_SCRIPTS_FOR_URL'; url: string; tabId: number }
  | { type: 'SCRIPTS_RESULT'; scripts: PublicScript[] }
  | { type: 'REPORT_CHECK'; scriptId: string; record: CheckReport }
  | { type: 'SHOW_OVERLAY'; payload: OverlayPayload }
  | { type: 'HIDE_OVERLAY' }
  | { type: 'CAPTURE_SELECTOR'; selector: string; element: string }
  | { type: 'SDK_REPORT'; payload: SdkReport }

export interface PublicScript {
  id: string
  name: string
  version: string
  runAt: RunAt
  code: string
  rules: PublicCheckRule[]  // 不含敏感配置
}
```

**调用示例**：

```typescript
// Content Script
async function bootstrap() {
  const url = location.href
  const response = await chrome.runtime.sendMessage<Message, Message>({
    type: 'GET_SCRIPTS_FOR_URL',
    url,
    tabId: 0,  // 由 SW 补全
  })
  
  if (response.type === 'SCRIPTS_RESULT') {
    for (const script of response.scripts) {
      await injectAndRun(script)
    }
  }
}
```

### 5.2 外部 REST API（云端服务）

**基础约定**：
- Base URL: `https://api.scriptguard.dev/v1`
- 认证：`Authorization: Bearer <token>`
- 响应格式：JSON
- 时间格式：ISO 8601
- 错误格式：`{ error: { code, message, details? } }`

#### 5.2.1 脚本管理

| Method | Path | 描述 |
|--------|------|------|
| `GET` | `/scripts` | 获取脚本列表（支持 `?teamId=`） |
| `GET` | `/scripts/:id` | 获取脚本详情 |
| `POST` | `/scripts` | 创建脚本 |
| `PUT` | `/scripts/:id` | 更新脚本 |
| `DELETE` | `/scripts/:id` | 删除脚本 |
| `GET` | `/scripts/:id/versions` | 获取版本历史 |
| `POST` | `/scripts/:id/versions` | 创建新版本 |
| `POST` | `/scripts/:id/rollback/:versionId` | 回滚到指定版本 |

**POST /scripts** 请求体：

```json
{
  "name": "订单页增强工具",
  "description": "...",
  "version": "1.3.2",
  "code": "...",
  "matchRules": ["https://example.com/orders/*"],
  "runAt": "document_idle",
  "enabled": true,
  "config": { "alertLevel": "high" }
}
```

#### 5.2.2 健康检查规则

| Method | Path | 描述 |
|--------|------|------|
| `GET` | `/scripts/:id/rules` | 获取规则列表 |
| `POST` | `/scripts/:id/rules` | 创建规则 |
| `PUT` | `/rules/:id` | 更新规则 |
| `DELETE` | `/rules/:id` | 删除规则 |
| `POST` | `/rules/reorder` | 调整顺序 |

#### 5.2.3 测试任务

| Method | Path | 描述 |
|--------|------|------|
| `GET` | `/schedules` | 获取所有定时任务 |
| `POST` | `/schedules` | 创建定时任务 |
| `PUT` | `/schedules/:id` | 更新 |
| `DELETE` | `/schedules/:id` | 删除 |
| `POST` | `/scripts/:id/run-now` | 立即执行一次测试 |
| `GET` | `/scripts/:id/runs` | 获取运行历史（`?limit=50&status=failed`） |
| `GET` | `/runs/:id` | 获取单次运行详情 |

#### 5.2.4 告警与通知

| Method | Path | 描述 |
|--------|------|------|
| `GET` | `/alerts` | 获取告警列表（`?acknowledged=false`） |
| `POST` | `/alerts/:id/ack` | 确认告警 |
| `GET` | `/channels` | 获取通知渠道 |
| `POST` | `/channels` | 添加渠道 |
| `POST` | `/channels/:id/test` | 发送测试消息 |

#### 5.2.5 Webhook 接收（GitHub Actions 回传）

| Method | Path | 描述 |
|--------|------|------|
| `POST` | `/webhook/gh-actions/:token` | 接收 GH Actions 测试结果 |

请求体：

```json
{
  "scriptId": "uuid",
  "status": "failed",
  "url": "https://example.com",
  "duration": 1234,
  "failedRules": ["rule_id_1"],
  "screenshot": "base64...",
  "domSnapshot": "...",
  "errorMessage": "..."
}
```

### 5.3 Webhook 协议（ScriptGuard → 第三方）

#### 5.3.1 通用格式

```json
{
  "event": "script.failed" | "script.recovered" | "script.degraded",
  "timestamp": "2026-06-17T04:00:00.000Z",
  "script": {
    "id": "uuid",
    "name": "订单页增强工具",
    "version": "1.3.2"
  },
  "url": "https://example.com/orders",
  "status": "failed",
  "level": "high",
  "message": "找不到选择器 [data-testid='submit']",
  "failedRules": [
    { "id": "rule_001", "name": "提交按钮存在", "type": "selector_exists" }
  ],
  "links": {
    "detail": "https://scriptguard.dev/scripts/.../runs/...",
    "screenshot": "https://scriptguard.dev/cdn/.../screenshot.png"
  }
}
```

#### 5.3.2 飞书模板

见 §3.2.4。

#### 5.3.3 钉钉模板

```json
{
  "msgtype": "markdown",
  "title": "🚨 脚本失效通知",
  "markdown": {
    "title": "🚨 脚本失效通知",
    "text": "### 📦 订单页增强工具 v1.3.2\n\n**状态**: ❌ 失败\n**URL**: https://example.com/orders\n**原因**: 找不到选择器 `[data-testid='submit']`\n\n[查看详情](https://scriptguard.dev/...)"
  },
  "at": {
    "atMobiles": ["13800138000"],
    "isAtAll": false
  }
}
```

#### 5.3.4 Slack 模板

```json
{
  "blocks": [
    { "type": "header", "text": { "type": "plain_text", "text": "🚨 脚本失效通知" } },
    { "type": "section", "fields": [
      { "type": "mrkdwn", "text": "*脚本:*\n订单页增强工具 v1.3.2" },
      { "type": "mrkdwn", "text": "*状态:*\n❌ Failed" }
    ]},
    { "type": "section", "text": { "type": "mrkdwn", "text": "*失败原因:*\n找不到选择器 `[data-testid='submit']`" } },
    { "type": "actions", "elements": [
      { "type": "button", "text": { "type": "plain_text", "text": "查看详情" }, "url": "https://scriptguard.dev/..." }
    ]}
  ]
}
```

### 5.4 OpenAPI 文档

通过 `@fastify/swagger` + `@fastify/swagger-ui` 自动生成：

- 路径：`/docs` (Swagger UI)
- 路径：`/openapi.json`
- 启用 CI 检查：所有 PR 必须保证 spec 与实现一致

---

## 6. 状态管理

### 6.1 客户端 Store 结构

```typescript
// store/ - Zustand stores
export const useScriptsStore = create<ScriptsStore>()(
  persist(
    (set, get) => ({
      scripts: [],
      rules: new Map(),
      // ...actions
    }),
    { name: 'sg-scripts', storage: createJSONStorage(() => chrome.storage.local) }
  )
)
```

| Store | 职责 | 持久化 |
|---|---|---|
| `useScriptsStore` | 脚本元数据 + 规则 | chrome.storage.local |
| `useSchedulesStore` | 定时任务 | chrome.storage.local |
| `useChannelsStore` | 通知渠道 | chrome.storage.local |
| `useAuthStore` | 云端登录态 | chrome.storage.local |
| `useUIStore` | UI 临时态（弹窗、Tab） | sessionStorage |
| `useLogsStore` | 当前运行日志（IndexedDB） | IndexedDB |
| `useAlertsStore` | 告警列表 | chrome.storage.session |

### 6.2 Content Script 状态

Content Script 每次注入是 **冷启动**，状态不持久化。需要在 Background 维护：

```typescript
// background/registry.ts
class TabRegistry {
  private tabs = new Map<number, TabState>()  // tabId → 状态

  setTabState(tabId: number, state: TabState) {
    this.tabs.set(tabId, { ...state, updatedAt: Date.now() })
  }
  
  getTabState(tabId: number): TabState | undefined {
    return this.tabs.get(tabId)
  }
  
  cleanup(tabId: number) {
    this.tabs.delete(tabId)
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  tabRegistry.cleanup(tabId)
})
```

### 6.3 跨 Store 同步

使用 `subscribeWithSelector` 中间件：

```typescript
// 规则变更 → 自动重新调度 alarm
useScriptsStore.subscribe(
  (state) => state.scripts,
  (scripts) => scheduler.rebuildAlarms(scripts)
)
```

---

## 7. 安全设计

### 7.1 内容安全策略（CSP）

`manifest.json` (Plasmo)：

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';",
    "content_scripts": {
      "script-src": "'self' 'unsafe-eval'",  // 谨慎开启
      "unsafe-eval": false  // 默认 false
    }
  }
}
```

### 7.2 用户脚本沙箱

**关键风险**：用户脚本可能包含恶意代码。

**缓解**：

1. **本地运行**：
   - 脚本在 Content Script 的 `MAIN` world（用户授权后）
   - 不访问插件内部 `chrome.runtime` API
   - 不读取插件其他 tab 的 storage

2. **云端运行**：
   - 独立 Runner 容器，无网络限制（用户授权域）
   - 用户脚本不持久化到 Runner 磁盘
   - 每次执行后清理

3. **执行前检查**（可选）：

```typescript
function lintScript(code: string): LintResult {
  const issues: LintIssue[] = []
  // 检测 eval/Function 构造器
  if (/eval\s*\(/.test(code)) issues.push({ level: 'warn', msg: '使用 eval' })
  // 检测 fetch 外部域
  const fetchUrls = [...code.matchAll(/fetch\(['"`]([^'"`]+)['"`]/g)].map(m => m[1])
  for (const url of fetchUrls) {
    if (!isAllowedDomain(url, allowedDomains)) {
      issues.push({ level: 'error', msg: `外部请求: ${url}` })
    }
  }
  return { issues, allowed: issues.filter(i => i.level === 'error').length === 0 }
}
```

### 7.3 凭据与 Token 存储

| 凭据 | 存储位置 | 加密 |
|---|---|---|
| 云端 JWT | `chrome.storage.local` (加密) | AES-GCM (key 来自用户 passphrase 或 device key) |
| Cookie（云端测试） | PostgreSQL | AES-256 (key 在 KMS) |
| 通知渠道 Webhook URL | PostgreSQL | 明文（设计为可分享）但写入审计 |
| 邮箱 | PostgreSQL | bcrypt hash |

**加密工具**：

```typescript
// utils/crypto.ts
import { subtle } from 'uncrypto'  // 兼容浏览器和 Node

const KEY = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])

export async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder().encode(data)
  const cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc)
  return base64url(iv) + '.' + base64url(new Uint8Array(cipher))
}
```

### 7.4 网络安全

- 强制 HTTPS（除 localhost 开发）
- CSP `default-src 'self'`
- 外部资源（Sentry、CDN）走白名单
- Webhook 接收端要求 HMAC 签名：

```typescript
// 服务端验证 GH Actions 回传
const signature = req.headers['x-scriptguard-signature']
const expected = hmac('sha256', body, process.env.WEBHOOK_SECRET)
if (!safeEqual(signature, expected)) {
  return reply.code(401).send({ error: 'Invalid signature' })
}
```

### 7.5 隐私脱敏

```typescript
// utils/redact.ts
const PII_PATTERNS = [
  /\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi,  // email
  /\b1[3-9]\d{9}\b/g,                       // 手机号
  /\bbearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi,    // JWT
  /\b(?:token|api[_-]?key|secret)[\s:="']+([\w-]{16,})/gi,
]

export function redact(text: string): string {
  return PII_PATTERNS.reduce((s, p) => s.replace(p, '[REDACTED]'), text)
}
```

### 7.6 权限最小化

```typescript
// manifest.json
{
  "permissions": [
    "storage",
    "alarms",
    "notifications",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"  // ❌ 避免，改用 optional_permissions
  ],
  "optional_permissions": [
    "scripting",
    "tabs"
  ],
  "optional_host_permissions": ["*://*/*"]
}
```

**用户首次配置某网站时再申请**：

```typescript
async function requestHostPermission(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.request({ origins: [url] }, (granted) => resolve(granted))
  })
}
```

---

## 8. 性能优化

### 8.1 Bundle 体积控制

**目标**：插件总 Bundle < 200KB（gzipped）

| 模块 | 目标大小 | 措施 |
|---|---|---|
| Background SW | < 50KB | 路由懒加载 |
| Content Script | < 30KB | 核心逻辑分包 |
| Popup | < 50KB | 路由级 code split |
| Options | < 200KB | 路由级 code split + 动态 import |
| SDK | < 5KB | UMD 单独打包 |

**分析工具**：

```bash
npx plasmo analyze  # 查看 bundle 组成
# 或
npx source-map-explorer build/chrome-mv3-prod/*.js
```

**优化手段**：
- Tree-shake（默认开启）
- 路由懒加载（React.lazy）
- 图标 sprite + inline SVG
- 字体子集化
- 重型库（Monaco）只在编辑页加载

### 8.2 启动性能

**Popup 启动**：

```
[0ms]    chrome.action.onClicked 触发
[0-50ms] chrome.runtime.connectBackground
[50-100ms] Background 返回当前 tab 的脚本状态
[100-300ms] React 渲染完成
[300-500ms] 首屏可交互
```

**Content Script 启动**：

```
[0ms]    document_start
[0-50ms] error_capture.js 注入（< 1KB）
[50-100ms] 等待 Background 返回脚本列表
[100-200ms] 注入用户脚本
[200ms+] 用户脚本执行
```

### 8.3 健康检查性能

- **并发控制**：同时最多 1 个 page 检查（避免影响用户浏览）
- **超时**：默认单 rule 3s，整体 10s
- **缓存**：相同 URL 5s 内不重复检查
- **节流**：用户操作期间（输入、滚动）暂停检查

### 8.4 服务端性能

- **冷启动**：Worker 池预热 2 个空闲 Runner
- **缓存**：热门脚本的配置用 Redis 缓存 5min
- **数据库**：连接池（HikariCP 等价物）20 连接
- **队列**：BullMQ 并发 5（Runner 数）
- **CDN**：截图、DOM 快照走 CDN

### 8.5 性能监控

```typescript
// utils/perf.ts
export function perf(label: string) {
  const start = performance.now()
  return () => {
    const duration = performance.now() - start
    if (duration > 100) {
      console.warn(`[PERF] ${label} took ${duration.toFixed(1)}ms`)
      // 上报到 Sentry
    }
  }
}
```

---

## 9. 错误处理策略

### 9.1 错误分类

| 类型 | 示例 | 处理 |
|---|---|---|
| **网络错误** | API 5xx、超时 | 重试（指数退避）+ 降级 |
| **业务错误** | 4xx、验证失败 | 提示用户 + 阻止操作 |
| **脚本错误** | 注入失败、执行异常 | 隔离捕获 + 上报日志 |
| **资源错误** | 内存不足、磁盘满 | 清理 + 降级 |
| **未知错误** | 其他 | 全局兜底 + Sentry |

### 9.2 重试策略

```typescript
// utils/retry.ts
import pRetry from 'p-retry'

export async function fetchWithRetry(url: string, opts: RequestInit = {}, maxRetries = 3) {
  return pRetry(
    async (attempt) => {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(10_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res
    },
    {
      retries: maxRetries,
      minTimeout: 1000,
      maxTimeout: 10_000,
      factor: 2,
      onFailedAttempt: (e) => {
        console.warn(`[retry] attempt ${e.attemptNumber}/${maxRetries} failed: ${e.message}`)
      },
    }
  )
}
```

### 9.3 错误边界

```typescript
// React Error Boundary
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <ErrorPanel error={error} onReset={resetErrorBoundary} />
  )}
  onError={(error, info) => {
    Sentry.captureException(error, { extra: info })
  }}
>
  <App />
</ErrorBoundary>
```

### 9.4 Content Script 错误隔离

```typescript
// 包装用户脚本执行
async function runUserScript(script: PublicScript) {
  try {
    const result = await Promise.race([
      runInPage(script.code),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), script.timeout || 10000)),
    ])
    return { status: 'success', result }
  } catch (e) {
    // 用户脚本出错不能影响插件自身
    return { status: 'error', error: serializeError(e) }
  }
}
```

### 9.5 服务端错误处理

```typescript
// server/error-handler.ts
import { ZodError } from 'zod'

fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors },
    })
  }
  
  if (error.statusCode && error.statusCode < 500) {
    return reply.code(error.statusCode).send({
      error: { code: error.code || 'CLIENT_ERROR', message: error.message },
    })
  }
  
  // 500 错误：记录但不暴露细节
  request.log.error({ err: error }, 'Unhandled error')
  Sentry.captureException(error)
  return reply.code(500).send({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  })
})
```

### 9.6 全局兜底

```typescript
// Background SW
self.addEventListener('unhandledrejection', (e) => {
  Sentry.captureException(e.reason)
  e.preventDefault()
})
```

---

## 10. 测试策略

### 10.1 测试金字塔

```
                  ┌────────────────┐
                  │   E2E 测试     │  ← Playwright (10%)
                  │   (关键流程)   │
                  └────────────────┘
              ┌────────────────────────┐
              │  集成测试              │  ← Vitest + Supertest (30%)
              │  (模块交互、API)       │
              └────────────────────────┘
        ┌────────────────────────────────────┐
        │  单元测试                            │  ← Vitest (60%)
        │  (纯函数、组件、工具)               │
        └────────────────────────────────────┘
```

### 10.2 单元测试

**目标覆盖率**：核心模块 ≥ 80%

```typescript
// rules/SelectorExistsExecutor.test.ts
import { describe, it, expect } from 'vitest'
import { SelectorExistsExecutor } from './SelectorExistsExecutor'

describe('SelectorExistsExecutor', () => {
  const executor = new SelectorExistsExecutor()
  
  it('should pass when element exists', async () => {
    const ctx = mockContext({
      document: mockDoc(`<button data-testid="x">OK</button>`),
    })
    const result = await executor.execute(
      { type: 'selector_exists', selector: '[data-testid="x"]' },
      ctx
    )
    expect(result.status).toBe('passed')
  })
  
  it('should fail when element missing', async () => {
    const ctx = mockContext({ document: mockDoc('') })
    const result = await executor.execute(
      { type: 'selector_exists', selector: '[data-testid="x"]' },
      ctx
    )
    expect(result.status).toBe('failed')
  })
  
  it('should timeout when too slow', async () => {
    // ...
  })
})
```

### 10.3 集成测试

```typescript
// server/scripts.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { build } from '../src/app'
import { db } from '../src/db'

describe('POST /scripts', () => {
  let app: Awaited<ReturnType<typeof build>>
  
  beforeAll(async () => {
    app = await build()
    await db.migrate.latest()
  })
  
  it('creates a script with valid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/scripts',
      payload: { name: 'Test', code: '//', matchRules: ['*://example.com/*'] },
      headers: { authorization: `Bearer ${testToken}` },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('Test')
  })
  
  it('rejects invalid payload', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/scripts', payload: {} })
    expect(res.statusCode).toBe(400)
  })
})
```

### 10.4 E2E 测试（Playwright）

**关键流程**：
- 安装插件 → 创建脚本 → 配置规则 → 访问目标页 → 检查健康 → 触发告警
- 完整本地检测 → 报告生成
- 定时任务 → 云端执行 → 报告回传

```typescript
// e2e/plugin.spec.ts
import { test, expect, chromium } from '@playwright/test'
import path from 'path'

test('完整流程：创建脚本 → 健康检查 → 告警', async () => {
  // 加载扩展
  const userDataDir = '/tmp/test-profile'
  const extensionPath = path.resolve('build/chrome-mv3-prod')
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  })
  
  // 打开扩展 popup
  const page = await context.newPage()
  await page.goto('chrome-extension://<id>/options.html')
  
  // 创建脚本
  await page.click('[data-testid="new-script"]')
  // ...
  
  // 访问目标测试页
  await page.goto('https://example.com/test-page')
  
  // 断言浮层
  await expect(page.locator('[data-testid="sg-overlay"]')).toBeVisible()
})
```

### 10.5 兼容性测试

- Chrome 120+、Edge 120+、Firefox 115+
- Manifest V3 各版本差异
- 头部/无头模式
- 隐身模式
- 多标签页并发

### 10.6 性能基准

```typescript
// perf.bench.ts
import { bench, describe } from 'vitest'

describe('健康检查性能', () => {
  bench('SelectorExists 1000次', async () => {
    // ...
  }, { time: 5000 })
})
```

### 10.7 持续集成（CI）

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:unit --coverage
      - run: pnpm test:integration
      - run: pnpm test:e2e
      - run: pnpm build
      - uses: codecov/codecov-action@v3
```

---

## 11. 部署与 CI/CD

### 11.1 仓库结构

```
scriptguard/
├── apps/
│   ├── extension/          # Plasmo 浏览器插件
│   ├── server/             # Fastify 云端服务
│   ├── runner/             # Playwright Runner 镜像
│   ├── docs/               # 文档站 (Fumadocs / Next.js)
│   └── marketing/          # 营销官网 (Next.js + Tailwind)
├── packages/
│   ├── shared/             # 共享 TS 类型 / Zod schema / 消息协议
│   ├── sdk/                # 用户嵌入的 SDK
│   ├── ui/                 # 共享 React 组件
│   └── db/                 # Drizzle schema (被 server 引用)
├── e2e/                    # E2E 测试
├── .github/workflows/
├── docker/
│   ├── server.Dockerfile
│   └── runner.Dockerfile
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**包管理**：pnpm（节省空间、Monorepo 友好）

**构建**：Turborepo（增量构建、远程缓存）

### 11.2 CI 流程（GitHub Actions）

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      
      - name: TypeScript
        run: pnpm -r typecheck
      
      - name: Lint
        run: pnpm -r lint
      
      - name: Unit Test
        run: pnpm -r test:unit --coverage
      
      - name: Build
        run: pnpm build
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
  
  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test:e2e
  
  docker:
    runs-on: ubuntu-latest
    needs: quality
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: docker buildx build -t ghcr.io/scriptguard/server:${{ github.sha }} -f docker/server.Dockerfile --push .
      - run: docker buildx build -t ghcr.io/scriptguard/runner:${{ github.sha }} -f docker/runner.Dockerfile --push .
```

### 11.3 CD 流程

| 目标 | 触发 | 动作 |
|---|---|---|
| Chrome Web Store | 手动 + tag `v*` | 自动上传 + 提交审核 |
| Firefox Add-ons | 手动 + tag `v*` | 自动上传 + 提交审核 |
| Server (Staging) | push `main` | 自动部署到 staging |
| Server (Production) | 手动 + tag `v*` | 一键部署到生产 |

### 11.4 Docker 镜像

**server.Dockerfile**：

```dockerfile
# 多阶段构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter server build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/package.json ./
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

**runner.Dockerfile**（预装 Playwright 依赖）：

```dockerfile
FROM mcr.microsoft.com/playwright:v1.45.0-jammy
WORKDIR /app
COPY apps/runner/ ./
RUN npm ci --omit=dev
CMD ["node", "dist/worker.js"]
```

### 11.5 数据库迁移

```bash
# 生成迁移
pnpm --filter server db:generate

# 执行迁移
pnpm --filter server db:migrate

# 回滚
pnpm --filter server db:rollback
```

**CI 检查**：迁移文件必须随 PR 提交，未执行迁移不允许合并。

### 11.6 Secrets 管理

| Secret | 来源 | 注入方式 |
|---|---|---|
| 数据库密码 | Doppler → K8s Secret | 容器 env |
| JWT 私钥 | 1Password → Doppler | 容器 env |
| SMTP 密码 | 第三方 | Doppler |
| GitHub Webhook Secret | 一次性生成 → Doppler | 容器 env |
| Chrome Web Store API Key | 团队 → Doppler | GitHub Secret |

### 11.7 灰度发布

- **Chrome Web Store**：发布到"测试人员"→ 审核通过 → 渐进式发布（1% → 10% → 50% → 100%）
- **服务端**：蓝绿部署，新版本先 5% 流量 → 健康检查 → 全量

---

## 12. 可观测性

### 12.1 三支柱

| 支柱 | 工具 | 关键指标 |
|---|---|---|
| **Logs（日志）** | Pino + Loki | 错误率、调试信息 |
| **Metrics（指标）** | Prometheus + Grafana | QPS、延迟、队列深度 |
| **Traces（链路）** | OpenTelemetry → Sentry | 端到端追踪 |

### 12.2 关键 SLI/SLO

| SLI | 目标 |
|---|---|
| 服务可用性 | 99.5% (MVP) / 99.9% (GA) |
| API P95 延迟 | < 200ms |
| 测试任务执行成功率 | > 95% |
| 通知送达率 | > 99% |
| 客户端崩溃率 | < 0.1% |

### 12.3 客户端埋点

```typescript
// utils/telemetry.ts
import * as Sentry from '@sentry/browser'

Sentry.init({
  dsn: process.env.PLASMO_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.PLASMO_PUBLIC_VERSION,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // 脱敏
    if (event.message) event.message = redact(event.message)
    return event
  },
})

// 业务埋点
export function trackEvent(name: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({ category: 'event', message: name, data: properties })
}
```

**关键事件**：

| 事件 | 属性 |
|---|---|
| `script_created` | `{ scriptId, hasRules }` |
| `rule_added` | `{ type, required }` |
| `check_passed` | `{ scriptId, duration }` |
| `check_failed` | `{ scriptId, failedRules, duration }` |
| `alert_sent` | `{ channel, level }` |
| `alert_acknowledged` | `{ scriptId, timeToAck }` |

### 12.4 服务端指标

```typescript
// server/metrics.ts
import promClient from 'prom-client'

export const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
})

export const testRunDuration = new promClient.Histogram({
  name: 'test_run_duration_seconds',
  help: 'Test run duration',
  labelNames: ['status'],
  buckets: [1, 5, 10, 30, 60, 120],
})

export const queueDepth = new promClient.Gauge({
  name: 'bullmq_queue_depth',
  help: 'BullMQ queue depth',
  labelNames: ['queue', 'state'],
})
```

### 12.5 告警规则

| 指标 | 阈值 | 通道 |
|---|---|---|
| 服务 P95 延迟 | > 1s 持续 5min | Slack #alerts |
| 错误率 | > 1% 持续 5min | Slack + PagerDuty |
| 队列堆积 | depth > 100 持续 10min | Slack |
| 数据库连接 | 占用 > 80% | Slack |
| 磁盘 | 占用 > 85% | Slack |
| 客户端崩溃率 | 日增 > 50% | 邮件 |

---

## 13. 技术风险与缓解

| 风险 | 影响 | 概率 | 缓解策略 |
|---|:---:|:---:|---|
| **MV3 Service Worker 休眠** | 定时任务丢失、状态丢失 | 🔴 高 | 关键状态持久化到 `chrome.storage`；定时任务用 `chrome.alarms`；重要操作使用 `chrome.idle` 唤醒检测 |
| **Tampermonkey 跨插件通信受限** | 无法读取用户已安装脚本 | 🔴 高 | 申请 `externally_connectable`；降级为导入 .user.js 文件；提供 Tampermonkey 一键导出 |
| **目标网站反爬/验证码** | 云端测试被阻断 | 🟡 中 | 优先使用本地浏览器后台模式；服务端支持 UA 随机化和限速；遇到验证码明确告知用户 |
| **目标网站登录态** | 云端无法访问需登录页 | 🔴 高 | 支持用户加密保存测试 Cookie；提供"登录态录制"功能；明确区分公开/登录测试 |
| **Playwright 资源消耗** | 云端成本失控 | 🟡 中 | Runner 容器限制 CPU/内存；空闲 Runner 池自动缩减；超时强制清理 |
| **跨浏览器差异** | Firefox/Edge 兼容性 | 🟡 中 | 抽象浏览器差异层（`@extensionizer/*`）；E2E 在三个浏览器都跑；Firefox 单独测试 |
| **CSP 限制** | 内联脚本被禁 | 🟢 低 | 使用外部文件 + nonce；Plasmo 默认处理 |
| **Manifest V3 审核被拒** | Chrome Web Store 上架延迟 | 🟡 中 | 严格遵循最小权限；提供完整隐私政策；详细说明每个权限用途；预留白名单联系信息 |
| **数据库扩展性** | 单 PG 容量/性能瓶颈 | 🟢 低 | MVP 阶段足够；GA 阶段考虑主从 + 分区表 + 冷热分离 |
| **客户端 Bundle 膨胀** | 性能下降、商店审核风险 | 🟡 中 | 持续 bundle 分析；路由懒加载；重型库按需加载；定期清理 |
| **Webhook 安全** | 攻击者伪造通知 | 🟡 中 | HMAC 签名 + 时间戳防重放；IP 白名单（可选） |
| **隐私合规（GDPR/个保法）** | 罚款、声誉损失 | 🟢 低 | 隐私设计先行；用户数据可导出可删除；Sentry 等第三方审查 |
| **用户脚本恶意代码** | 自身安全受损 | 🟡 中 | 沙箱隔离；执行超时；可选静态扫描；明确用户协议免责 |
| **MV3 `web_accessible_resources` 限制** | Content Script 通信受限 | 🟡 中 | 显式声明 `matches`；用 `chrome.runtime.sendMessage` 而非 DOM 通信 |

### 13.1 Fallback 设计

| 场景 | 一级方案 | 降级方案 | 兜底 |
|---|---|---|---|
| Tampermonkey 通信 | `runtime.sendMessage` | Content Script 读 DOM 痕迹 | 手动导入 .user.js |
| 云端测试被反爬 | 等待 + UA 随机化 | 改用本地浏览器后台 | 提示用户手动测试 |
| 通知渠道故障 | 重试 + 切换备份渠道 | 记录到失败队列，次日重发 | 累积到 dashboard 告警 |
| Playwright 启动失败 | 重启 Runner 容器 | 切换到备用 Runner | 报告失败给用户 |
| 云端不可用 | 本地模式继续工作 | 仅核心本地功能 | 降级提示 |
| Service Worker 休眠 | 状态写 storage | 关键事件用 alarms 唤醒 | 容忍重新计算 |

---

## 14. 附录：技术决策记录 (ADR)

### ADR-001：选用 Plasmo 框架

**状态**：已采纳

**背景**：需要支持 Manifest V3、React 18、TypeScript、多浏览器。

**决策**：选用 Plasmo 而非原生 WebExtension。

**理由**：
- ✅ 零配置 MV3 支持
- ✅ 内置 HMR、TypeScript、React
- ✅ 团队上手成本低
- ✅ Chrome/Firefox/Edge 同源开发

**代价**：
- 抽象层带来学习成本
- 某些高级需求需要 eject

**替代方案**：
- Vite + CRX：更灵活但配置多
- 原生 WebExtension：完全可控但开发慢

### ADR-002：客户端状态管理选 Zustand

**状态**：已采纳

**决策**：用 Zustand 而非 Redux Toolkit / Jotai / Recoil。

**理由**：
- Bundle 小（1.2KB vs Redux 12KB）
- 零 Provider，跨页面共享容易
- persist 中间件支持 chrome.storage

**代价**：生态比 Redux 小。

### ADR-003：云端框架选 Fastify

**状态**：已采纳

**决策**：Fastify 而非 Express / NestJS。

**理由**：
- 性能高（比 Express 快 2x）
- 原生 TypeScript + Schema 校验
- 插件生态丰富
- 比 NestJS 轻量、灵活

**代价**：DI 容器不如 NestJS 完善。

### ADR-004：ORM 选 Drizzle

**状态**：已采纳

**决策**：Drizzle 而非 Prisma / TypeORM。

**理由**：
- 零运行时开销
- TypeScript-first
- 迁移工具简单可控
- 接近原生 SQL

**代价**：社区生态较新。

### ADR-005：服务端浏览器自动化选 Playwright

**状态**：已采纳

**决策**：Playwright 而非 Puppeteer。

**理由**：
- 跨浏览器支持好（Chrome/Firefox/Safari/WebKit）
- 自动等待 API 稳定
- 网络拦截、Mock 能力完善
- 微软维护活跃

### ADR-006：开源核心插件

**状态**：已采纳

**决策**：客户端插件 MIT 开源，云端服务闭源。

**理由**：
- 建立信任、SEO、社区贡献
- 商业模式靠云端服务
- SDK 必须开源（嵌入用户脚本）

**风险**：竞品复制。缓解：持续 AI 差异化、深耕社区。

### ADR-007：MVP 阶段不上 K8s

**状态**：已采纳

**决策**：MVP 用 Docker Compose 单机部署，GA 阶段迁移 K8s。

**理由**：
- 节省运维成本
- 早期专注产品验证
- 4C8G VPS 可承载 MVP 流量

### ADR-008：失败告警去重采用指数退避

**状态**：已采纳

**决策**：首次立即通知，后续 5min → 30min → 2h → 24h。

**理由**：
- 避免告警轰炸
- 给网站恢复时间窗口
- 恢复时单独发"已恢复"通知

---

*ScriptGuard TDD v1.0 · 2026-06-17 · 与 PRD v1.0-merged 配套使用*
