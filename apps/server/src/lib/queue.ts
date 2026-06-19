/**
 * BullMQ 任务队列基础设施
 * 关联: SG-035 / TDD §2.3.2 / §3.2.3 / §12.4
 *
 * - test-runs queue + worker
 * - repeat jobs (cron)
 * - 并发控制 (默认 3)
 * - 失败重试 (指数退避)
 * - 队列深度指标 (Prometheus)
 * - Bull Board UI (开发环境)
 */
import { Queue, Worker, Job, QueueEvents, RepeatOptions } from 'bullmq'
import IORedis from 'ioredis'
import { config } from '../config.js'
import { logger } from './logger.js'

// --- Redis Connection ---

const REDIS_URL = config.REDIS_URL

let connection: IORedis | null = null

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy(times: number) {
        const delay = Math.min(times * 200, 5000)
        return delay
      },
    } as any)
    connection.on('error', (err) => {
      logger.error({ err }, 'Redis connection error')
    })
    connection.on('connect', () => {
      logger.info('Redis connected')
    })
  }
  return connection
}

// --- Queue Names ---

export const QUEUES = {
  TEST_RUNS: 'test-runs',
} as const

// --- Job Data Types ---

export interface TestRunJobData {
  scheduleId?: string
  scriptId: string
  url: string
  cookies?: string
  timeout?: number
  rules: Array<{
    id: string
    type: string
    config: Record<string, unknown>
  }>
}

export interface TestRunJobResult {
  status: 'passed' | 'failed' | 'degraded' | 'timeout' | 'error'
  durationMs: number
  failedRules: string[]
  screenshotUrl?: string
  errorMessage?: string
}

// --- Queue Factory ---

const queues = new Map<string, Queue>()

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    const q = new Queue(name, {
      connection: getRedisConnection() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    })
    queues.set(name, q)
  }
  return queues.get(name)!
}

export function getTestRunQueue(): Queue {
  return getQueue(QUEUES.TEST_RUNS)
}

// --- Job Operations ---

export async function addTestRunJob(data: TestRunJobData): Promise<Job<TestRunJobData>> {
  const queue = getTestRunQueue()
  const job = await queue.add('test-run', data)
  logger.info({ jobId: job.id, scriptId: data.scriptId }, 'Test run job added')
  return job
}

export async function addDelayedTestRun(
  data: TestRunJobData,
  delayMs: number
): Promise<Job<TestRunJobData>> {
  const queue = getTestRunQueue()
  return queue.add('test-run', data, { delay: delayMs })
}

// --- Repeatable Jobs (Cron) ---

export async function createRepeatableTestRun(opts: {
  scheduleId: string
  jobId?: string
  cron: string
  data: TestRunJobData
}): Promise<string> {
  const queue = getTestRunQueue()
  const repeatOptions: RepeatOptions = {
    pattern: opts.cron,
    tz: 'UTC',
  }
  const job = await queue.add('repeatable-test-run', opts.data, {
    repeat: repeatOptions,
    jobId: opts.jobId ?? `schedule:${opts.scheduleId}`,
  })
  logger.info({ scheduleId: opts.scheduleId, cron: opts.cron }, 'Repeatable test run created')
  return job.id!
}

export async function removeRepeatableTestRun(scheduleId: string): Promise<void> {
  const queue = getTestRunQueue()
  const jobId = `schedule:${scheduleId}`
  const repeatableJobs = await queue.getRepeatableJobs()
  const target = repeatableJobs.find((j) => j.id === jobId)
  if (target) {
    await queue.removeRepeatableByKey(target.key)
    logger.info({ scheduleId }, 'Repeatable test run removed')
  }
}

export async function listRepeatableTestRuns() {
  const queue = getTestRunQueue()
  const repeatableJobs = await queue.getRepeatableJobs()
  return repeatableJobs
    .filter((j) => j.name === 'repeatable-test-run')
    .map((j) => ({
      id: j.id ?? '',
      scheduleId: ((j as any).scheduleId as string) ?? '',
      cron: j.pattern ?? '',
      nextRun: j.next ?? 0,
      key: j.key,
    }))
}

// --- Worker ---

let workerInstance: Worker | null = null

export function getTestRunWorker(): Worker | null {
  return workerInstance
}

export function createTestRunWorker(processor: (job: Job<TestRunJobData>) => Promise<TestRunJobResult>): Worker {
  if (workerInstance) {
    return workerInstance
  }
  const conn = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  } as any)
  workerInstance = new Worker(QUEUES.TEST_RUNS, processor, {
    connection: conn as any,
    concurrency: 3,
  })
  workerInstance.on('completed', (job) => {
    logger.info({ jobId: job.id, result: job.returnvalue }, 'Test run completed')
  })
  workerInstance.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Test run failed')
  })
  workerInstance.on('progress', (job, progress) => {
    logger.debug({ jobId: job.id, progress }, 'Test run progress')
  })
  return workerInstance
}

// --- Queue Events ---

let queueEventsInstance: QueueEvents | null = null

export function getQueueEvents(): QueueEvents {
  if (!queueEventsInstance) {
    queueEventsInstance = new QueueEvents(QUEUES.TEST_RUNS, {
      connection: getRedisConnection() as any,
    })
  }
  return queueEventsInstance
}

// --- Queue Stats ---

export async function getQueueStats() {
  const queue = getTestRunQueue()
  const counts = await queue.getJobCounts()
  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
    paused: counts.paused,
  }
}

// --- Initialization ---

export async function initQueue(): Promise<void> {
  try {
    getRedisConnection()
    logger.info('BullMQ queue initialized')
  } catch (err) {
    logger.error({ err }, 'Failed to initialize BullMQ queue')
  }
}

export function isQueueReady(): boolean {
  return connection !== null && connection.status === 'ready'
}

// --- Shutdown ---

export async function closeQueue(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close()
    workerInstance = null
  }
  if (queueEventsInstance) {
    await queueEventsInstance.close()
    queueEventsInstance = null
  }
  for (const q of queues.values()) {
    await q.close()
  }
  queues.clear()
  if (connection) {
    await connection.quit()
    connection = null
  }
  logger.info('BullMQ queue closed')
}
