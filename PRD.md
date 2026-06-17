# ScriptGuard — 用户脚本健康监控与管理平台

## 产品需求文档 v1.0

| 字段 | 值 |
|------|-----|
| 产品名称 | **ScriptGuard**（中文：脚本卫士） |
| 文档版本 | v1.0 |
| 创建日期 | 2026-06-17 |
| 文档状态 | 草稿 - 等待评审 |
| 目标发布 | TBD |
| 保密级别 | 内部公开 |

---

## 目录

1. [产品概述](#1-产品概述)
2. [核心功能模块](#2-核心功能模块)
3. [非功能需求](#3-非功能需求)
4. [系统架构](#4-系统架构)
5. [数据模型](#5-数据模型)
6. [业务流程与用户故事](#6-业务流程与用户故事)
7. [权限与安全隐私](#7-权限与安全隐私)
8. [商业模式](#8-商业模式)
9. [里程碑与发布计划](#9-里程碑与发布计划)
10. [成功指标](#10-成功指标)
11. [风险与缓解](#11-风险与缓解)
12. [竞品分析](#12-竞品分析)
13. [术语表](#13-术语表)

---

## 1. 产品概述

### 1.1 背景与问题

前端开发者、效率工具作者和运营自动化人员经常通过 Tampermonkey / Violentmonkey / Greasemonkey 等脚本管理器，或直接通过浏览器插件 Content Script，对目标网站做功能增强：自动点击、表单填充、样式修改、数据提取、隐藏元素等。

这类脚本高度依赖目标网站的 **DOM 结构、CSS 选择器、API 路径和页面流程**。一旦目标网站改版（改类名、重构 DOM、调整 API），脚本可能：

1. 关键元素找不到，**脚本静默失效**。
2. 按钮/输入框/列表结构变化，**自动化流程中断**。
3. 接口或鉴权逻辑变化，**请求失败**。
4. 脚本报错但用户**无感知**。
5. 多个网站、多段脚本**分散维护、版本混乱**。
6. 没有定期测试机制，**只能等用户反馈**才发现问题。

目前市场上 **缺乏专门针对用户脚本进行持续健康监控的工具**：Tampermonkey 自身只记录脚本错误；Checkly/UptimeRobot 面向站点可用性，不针对脚本级别；Playwright/Cypress 门槛高，需要独立服务器。

### 1.2 产品定位

ScriptGuard 是一款面向 **用户脚本开发者和重度使用者** 的浏览器插件（主）+ 可选服务端（辅）的一体化解决方案，提供：

- **统一管理** 注入到不同网站的脚本
- **自动化健康检测**（本地 + 定时远程）
- **失效智能告警**（桌面通知 / 邮件 / Webhook / 飞书 / 钉钉 / Slack / Telegram）
- **可视化零代码断言** 配置
- **脚本版本管理** 与回滚
- **真实用户遥测** 与 **AI 辅助根因分析**
- 一站式脚本仪表盘

### 1.3 核心价值主张

- 让脚本作者 **"写完即放心"**：网站改版后第一时间知道哪个脚本挂了。
- 让脚本使用者 **"无感可用"**：脚本失效时收到清晰定位，而非静默崩溃。
- 让个人开发者拥有 **企业级 APM 能力**，且零服务器即可上手。
- 严格执行 **"本地优先 + 隐私优先"**，数据默认留在用户设备。

### 1.4 目标用户

| 用户类型 | 核心痛点 | 关键诉求 |
|---|---|---|
| **脚本开发者** | 自己写并维护多个脚本，服务自己或他人 | 网站改版后不知道哪个脚本挂了 |
| **重度 Tampermonkey 用户** | 安装了 10+ 脚本，每天依赖脚本提升效率 | 脚本失效只能靠肉眼发现 |
| **内部工具开发者** | 给公司后台、CRM、运营平台写增强脚本 | 缺乏集中监控和报警机制 |
| **自动化测试爱好者** | 想用低成本方式做 E2E 监控 | 不想写 Playwright 代码 |
| **前端开发者** | 维护自己写的页面增强脚本 | 想及时发现 DOM 变化 |
| **企业团队** | 多人共享脚本库，有 CI/CD 需求 | 缺少权限分级、审计、共享 |

### 1.5 产品目标（OKR）

**Objective：成为用户脚本开发者首选的健康监控工具**

| Key Result | 目标值 | 衡量周期 |
|---|---|---|
| KR1 插件安装量 | 发布 6 个月内 ≥ 5,000 | 6 个月 |
| KR2 失效通知时效 | 90% 失效事件 30 分钟内通知到用户 | 月度 |
| KR3 仪表盘活跃度 | 用户平均每周主动打开 ≥ 3 次 | 月度 |
| KR4 维护成本 | 帮助用户将脚本维护时间减少 70% | 季度 |
| KR5 检测准确率 | 健康检查准确率 ≥ 90%，误报率 ≤ 10% | 月度 |
| KR6 商业化 | 12 个月内付费转化率 ≥ 5% | 12 个月 |

### 1.6 非目标（Non-Goals）

MVP 阶段明确 **不做**：

- ❌ 不替代 Tampermonkey 的完整脚本生态（仅协同）
- ❌ 不做公开脚本商店 / 脚本市场
- ❌ 不提供复杂云端 IDE
- ❌ 不承诺绕过网站反爬、风控、验证码或权限限制
- ❌ 不自动修复所有脚本问题，只提供 **失效定位和辅助修复信息**
- ❌ 不做移动端支持
- ❌ 不做公开脚本托管（不与 Greasy Fork 竞争）

---

## 2. 核心功能模块

### 2.1 功能模块总览

| 编号 | 模块 | 优先级 | MVP | 简介 |
|------|------|:---:|:---:|------|
| F1 | 脚本管理中心 | P0 | ✅ | 新建/编辑/导入/启用/禁用/分组/版本 |
| F2 | 页面注入与运行 | P0 | ✅ | URL 匹配、注入时机、隔离、超时保护 |
| F3 | 健康检查规则引擎 | P0 | ✅ | 元素/文本/可点击/网络/JS 断言 |
| F4 | 失效提示（页面内） | P0 | ✅ | 浮层、Badge、浏览器通知 |
| F5 | 手动测试 | P0 | ✅ | 立即测试、批量测试、报告 |
| F6 | 定期自动测试 | P0 | ✅ | 本地 Cron + 云端 Playwright |
| F7 | 报警与通知 | P0 | ✅ | 桌面/邮件/Webhook（飞书/钉钉/Slack/TG） |
| F8 | 运行日志与历史 | P0 | ✅ | 本地 30 天 / 云端 90 天 |
| F9 | 选择器辅助采集 | P1 | ✅ | 点选生成稳定选择器 |
| F10 | 版本管理 | P1 | ⬜ | 版本 diff、回滚、changelog |
| F11 | 仪表盘 | P0 | ✅ | 总览/详情/设置/报告 |
| F12 | 开发者工具 | P1 | ⬜ | Live Reload、内置编辑器 |
| F13 | 内嵌自检 SDK | P1 | ⬜ | `GM_healthCheck` 风格 API |
| F14 | 团队协作 | P2 | ⬜ | 共享/权限/审计 |
| F15 | 真实错误遥测 | P2 | ⬜ | 终端用户报错 SDK 上报 |
| F16 | AI 辅助分析 | P2 | ⬜ | AI 影子审查、选择器推荐 |

### 2.2 F1 脚本管理中心

**功能描述**：用户可创建、导入、编辑、启用、禁用和删除注入脚本。

**功能要求**：

- 支持按 **网站域名** 管理脚本
- 支持 **匹配规则**（URL 模式 / 通配符 / 正则）
- 支持 **脚本版本号**（语义化版本 SemVer）
- 支持 **启用 / 禁用** 开关
- 支持脚本 **备注、描述、分组、标签**
- 支持 **导入 `.user.js` 文件**（兼容 Tampermonkey 元信息）
- 支持 **导出** 脚本配置（JSON / .user.js）
- 支持 **从 Greasy Fork / GitHub 一键导入**
- 支持 **与 Tampermonkey 协同**：读取已安装脚本列表（通过 API 或导出导入）

**核心字段**：

```json
{
  "id": "script_001",
  "name": "订单页增强工具",
  "description": "增强订单后台操作体验",
  "version": "1.3.2",
  "matchRules": ["https://example.com/orders/*"],
  "runAt": "document_idle",
  "enabled": true,
  "code": "...",
  "tags": ["内部工具", "订单"],
  "groupId": "grp_orders",
  "createdAt": "2026-06-17T00:00:00.000Z",
  "updatedAt": "2026-06-17T00:00:00.000Z"
}
```

### 2.3 F2 页面注入与运行

**功能描述**：插件根据 URL 匹配规则，将对应脚本注入到目标页面。

**运行时机**：

| 时机 | 说明 |
|---|---|
| `document_start` | 页面 DOM 解析前（Tampermonkey 兼容） |
| `document_idle` | DOM 解析完成后（默认） |
| `document_end` | DOMContentLoaded 之后 |
| `manual` | 手动触发（如点击插件按钮） |

**功能要求**：

- 支持 **隔离环境** 运行（沙箱 / world）
- 支持访问页面 DOM
- 支持 **脚本执行超时保护**（默认 10s 可配置）
- 支持 **捕获脚本运行错误**（未捕获异常、Promise reject）
- 支持在页面内显示脚本运行状态
- 严格遵守 Manifest V3 限制

**运行状态**：

| 状态 | 标识 | 说明 |
|---|---|---|
| 未运行 | 🔘 | 当前页面未匹配脚本 |
| 运行中 | ⏳ | 脚本正在执行 |
| 成功 | ✅ | 执行完成且健康检查通过 |
| 警告 | ⚠️ | 运行成功但部分检查失败 |
| 降级 | ⚠️ Degraded | 部分功能异常但脚本仍在运行 |
| 失败 | ❌ Failed | 抛未捕获异常或核心检查失败 |
| 失效 | ❌ | 关键选择器/API 不可用 |

### 2.4 F3 健康检查规则引擎

**功能描述**：为每个脚本配置健康检查规则，判断目标页面是否仍兼容。

**检查类型（9 类）**：

| 类型 | 用途 | 示例 |
|---|---|---|
| `selector_exists` | 元素存在性 | `[data-testid='submit']` |
| `selector_visible` | 元素可见性 | `.user-menu` |
| `selector_text` | 文本匹配 | `h1` 含 "订单管理" |
| `selector_clickable` | 元素可点击 | `button.confirm` |
| `selector_inputable` | 输入框可输入 | `input[name=q]` |
| `url_match` | URL 路由 | `path === '/orders'` |
| `network_status` | 网络请求状态 | `api.example.com/list` 200 |
| `js_assertion` | 自定义 JS 断言 | `() => window.APP?.ready === true` |
| `console_clean` | 控制台无错误 | 无 `Uncaught` 日志 |
| `duration` | 耗时检查 | 脚本执行 < 2s |

**规则组合**：支持 AND / OR 逻辑嵌套。

**示例规则**：

```json
{
  "id": "rule_001",
  "scriptId": "script_001",
  "name": "提交按钮存在",
  "type": "selector_exists",
  "selector": "[data-testid='submit-button']",
  "required": true,
  "timeout": 3000,
  "alertLevel": "high"
}
```

**零代码原则**：核心断言配置必须采用图形化界面（点选 + 表单），**严禁** 强迫用户编写 Puppeteer / Playwright 代码。

### 2.5 F4 失效提示（页面内）

**功能描述**：脚本或健康检查失败时，在页面内即时提示用户。

**提示方式**：

- 页面右上角浮层（轻量、不遮挡主内容）
- 插件图标 Badge（红色角标显示失效脚本数量）
- 浏览器桌面通知（Notification API）
- 插件面板错误列表

**提示内容**：

- 脚本名称 + 版本
- 当前 URL
- 失败规则
- 错误信息
- 最近一次成功时间
- 快速打开调试面板入口

**示例提示**：

```
ScriptGuard 检测到脚本可能已失效

脚本：订单页增强工具  v1.3.2
失败：找不到提交按钮 [data-testid='submit-button']
页面：https://example.com/orders
最近成功：2 小时前
[打开详情] [查看日志] [暂时禁用]
```

### 2.6 F5 手动测试

**功能描述**：用户在插件面板点击「立即测试」执行健康检查。

**功能要求**：

- 支持 **测试当前页面**
- 支持 **测试指定 URL**（输入多个）
- 支持 **单个脚本测试**
- 支持 **批量测试** 某网站下全部脚本
- 输出 **测试报告**（结构化结果）
- 支持 **失败截图**（云端模式）
- 支持 **控制台错误** 采集
- 支持 **DOM 快照** 导出（用于后续 diff）

### 2.7 F6 定期自动测试

**功能描述**：按用户设定的频率，自动打开目标页面并执行健康检查。

**双模式**：

| 模式 | 说明 | 适用场景 |
|---|---|---|
| **本地模式** | 浏览器运行时插件后台静默打开无痕标签页测试 | 电脑常开、隐私敏感、需要登录态 |
| **云端模式** | 云端 Headless（Playwright）定时访问 | 24/7 监控、CI/CD 集成、团队共享 |
| **GitHub Actions 模式** | 一键导出 YAML，复用 GitHub 免费算力 | 个人开发者、低成本方案 |

**定时配置**：

- 每小时 / 每天 / 每周 / 自定义 cron
- 仅工作日 / 指定时间段
- 错峰执行（避免集中）

**测试结果分类**：

- 成功 / 失败 / 部分失败
- 超时（默认 30s）
- 页面无法访问（4xx/5xx/网络错误）
- 需要登录（未配置登录态）
- 被验证码阻断
- 被反爬阻断

**沙盒要求**：

- 模拟干净的、无登录 Cookie 缓存的浏览器环境
- 支持配置 **预设 Cookie** 以测试需登录页面
- 严格控制执行时机（`@run-at document-start/end`）
- 单次执行完毕立即 **销毁标签页**，防内存泄漏

### 2.8 F7 报警与通知

**功能描述**：脚本失效或测试失败时，通过多渠道通知用户。

**通知渠道**：

| 渠道 | MVP | 后续 |
|---|:---:|:---:|
| 浏览器桌面通知 | ✅ | |
| 邮件（SMTP） | ✅ | |
| Webhook（通用） | ✅ | |
| 飞书机器人 | | ✅ |
| 钉钉机器人 | | ✅ |
| 企业微信机器人 | | ✅ |
| Slack | | ✅ |
| Discord | | ✅ |
| Telegram Bot | | ✅ |
| GitHub Issue | | ✅ |
| 短信 | | ✅ |

**报警策略（防轰炸）**：

- **首次失败** 立即通知
- **指数退避**：5min → 30min → 2h → 24h
- **静默窗口**：可设定某时间段内不发送
- **告警合并**：同一时间多脚本失效合并为一条摘要
- **恢复通知**：恢复成功时单独发送

**报警级别**：

| 级别 | 标识 | 适用场景 |
|---|---|---|
| Low | 🟢 | 非核心功能失败 |
| Medium | 🟡 | 部分功能失效 |
| High | 🟠 | 核心流程不可用 |
| Critical | 🔴 | 多个关键脚本同时失败 |

**报警消息模板（结构化）**：

```
🚨 脚本运行失败通知
📦 脚本名称：XXX 百度网盘加速助手
🌐 受影响网址：https://pan.baidu.com/disk/main...
❌ 失败原因：断言失败 - 找不到目标元素 a.wp-download-file
📅 触发时间：2026-06-17 12:00:00 (UTC+8)
🔗 查看详情：https://scriptguard.dev/runs/run_001
```

### 2.9 F8 运行日志与历史

**日志内容**：

```typescript
interface CheckRecord {
  scriptId: string;
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  duration: number;              // ms
  failedRules: string[];
  errorMessage?: string;
  errorStack?: string;
  domSnapshot?: string;          // 关键节点序列化
  screenshotUrl?: string;        // 云端模式
  browserInfo: { ua: string; viewport: string };
  pluginVersion: string;
  url: string;
}
```

**保留策略**：

- 本地日志默认 **30 天**
- 云端日志默认 **90 天**
- 用户可手动清理
- 用户可导出 PDF / CSV 报告

### 2.10 F9 选择器辅助采集

**功能描述**：用户点选元素，插件自动生成相对稳定的选择器。

**选择器优先级**（与脚本维护最佳实践一致）：

1. `data-testid`
2. `data-test`
3. `aria-label`
4. `role + text`
5. `name`
6. 稳定 `id`
7. class 组合
8. CSS 路径
9. XPath（最后手段）

**功能要求**：

- 支持点击元素生成选择器
- 支持右键元素 → 弹出菜单 → "生成稳定选择器"
- 避免生成过长的 `nth-child` 链
- 支持手动编辑选择器
- 支持立即 **验证** 选择器是否匹配元素
- 支持保存为 **健康检查规则**（一键）
- 支持 **变更追踪**：对比网站 DOM 结构变化

### 2.11 F10 版本管理

**功能要求**：

- 每次保存脚本生成一个版本快照
- 支持查看 **版本 diff**（代码 + 配置）
- 支持 **回滚** 到历史版本
- 支持填写 **changelog**
- 支持标记 **稳定版本**（stable tag）
- 支持导出指定版本
- 支持 **一键发布到 GitHub** + 配置 `@updateURL`
- 支持 **GitHub Actions 模板** 自动化发布

### 2.12 F11 仪表盘

**两种形态**：插件 Popup（轻量）+ 独立 Options 页（完整）。

| 页面 | 核心内容 |
|---|---|
| **Popup 总览** | 当前 URL、匹配脚本、运行状态、最近结果、立即测试按钮 |
| **总览页** | 所有脚本状态卡片、状态统计环形图、最近告警时间线 |
| **脚本详情页** | 30 天状态历史折线图、检测日志、规则配置、手动触发、DOM diff |
| **设置页** | 通知渠道、全局检测频率、Tampermonkey 连接、备份导入导出 |
| **报告页** | 周报/月报，可用率统计，PDF/CSV 导出 |
| **告警页** | 未处理告警列表、确认/忽略、规则调整 |

### 2.13 F12 开发者工具（Live Reload / 编辑器）

**功能要求**：

- **Live Reload**：修改脚本后自动刷新目标页面
- **内置简易编辑器**：支持语法高亮、TypeScript
- **预览沙箱**：在隔离 iframe 预览脚本效果
- **选择器生成器**（见 F9）
- **变更追踪**：对比网站 DOM 结构变化与脚本匹配规则

### 2.14 F13 内嵌自检 SDK

提供轻量级 API，供脚本开发者在脚本内部主动上报健康状态：

```javascript
// ==UserScript==
// @name         我的脚本
// @require      https://scriptguard.dev/sdk.js
// ==/UserScript==

const sg = new ScriptGuard('my-awesome-script');

sg.check('目标按钮存在',  () => !!document.querySelector('.btn-submit'));
sg.check('用户已登录',    () => window.USER_INFO?.id != null);
sg.check('列表渲染完成',  () => document.querySelectorAll('.item').length > 0);
sg.check('无控制台错误',  () => !window.__lastError);

sg.report();   // 自动汇总所有 check 结果上报
```

设计目标：**GM_ 风格** API，零学习成本。

### 2.15 F14 团队协作（企业版）

- 团队空间
- 脚本共享
- 角色权限（Admin / Developer / Viewer）
- 审计日志
- 企业通知渠道（飞书/钉钉/企业微信）
- SSO 接入（企业版高级特性）

### 2.16 F15 真实错误遥测（Telemetry）

**功能描述**：提供轻量 SDK（参考 Sentry），嵌入到油猴脚本头部。当真实终端用户在日常使用中遭遇网页改版报错时，脚本静默向 ScriptGuard 后台上报报错快照。

**实现要点**：

- SDK 体积 < 5KB（minified + gzipped）
- 仅上报错误类型、堆栈、URL、版本，**不上传页面内容**
- 完全 opt-in，需用户在脚本代码中显式 require
- 支持去重和采样
- 服务端聚合后通过 F7 通道告警给开发者

**价值**：实现 **"万人拾柴"** 的主动防御 — 真实用户的报错自动汇总到开发者处。

### 2.17 F16 AI 辅助分析（未来）

**AI 影子审查机制**：脚本断言失败时，自动捕获当前网页最新 DOM 结构，与历史成功时的 DOM 进行 diff，智能提示：

> "目标网站已将 `.old-btn-class` 变更为 `.new-btn-hash`，建议将脚本第 42 行的选择器进行修改。"

**功能范围**（v1.3+）：

- 根据 DOM 变化推荐新选择器
- AI 自动生成测试用例
- AI 分析错误堆栈给出根因
- Playwright 脚本智能导入

---

## 3. 非功能需求

| 维度 | 要求 |
|---|---|
| **性能 — 注入耗时** | 插件注入 < 300ms |
| **性能 — 健康检查** | 单脚本检查 < 2s |
| **性能 — 页面内提示** | 浮层展示 < 1s |
| **性能 — 测试报告** | 生成 < 10s |
| **性能 — 资源占用** | 后台检测 CPU 占用 < 5%；监控模块体积 < 50KB；页面加载速度影响 < 5% |
| **性能 — 仪表盘首屏** | < 500ms |
| **安全** | 脚本代码本地存储；不上传到服务器（除非用户主动授权云同步）；遵循 Chrome MV3 安全规范 |
| **隐私** | 不收集用户浏览行为；仅授权时收集匿名崩溃报告；符合 GDPR / 个保法 |
| **兼容性 — 浏览器** | Chrome 120+, Edge 120+, Firefox 115+ |
| **兼容性 — 脚本管理器** | 兼容 Tampermonkey, Violentmonkey, Greasemonkey |
| **可用性** | 服务端 SLA ≥ 99.5%；插件核心功能（本地检测）离线可用 |
| **国际化** | 简体中文 / 英文（系统级 i18n） |
| **开源协议** | 推荐 MIT 协议（社区友好） |
| **可扩展性** | 通知渠道、检查类型、断言规则均可插件化扩展 |

---

## 4. 系统架构

### 4.1 整体架构

ScriptGuard 采用 **"插件端为主，服务端为辅"** 的架构：

```
+-------------------------------------------------------------------------+
|                       ScriptGuard 浏览器插件端                          |
|  +----------------+ +-------------------+ +------------------------+   |
|  | 脚本管理看板   | | 可视化断言配置面板| | 本地调度器 (alarms)    |   |
|  +----------------+ +-------------------+ +------------------------+   |
|  +----------------+ +-------------------+ +------------------------+   |
|  | Content Script | | Background SW     | | 页面内失效提示浮层    |   |
|  | (注入+健康检查)| | (调度+通知+同步)  | | (overlay UI)         |   |
|  +----------------+ +-------------------+ +------------------------+   |
+------------------------------------+------------------------------------+
                                     |
            +------------------------+------------------------+
            |                        |                        |
            v                        v                        v
+-----------------------+  +----------------------+  +-------------------+
|  本地存储             |  |  可选云端服务         |  |  GitHub Actions   |
|  chrome.storage.local |  |  Node.js + Playwright|  |  (用户自有算力)   |
|  IndexedDB            |  |  PostgreSQL          |  |                   |
|                       |  |  Cron 调度           |  |                   |
+-----------------------+  +----------------------+  +-------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        通知与报警系统                                   |
|  Browser Notification / Email(SMTP) / Webhook                          |
|  飞书 / 钉钉 / 企业微信 / Slack / Discord / Telegram / GitHub Issue   |
+-------------------------------------------------------------------------+
```

### 4.2 浏览器插件端

| 子模块 | 技术选型 | 职责 |
|---|---|---|
| **Manifest** | MV3 | 权限、background、内容脚本声明 |
| **Background SW** | Service Worker | 调度、同步、通知、跨页面协调 |
| **Content Script** | 注入到目标页 | 脚本执行、健康检查、页面内浮层 |
| **Popup** | React 18 + TypeScript | 快速状态查看、立即测试 |
| **Options** | React 18 + TypeScript + Tailwind | 完整管理后台 |
| **Editor** | Monaco / CodeMirror | 脚本代码编辑 |
| **SDK (Optional)** | UMD/ESM | 提供给用户脚本的 API |

### 4.3 巡检引擎

**双模式设计**：

| 模式 | 技术 | 优势 | 局限 |
|---|---|---|---|
| **本地浏览器后台** | 插件 Background SW + 无痕标签页 | 复用登录态、低成本、隐私好 | 电脑必须开启 |
| **云端 Headless** | Playwright (Node.js) | 24/7、独立环境、可扩展 | 需登录态、需付费 |
| **GitHub Actions** | 用户自带的 Actions 算力 | 免费、可控 | 需用户懂 CI/CD |

### 4.4 数据存储

| 数据 | 存储位置 | 保留期 |
|---|---|---|
| 脚本元数据 | `chrome.storage.local` | 永久（用户可清理） |
| 脚本代码 | `chrome.storage.local` | 永久 |
| 检测历史 | `chrome.storage.local` + IndexedDB | 30 天（可配置） |
| DOM 快照 | IndexedDB | 7 天 |
| 云端历史 | PostgreSQL | 90 天（Pro） |
| 团队数据 | PostgreSQL | 永久（Team） |

### 4.5 与 Tampermonkey 通信

- **首选**：通过 `chrome.runtime.sendMessage` 跨插件通信（需 Tampermonkey 开放 `externally_connectable`）
- **降级**：通过 Content Script 读取 DOM 中的脚本执行痕迹
- **兜底**：用户从 Tampermonkey 导出脚本 JSON，导入到 ScriptGuard

### 4.6 通知与报警

| 渠道 | 实现 |
|---|---|
| Browser Notification | WebExtensions Notifications API |
| Email | SMTP（Nodemailer） |
| Webhook | HTTP POST + 模板渲染（飞书/钉钉/Slack/Discord/TG 自适配） |
| GitHub Issue | GitHub REST API |

---

## 5. 数据模型

### 5.1 TypeScript 核心模型

```typescript
type HealthStatus = 'healthy' | 'degraded' | 'failed' | 'unknown';
type RunAt = 'document_start' | 'document_idle' | 'document_end' | 'manual';
type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

interface Script {
  id: string;                    // UUID
  name: string;
  description?: string;
  version: string;               // SemVer
  matchUrls: string[];           // URL 匹配规则
  runAt: RunAt;
  enabled: boolean;
  code: string;
  rules: CheckRule[];
  tags: string[];
  groupId?: string;
  checkInterval: number;         // 秒
  alertLevel: AlertLevel;
  notifyChannels: NotifyChannel[];
  createdAt: Date;
  updatedAt: Date;
}

interface CheckRule {
  id: string;
  scriptId: string;
  name: string;
  type: 'selector_exists' | 'selector_visible' | 'selector_text'
      | 'selector_clickable' | 'selector_inputable' | 'url_match'
      | 'network_status' | 'js_assertion' | 'console_clean' | 'duration';
  selector?: string;
  expected?: string;
  assertion?: string;            // JS 表达式
  required: boolean;
  timeout: number;               // ms
  alertLevel: AlertLevel;
}

interface NotifyChannel {
  type: 'browser' | 'email' | 'webhook' | 'feishu' | 'dingtalk'
      | 'wecom' | 'slack' | 'discord' | 'telegram' | 'github_issue';
  config: Record<string, any>;   // 渠道特定配置
  enabled: boolean;
}

interface CheckRecord {
  id: string;
  scriptId: string;
  timestamp: Date;
  status: HealthStatus;
  url: string;
  duration: number;              // ms
  failedRules: string[];         // rule IDs
  errorMessage?: string;
  errorStack?: string;
  domSnapshot?: string;
  screenshotUrl?: string;
  browserInfo: { ua: string; viewport: string };
  pluginVersion: string;
  mode: 'local' | 'cloud' | 'github_actions';
}

interface TestRun {
  id: string;
  scriptId: string;
  url: string;
  status: HealthStatus;
  startedAt: Date;
  endedAt: Date;
  duration: number;
  failedRules: string[];
  screenshotUrl?: string;
  errorMessage?: string;
}
```

### 5.2 JSON 示例

```json
{
  "id": "script_001",
  "name": "订单页增强工具",
  "description": "增强订单后台操作体验",
  "version": "1.3.2",
  "matchRules": ["https://example.com/orders/*"],
  "runAt": "document_idle",
  "enabled": true,
  "code": "...",
  "rules": [
    {
      "id": "rule_001",
      "name": "提交按钮存在",
      "type": "selector_exists",
      "selector": "[data-testid='submit-button']",
      "required": true,
      "timeout": 3000,
      "alertLevel": "high"
    }
  ],
  "checkInterval": 3600,
  "alertLevel": "high",
  "notifyChannels": [
    { "type": "browser", "enabled": true, "config": {} },
    { "type": "webhook", "enabled": true, "config": { "url": "https://oapi.dingtalk.com/robot/send?access_token=xxx" } }
  ],
  "createdAt": "2026-06-17T00:00:00.000Z",
  "updatedAt": "2026-06-17T00:00:00.000Z"
}
```

---

## 6. 业务流程与用户故事

### 6.1 核心业务流程

**A. 新建脚本流程**

1. 用户打开插件 Options 页
2. 点击"新建脚本"
3. 输入名称、版本号、匹配 URL
4. 粘贴或编写脚本代码
5. 选择运行时机（`document_start/idle/end`）
6. 配置健康检查规则（点选元素生成）
7. 保存
8. 打开目标页面验证脚本运行
9. 可选：配置定时测试和报警渠道

**B. 失效检测流程**

1. 用户访问目标网站
2. 插件识别当前 URL 匹配脚本
3. 注入脚本（按 `runAt` 时机）
4. 脚本执行完成
5. 插件按 F3 规则执行健康检查
6. 关键检查失败 → 标记 `failed` / `degraded`
7. 展示页面内失效提示浮层
8. 记录日志（含 DOM 快照、错误堆栈）
9. 按 F7 报警策略触发通知
10. 用户点击通知 → 打开详情页 → 查看 diff / 修复

**C. 定时测试流程（云端模式）**

1. 用户为脚本配置每日 09:00 定时测试
2. 云端 Cron 在指定时间启动 Playwright
3. 打开目标 URL
4. 注入脚本或执行 SDK 检查
5. 等待稳定、执行所有 CheckRule
6. 保存结果、截图、DOM 快照
7. 若失败，触发 F7 报警
8. 用户打开报告查看详情

**D. 失败修复流程（闭环）**

1. 用户收到告警
2. 打开脚本详情页，查看 DOM diff
3. AI 建议新选择器（v1.3+）
4. 用户编辑选择器、保存新版本
5. 自动测试通过 → 发送恢复通知
6. 归档失效历史用于趋势分析

### 6.2 用户故事与验收标准

| 编号 | 用户故事 | 验收标准（AC） |
|---|---|---|
| **US-01** | 作为脚本开发者，我希望脚本失效后 30 分钟内收到通知 | 1. 关键元素消失后下次检测触发通知<br>2. 桌面通知出现，标注失效脚本名称和原因<br>3. 通知点击后直接跳转到脚本详情页 |
| **US-02** | 作为重度用户，我希望在仪表盘一眼看出哪些脚本正常、哪些失效 | 1. 仪表盘首页显示状态环形图<br>2. 失效脚本卡片以红色高亮显示<br>3. 支持按状态筛选 |
| **US-03** | 作为开发者，我希望配置检测规则时有可视化界面，不需要写代码 | 1. 提供规则编辑器 UI（点选元素）<br>2. 支持实时预览规则在当前页面的执行结果<br>3. 保存后 5 秒内生效 |
| **US-04** | 作为团队负责人，我希望每周收到脚本可用率报告 | 1. 定时任务每周一 09:00 发送邮件报告<br>2. 报告包含各脚本可用率、失效次数、平均恢复时间 |
| **US-05** | 作为开发者，我希望查看脚本失效前后的 DOM 变化，快速定位问题 | 1. 详情页显示失效前后 DOM 快照 diff<br>2. 高亮显示新增/删除/变更的元素<br>3. 支持导出快照 HTML |
| **US-06** | 作为油猴脚本作者，我希望导入现有 .user.js 后自动设置基础监控规则 | 1. 一键导入 .user.js<br>2. 自动解析 `@match` 规则生成匹配列表<br>3. 提供"智能生成基础规则"按钮 |
| **US-07** | 作为隐私敏感用户，我希望所有数据都存在本地 | 1. 默认不上传任何数据到服务器<br>2. 云端同步需明确二次确认<br>3. 提供一键导出/导入本地数据 |
| **US-08** | 作为个人开发者，我希望用 GitHub Actions 免费跑定时测试 | 1. 一键生成 `.github/workflows/scriptguard.yml`<br>2. 文档说明如何在 repo 中保存 Secrets<br>3. 测试结果自动回传到插件 |
| **US-09** | 作为脚本作者，我希望脚本在多人使用时真实报错能自动汇总给我 | 1. SDK 嵌入简单（`<5KB`，require 一行）<br>2. 真实用户报错自动聚合到 dashboard<br>3. 去重避免刷屏 |
| **US-10** | 作为运维人员，我希望告警不要刷屏 | 1. 同类告警指数退避（5min→30min→2h→24h）<br>2. 支持静默窗口<br>3. 恢复时单独通知 |

---

## 7. 权限与安全隐私

### 7.1 浏览器权限设计

| 权限 | 用途 | 必要性 |
|---|---|---|
| `storage` | 保存脚本和配置 | 必需 |
| `scripting` | 注入脚本 | 必需 |
| `tabs` | 获取当前页面信息 | 必需 |
| `alarms` | 本地定时任务 | 必需 |
| `notifications` | 浏览器通知 | 必需 |
| `activeTab` | 当前页面操作 | 必需 |
| `host_permissions` | 访问用户配置的网站 | 用户授权 |
| `externally_connectable` | 与 Tampermonkey 通信 | 可选 |

**权限原则**：

- 默认 **最小权限**
- 只对 **用户配置的网站** 申请访问权限
- **不默认访问所有网站**（MV3 也不允许 `<all_urls>` 默认）
- **不采集页面敏感内容**
- 用户可随时关闭某个网站的脚本权限

### 7.2 安全原则

- 不上传用户脚本代码，除非用户开启云端同步
- 不上传网页正文内容、Cookie、localStorage、token
- 报警日志默认只包含 URL、脚本 ID、错误类型、失败规则
- 云端测试账号信息加密保存
- 敏感字段在日志中自动脱敏（邮箱、手机号、token）
- 用户脚本执行前显示权限说明
- 脚本运行 **超时限制**（默认 10s）
- 禁止脚本访问插件内部敏感配置
- 云端 Runner 与用户数据隔离
- 团队版需要 **权限分级**

### 7.3 隐私合规

- 不收集用户浏览行为数据
- 仅在用户授权时收集 **匿名崩溃报告**
- 符合 **GDPR** 与 **个人信息保护法**
- 隐私政策清晰可访问
- 提供 **数据导出 / 一键删除** 功能

### 7.4 沙箱与隔离

- Content Script 在 **ISOLATED world** 执行
- 用户脚本可访问页面 DOM 但不污染页面全局
- 云端 Runner 使用 **一次性容器**，执行后销毁
- 严禁收集、上传目标网站的用户账户、密码、token、cookie

---

## 8. 商业模式

### 8.1 套餐结构

| 套餐 | 价格 | 目标用户 | 核心能力 |
|---|---|---|---|
| **Free** | ¥0 | 个人尝鲜 | 本地脚本管理、本地健康检查、手动测试、最近 7 天日志、最多 10 个脚本 |
| **Pro** | ¥29/月 | 个人重度用户 | + 云端定时测试、Webhook/邮件报警、失败截图、90 天日志、不限脚本数、GitHub Actions 集成 |
| **Team** | ¥99/席位/月 | 小团队 | + 团队空间、脚本共享、角色权限、审计日志、企业通知渠道、SSO |
| **Enterprise** | 商务定价 | 中大型企业 | + 自托管、定制集成、SLA 99.9%、专属支持 |

### 8.2 商业模式要点

- **免费版核心功能可用**（本地检测 + 手动测试），保证获客
- **付费墙设在云端/协作**（运营成本高的功能）
- **GitHub Actions 模式**作为免费版与 Pro 版的桥梁（用户自带算力）
- **企业版走商务**（高客单价、低 CAC）

### 8.3 开源策略

- **核心插件 MIT 开源**（建立信任、社区贡献、SEO 友好）
- **云端服务** 闭源（商业模式）
- **SDK** 开源（降低使用门槛）
- **GitHub Actions 模板** 开源

---

## 9. 里程碑与发布计划

### 9.1 三阶段发布（核心节奏）

| 阶段 | 时间目标 | 交付内容 | 成功指标 |
|---|---|---|---|
| **Alpha** | T+6 周 | F1 脚本管理 + F2 注入 + F3 健康检查 + F4 失效提示 + F5 手动测试 + F11 Popup + F7 桌面通知 | 内部 5 人测试通过，检测准确率 > 90% |
| **Beta** | T+12 周 | + F6 本地/云端定时测试 + F7 邮件/Webhook/飞书/钉钉 + F8 日志 + F9 选择器采集 + F11 完整仪表盘 + GitHub Actions 模板 | 外部 50 用户 Beta，NPS > 40 |
| **v1.0 GA** | T+18 周 | + F10 版本管理 + F12 开发者工具 + Chrome Web Store 上架 + 文档站 + 官网 | 安装量 1,000+，7 日留存 > 60%，首批 50 付费 Pro |
| **v1.5** | T+28 周 | + F13 自检 SDK + F14 团队协作 + F15 真实错误遥测 + 自托管服务端 | 首批付费企业客户 5+ |
| **v2.0** | T+40 周 | + F16 AI 辅助（选择器推荐、影子审查） + 智能告警聚合 + 移动端监控面板（PWA） | AI 功能使用率 > 30% |

### 9.2 MVP 范围（Alpha+ 必做）

**MVP 必做**：

1. 浏览器插件基础框架（MV3 + TS + React）
2. 脚本新增、编辑、删除、启用、禁用、分组
3. URL 匹配规则 + 注入执行
4. DOM 健康检查规则（元素/文本/可见/可点击）
5. 页面内失效提示浮层
6. 本地运行日志
7. 手动测试当前页面
8. 插件 Popup 展示当前状态
9. 浏览器桌面通知
10. Webhook 报警（飞书/钉钉/Slack 模板）
11. 邮件报警
12. 云端每日定时测试（Playwright）
13. 测试失败截图
14. GitHub Actions 一键模板

**MVP 不做**：

1. ❌ 脚本公开市场
2. ❌ 多人协作
3. ❌ 高级权限系统
4. ❌ 自动修复脚本
5. ❌ AI 自动生成脚本
6. ❌ 复杂可视化流程编排
7. ❌ 移动端原生 App

### 9.3 用户故事优先级

| 优先级 | 用户故事 | 阶段 |
|---|---|---|
| **P0** | 导入脚本后能自动设置基础监控规则 | MVP |
| **P0** | 脚本失效时立即收到通知 | MVP |
| **P0** | 每周自动测试一次关键功能 | MVP |
| **P0** | 仪表盘总览所有脚本状态 | MVP |
| **P1** | 一键生成稳定选择器 | Beta |
| **P1** | 查看历史测试报告和截图 | Beta |
| **P1** | 与 GitHub Actions 深度集成 | Beta |
| **P1** | 版本对比与回滚 | v1.0 |
| **P2** | 多设备同步 | v1.5 |
| **P2** | 团队协作（共享脚本监控） | v1.5 |
| **P2** | 真实用户报错遥测 | v1.5 |
| **P3** | AI 辅助生成测试用例 | v2.0 |
| **P3** | AI 影子审查（DOM diff 智能建议） | v2.0 |

---

## 10. 成功指标

### 10.1 产品指标

| 指标 | 目标 | 衡量方式 |
|---|---|---|
| 脚本创建完成率 | ≥ 70% | 创建到首次测试通过 |
| 健康检查配置率 | ≥ 60% | 创建脚本后配置至少 1 条规则 |
| 每周活跃用户（WAU） | 持续增长，月环比 ≥ 10% | 埋点 |
| 测试任务成功执行率 | ≥ 95% | Cron 任务统计 |
| 失败报警准确率 | ≥ 90% | 用户反馈标记 |
| 用户主动回访率 | ≥ 40% | WAU / 总安装 |
| 7 日留存 | ≥ 60% | 埋点 |
| 付费转化率 | 12 个月内 ≥ 5% | 支付埋点 |
| 维护时间减少 | ≥ 70% | 用户调研 |

### 10.2 技术指标

| 指标 | 目标 |
|---|---|
| 插件注入耗时 | < 300ms |
| 健康检查耗时（单脚本） | < 2s |
| 页面内提示延迟 | < 1s |
| 测试报告生成时间 | < 10s |
| 云端任务调度成功率 | ≥ 99% |
| 仪表盘首屏加载 | < 500ms |
| 后台检测 CPU 占用 | < 5% |
| 监控模块体积 | < 50KB |
| 服务端 SLA | ≥ 99.5% |

### 10.3 业务指标

| 指标 | 12 个月目标 |
|---|---|
| 插件总安装量 | 50,000+ |
| Pro 付费用户 | 1,000+ |
| Team 企业数 | 50+ |
| ARR | ¥1M+ |
| NPS | > 50 |

---

## 11. 风险与缓解

| 风险 | 影响 | 概率 | 缓解策略 |
|---|:---:|:---:|---|
| **MV3 Service Worker 限制** | 插件后台会被休眠 | 🟡 中 | 使用 `chrome.alarms` 替代长期定时；关键状态持久化到 `chrome.storage` |
| **Tampermonkey 跨插件 API 不开放** | 无法直接读取用户脚本 | 🔴 高 | 降级方案：通过 Content Script 读取 DOM 执行痕迹；申请 `externally_connectable` 白名单；提供导入导出兜底 |
| **目标网站反爬/风控** | 云端测试被阻断 | 🟡 中 | 优先使用本地浏览器后台模式；服务端提供 UA 随机化、限速、登录态注入；遇到验证码明确告知 |
| **登录态测试问题** | 云端无法复用用户登录态 | 🔴 高 | 支持用户配置测试账号 Cookie（加密保存）；明确区分公开页面测试和登录后测试 |
| **脚本安全风险** | 用户脚本可能包含危险代码 | 🟡 中 | 本地优先；云端同步需明确授权；脚本执行前显示权限说明；执行超时限制 |
| **误报（False Positive）** | 网站加载慢导致元素暂时不存在 | 🟡 中 | 支持超时、重试、等待条件；用户标记误报训练模型 |
| **隐私合规风险** | 页面内容可能含敏感数据 | 🟢 低 | 默认不上传页面正文；截图默认关闭；提供隐私白皮书 |
| **成本失控** | 云端 Headless 浏览器测试成本高 | 🟡 中 | MVP 限制测试频率和页面数量；优先推广 GitHub Actions 自带算力；Pro 版限量 |
| **Chrome Web Store 审核** | 插件上架被拒 | 🟡 中 | 严格遵守 MV3 规范；权限最小化；提供完整隐私政策 |
| **竞品跟进** | 大厂或同类工具快速复制 | 🟢 低 | 深耕用户社区；持续 AI 差异化；开源核心建立生态 |
| **MVP 范围蔓延** | 试图做大而全 | 🟡 中 | 严格执行 MVP 清单；按 OKR 评估；v1.0 之前不做 F12-F16 |

---

## 12. 竞品分析

| 类别 | 代表产品 | 与 ScriptGuard 的关系 | ScriptGuard 差异化 |
|---|---|---|---|
| **用户脚本管理器** | Tampermonkey, Violentmonkey, Greasemonkey | 协同（不替代） | 不与它们竞争脚本生态，专做"脚本写完以后"的健康监控 |
| **网站可用性监控** | UptimeRobot, Checkly | 互补 | 面向**脚本级别**而非站点级别；深度集成浏览器环境 |
| **E2E 测试框架** | Playwright, Cypress, Puppeteer | 互补 | 零代码可视化断言；零服务器即可用；普通用户友好 |
| **APM 工具** | Sentry, Datadog | 借鉴方法论 | 专门针对"用户脚本 + 网页改版"场景；轻量级、无侵入 |
| **Tampermonkey 自身** | 内置日志 | 补充 | Tampermonkey 只记录错误，无聚合视图/告警/版本管理/自动测试 |
| **同类新工具** | Userscript Health Check (国外小工具) | 竞品 | 还未形成完整产品；我们抢先做完整 MVP 并开源 |

**ScriptGuard 护城河**：

1. **与浏览器深度集成**：零服务器、本地隐私优先
2. **针对脚本生命周期设计**：从开发→部署→监控→告警→修复的完整闭环
3. **多模式部署**：本地 / 云端 / GitHub Actions 灵活选择
4. **真实用户遥测 + AI 辅助**：构成"万人拾柴"的主动防御
5. **开源核心**：建立社区信任与生态

---

## 13. 术语表

| 术语 | 定义 |
|---|---|
| **用户脚本 / Userscript** | 在浏览器中运行、修改网页行为的 JavaScript 代码，通常由 Tampermonkey 等工具管理 |
| **健康检测 / Health Check** | 验证脚本是否正常运行的自动化测试过程 |
| **Manifest V3 (MV3)** | Chrome 浏览器插件的最新规范版本，引入了更严格的权限和后台运行限制 |
| **Service Worker (SW)** | MV3 中浏览器插件的后台脚本运行环境，会在空闲时休眠 |
| **Content Script** | 注入到目标网页上下文中运行的脚本，可访问页面 DOM |
| **ISOLATED World** | Content Script 的隔离执行环境，不污染页面全局 JS 作用域 |
| **DOM 快照** | 某时刻页面关键 DOM 结构的序列化记录，用于后续 diff 分析 |
| **Webhook** | 通过 HTTP POST 向指定 URL 发送事件通知的机制 |
| **Cron** | 定时任务调度表达式，用于周期性执行 |
| **Headless Browser** | 无界面的浏览器，常用于自动化测试和监控（Playwright / Puppeteer） |
| **SemVer** | 语义化版本号规范 `MAJOR.MINOR.PATCH` |
| **Telemetry** | 遥测，真实用户使用中的数据上报机制 |
| **E2E (End-to-End) Testing** | 端到端测试，模拟用户真实操作验证系统行为 |
| **APM** | Application Performance Management，应用性能监控 |
| **SLA** | Service Level Agreement，服务等级协议 |
| **NPS** | Net Promoter Score，净推荐值，衡量用户推荐意愿 |
| **GA** | General Availability，正式发布 |
| **NPS / P1 / P2** | 需求优先级（P0 最高，P3 最低） |

---

*ScriptGuard PRD v1.0 · 2026-06-17*
