# SG-034 | 任务队列方案对比报告

> Spike 产出文档 · 2026-06-19

---

## 1. 对比概览

| 维度         | BullMQ                       | Inngest                          | Trigger.dev                 |
| ------------ | ---------------------------- | -------------------------------- | --------------------------- |
| **类型**     | 任务队列库                   | 持久执行平台                     | 持久执行平台                |
| **运行模型** | 自托管（Redis）              | 云托管 / 自托管                  | 云托管 / 自托管             |
| **语言**     | Node.js / Python / Go / Java | TypeScript / Python / Go         | TypeScript                  |
| **依赖**     | Redis 7+                     | Inngest Server（自托管）或云服务 | Trigger.dev Server 或云服务 |
| **开源**     | ✅ MIT                       | ✅ MIT（核心引擎）               | ✅ AGPLv3                   |

---

## 2. 功能对比

### 2.1 核心能力

| 功能               | BullMQ                | Inngest             | Trigger.dev        |
| ------------------ | --------------------- | ------------------- | ------------------ |
| 延迟任务           | ✅                    | ✅                  | ✅                 |
| 定时任务（Cron）   | ✅ Repeatable Jobs    | ✅ Cron Triggers    | ✅ Scheduled Tasks |
| 重试               | ✅ 指数退避           | ✅ Step 级重试      | ✅ Task 级重试     |
| 并发控制           | ✅ Worker 并发限制    | ✅ Concurrency 原语 | ✅ Queue 并发      |
| 限流               | ✅ Rate Limiter       | ✅ Throttle 原语    | ✅ 速率限制        |
| 优先级队列         | ✅                    | ❌                  | ❌                 |
| 依赖链（父子任务） | ✅ FlowProducer       | ✅ Step 链          | ✅ Wait            |
| 状态机 / 持久执行  | ❌ 需自行实现         | ✅ Step 级检查点    | ✅ 内建            |
| 事件驱动           | ✅ Events             | ✅ Events（核心）   | ✅ Triggers        |
| Dashboard / 可观测 | ✅ Bull Board（开源） | ✅ 内建 Trace UI    | ✅ 内建 Dashboard  |
| 任务去重           | ✅ Job ID 去重        | ❌                  | ❌                 |
| Rate Limiting      | ✅ 内建               | ✅ Flow Control     | ✅ 内建            |

### 2.2 ScriptGuard 场景适配

| 需求                      | BullMQ                    | Inngest             | Trigger.dev         |
| ------------------------- | ------------------------- | ------------------- | ------------------- |
| Cron 调度 Playwright 测试 | ✅ Repeatable Job         | ✅ Cron Trigger     | ✅ Scheduled Task   |
| 测试结果处理              | ✅ Worker                 | ✅ Function Step    | ✅ Task             |
| 通知推送                  | ✅ 后台任务               | ✅ Function         | ✅ Task             |
| 多租户并发隔离            | ✅ Queue per tenant       | ✅ Concurrency keys | ✅ Queue per tenant |
| 测试进度实时推送          | ⚠️ 需 Redis PubSub 或 SSE | ✅ Realtime API     | ✅ Realtime API     |
| 离线 / 自托管             | ✅ 纯 Redis               | ✅ 开源自托管       | ✅ 开源自托管       |

---

## 3. 性能对比

| 指标           | BullMQ                       | Inngest                 | Trigger.dev             |
| -------------- | ---------------------------- | ----------------------- | ----------------------- |
| **吞吐量**     | 极高（Redis 原生）           | 高（云托管）            | 高（自托管）            |
| **延迟**       | < 5ms（Redis 本地）          | 50-200ms（云）          | 50-200ms（云）          |
| **内存占用**   | 低（Redis 负责存储）         | 中（需 Inngest Server） | 中（需 Trigger Server） |
| **水平扩展**   | ✅ 多 Worker + Redis Cluster | ✅ 云自动扩缩           | ✅ 自托管可扩缩         |
| **Redis 依赖** | 强（核心存储）               | 无（平台托管）          | 无（平台托管）          |

> **关键点**：BullMQ 的延迟和吞吐直接取决于 Redis 性能，本地部署时延迟极低。Inngest/Trigger.dev 的延迟取决于云平台或自托管实例。

---

## 4. 成本对比

### 4.1 自托管成本

| 组件                  | BullMQ                    | Inngest                | Trigger.dev      |
| --------------------- | ------------------------- | ---------------------- | ---------------- |
| Redis                 | ✅ 已有（docker-compose） | 不需要                 | 不需要           |
| 额外服务              | 无                        | Inngest Server         | Trigger Server   |
| 运维复杂度            | 低（仅 Redis）            | 中（额外服务）         | 中（额外服务）   |
| **月成本估算（MVP）** | **$0**（Redis 已有）      | **$0-75**（Hobby/Pro） | **$0**（自托管） |

### 4.2 云托管成本

| 方案        | 免费额度                 | 付费起步                   |
| ----------- | ------------------------ | -------------------------- |
| BullMQ      | 开源免费，Redis 自行付费 | Redis: ~$5-15/月（小规模） |
| Inngest     | 50k executions/月        | $75/月（1M executions）    |
| Trigger.dev | 自托管免费               | Cloud: $50/月起步          |

### 4.3 ScriptGuard 估算

假设 MVP 阶段：

- 100 个用户 × 10 个脚本 × 每日 1 次测试 = 1,000 次测试/天 = 30,000 次/月
- 每次测试 ~3 个步骤（调度 → 执行 → 通知）

| 方案                  | 月成本                             |
| --------------------- | ---------------------------------- |
| **BullMQ**            | $0（Redis 已在 docker-compose 中） |
| **Inngest Cloud**     | $0（Hobby: 50k executions 免费）   |
| **Trigger.dev Cloud** | $0-50                              |

---

## 5. 生态与社区

| 维度                | BullMQ               | Inngest         | Trigger.dev         |
| ------------------- | -------------------- | --------------- | ------------------- |
| **GitHub Stars**    | ~15k                 | ~7k             | ~10k                |
| **npm 周下载**      | ~500k                | ~50k            | ~30k                |
| **维护团队**        | Taskforce.sh         | Inngest Inc     | Trigger.dev Inc     |
| **商业支持**        | Taskforce.sh（付费） | Inngest（付费） | Trigger.dev（付费） |
| **文档质量**        | ⭐⭐⭐⭐             | ⭐⭐⭐⭐        | ⭐⭐⭐⭐            |
| **Playwright 集成** | 需自行封装           | 有官方示例      | 有官方扩展          |

---

## 6. 风险评估

| 风险               | BullMQ         | Inngest            | Trigger.dev        |
| ------------------ | -------------- | ------------------ | ------------------ |
| **供应商锁定**     | ✅ 无（纯库）  | ⚠️ 中（平台依赖）  | ⚠️ 中（平台依赖）  |
| **Redis 单点故障** | ⚠️ 需 Redis HA | ✅ 平台托管        | ✅ 平台托管        |
| **学习曲线**       | 低（API 简单） | 中（Step 模型）    | 中（Task 模型）    |
| **迁移成本**       | —              | 高（依赖平台 API） | 高（依赖平台 API） |
| **长期维护**       | ✅ 社区活跃    | ✅ 融资充足        | ✅ 融资充足        |

---

## 7. 与现有架构兼容性

| 维度               | BullMQ                | Inngest                | Trigger.dev            |
| ------------------ | --------------------- | ---------------------- | ---------------------- |
| **Fastify 集成**   | ✅ 原生 Node.js       | ✅ HTTP serve          | ✅ HTTP serve          |
| **Docker Compose** | ✅ 仅需 Redis（已有） | ⚠️ 需加 Inngest Server | ⚠️ 需加 Trigger Server |
| **Drizzle ORM**    | ✅ 无冲突             | ✅ 无冲突              | ✅ 无冲突              |
| **TypeScript**     | ✅ 完整类型           | ✅ 完整类型            | ✅ 完整类型            |
| **现有 Redis**     | ✅ 直接复用           | ❌ 不需要 Redis        | ❌ 不需要 Redis        |

---

## 8. 决策

### 🏆 推荐方案：BullMQ

**理由**：

1. **零额外成本**：Redis 已在 docker-compose.yml 中，无需新增服务
2. **无供应商锁定**：纯库，不依赖外部平台
3. **TDD 已选型**：TDD §1 明确选择 BullMQ + Redis，且 TDD §12.4 已有 BullMQ 指标定义
4. **功能完备**：Cron、重试、并发、优先级队列全部内建
5. **性能最优**：Redis 本地延迟 < 5ms，适合实时测试调度
6. **生态成熟**：15k stars，500k 周下载，文档完善
7. **迁移灵活**：如果未来需要，可以平滑迁移到 Inngest/Trigger.dev

**风险缓解**：

- Redis 单点：使用 Redis Sentinel 或 Docker restart policy
- 监控：通过 BullMQ 的 QueueEvents + Prometheus 暴露指标

### 不推荐 Inngest / Trigger.dev 的原因

1. 额外运维负担（需运行 Server 进程）
2. 云托管方案有供应商锁定风险
3. 自托管方案增加部署复杂度
4. TDD 已明确选择 BullMQ，变更需充分理由

---

## 9. 后续行动

1. ✅ 创建 `apps/server/src/lib/queue/` 目录
2. ✅ 实现 BullMQ Queue + Worker 基础设施
3. ✅ 实现 Repeatable Job（定时测试调度）
4. ✅ 编写单元测试
5. → SG-035 正式引入 BullMQ 任务队列基础设施

---

_Generated by SG-034 Spike · 2026-06-19_
