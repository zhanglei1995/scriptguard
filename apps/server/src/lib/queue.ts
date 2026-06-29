/**
 * BullMQ 任务队列基础设施
 * 关联: SG-035 / TDD §2.3.2 / §3.2.3 / §12.4
 *
 * Server 只负责投递 test-runs 任务、管理 repeatable jobs、监听 runner 完成事件。
 * Playwright 执行由 apps/runner 中的独立 Worker 消费同名队列完成。
 */
import { Queue, Job, QueueEvents, RepeatOptions, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config.js';
import { logger } from './logger.js';
import type { TestRunJobData, TestRunJobResult } from '@scriptguard/shared';

// --- Redis Connection ---

const REDIS_URL = config.REDIS_URL;

let connection: IORedis | null = null;

function asBullConnection(redis: IORedis): ConnectionOptions {
  return redis as unknown as ConnectionOptions;
}

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy(times: number) {
        return Math.min(times * 200, 5000);
      },
    });
    connection.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });
    connection.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  return connection;
}

// --- Queue Names ---

export const QUEUES = {
  TEST_RUNS: 'test-runs',
} as const;

export type { TestRunJobData, TestRunJobResult };

// --- Queue Factory ---

const queues = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    const q = new Queue(name, {
      connection: asBullConnection(getRedisConnection()),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    queues.set(name, q);
  }
  return queues.get(name)!;
}

export function getTestRunQueue(): Queue<TestRunJobData, TestRunJobResult> {
  return getQueue(QUEUES.TEST_RUNS) as Queue<TestRunJobData, TestRunJobResult>;
}

// --- Job Operations ---

export async function addTestRunJob(
  data: TestRunJobData,
): Promise<Job<TestRunJobData, TestRunJobResult>> {
  const queue = getTestRunQueue();
  const job = await queue.add('test-run', data);
  logger.info({ jobId: job.id, scriptId: data.scriptId }, 'Test run job added');
  return job;
}

export async function addDelayedTestRun(
  data: TestRunJobData,
  delayMs: number,
): Promise<Job<TestRunJobData, TestRunJobResult>> {
  const queue = getTestRunQueue();
  return queue.add('test-run', data, { delay: delayMs });
}

// --- Repeatable Jobs (Cron) ---

export async function createRepeatableTestRun(opts: {
  scheduleId: string;
  jobId?: string;
  cron: string;
  data: TestRunJobData;
}): Promise<string> {
  const queue = getTestRunQueue();
  const repeatOptions: RepeatOptions = {
    pattern: opts.cron,
    tz: 'UTC',
  };
  const job = await queue.add('repeatable-test-run', opts.data, {
    repeat: repeatOptions,
    jobId: opts.jobId ?? `schedule:${opts.scheduleId}`,
  });
  logger.info({ scheduleId: opts.scheduleId, cron: opts.cron }, 'Repeatable test run created');
  return job.id!;
}

export async function removeRepeatableTestRun(scheduleId: string): Promise<void> {
  const queue = getTestRunQueue();
  const jobId = `schedule:${scheduleId}`;
  const repeatableJobs = await queue.getRepeatableJobs();
  const target = repeatableJobs.find((j) => j.id === jobId);
  if (target) {
    await queue.removeRepeatableByKey(target.key);
    logger.info({ scheduleId }, 'Repeatable test run removed');
  }
}

export async function listRepeatableTestRuns() {
  const queue = getTestRunQueue();
  const repeatableJobs = await queue.getRepeatableJobs();
  return repeatableJobs
    .filter((j) => j.name === 'repeatable-test-run')
    .map((j) => ({
      id: j.id ?? '',
      scheduleId: j.id?.startsWith('schedule:') ? j.id.slice('schedule:'.length) : '',
      cron: j.pattern ?? '',
      nextRun: j.next ?? 0,
      key: j.key,
    }));
}

// --- Queue Events ---

let queueEventsInstance: QueueEvents | null = null;

export function getQueueEvents(): QueueEvents {
  if (!queueEventsInstance) {
    queueEventsInstance = new QueueEvents(QUEUES.TEST_RUNS, {
      connection: asBullConnection(getRedisConnection()),
    });
  }
  return queueEventsInstance;
}

export interface TestRunCompletionEvent {
  jobId: string;
  data: TestRunJobData;
  result: TestRunJobResult;
}

export type StopQueueListener = () => Promise<void>;

function normalizeResult(returnvalue: unknown): TestRunJobResult {
  if (returnvalue && typeof returnvalue === 'object') {
    const value = returnvalue as Partial<TestRunJobResult>;
    return {
      status: value.status ?? 'error',
      durationMs: value.durationMs ?? 0,
      failedRules: value.failedRules ?? [],
      screenshotUrl: value.screenshotUrl,
      errorMessage: value.errorMessage,
    };
  }
  return {
    status: 'error',
    durationMs: 0,
    failedRules: [],
    errorMessage: 'Runner completed without a valid result',
  };
}

export function registerTestRunResultHandler(
  handler: (event: TestRunCompletionEvent) => Promise<void>,
): StopQueueListener {
  const events = getQueueEvents();
  const queue = getTestRunQueue();

  const onCompleted = async ({ jobId, returnvalue }: { jobId: string; returnvalue: unknown }) => {
    const job = await queue.getJob(jobId);
    if (!job) {
      logger.warn({ jobId }, 'Completed test-run job not found');
      return;
    }
    await handler({ jobId, data: job.data, result: normalizeResult(returnvalue) });
  };

  const onFailed = async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    const job = await queue.getJob(jobId);
    if (!job) {
      logger.warn({ jobId, failedReason }, 'Failed test-run job not found');
      return;
    }
    await handler({
      jobId,
      data: job.data,
      result: {
        status: 'error',
        durationMs: 0,
        failedRules: [],
        errorMessage: failedReason,
      },
    });
  };

  events.on('completed', onCompleted);
  events.on('failed', onFailed);
  logger.info('Test run result listener registered');

  return async () => {
    events.off('completed', onCompleted);
    events.off('failed', onFailed);
    logger.info('Test run result listener unregistered');
  };
}

// --- Queue Stats ---

export async function getQueueStats() {
  const queue = getTestRunQueue();
  const counts = await queue.getJobCounts();
  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
    paused: counts.paused,
  };
}

// --- Initialization ---

export async function initQueue(): Promise<void> {
  try {
    getRedisConnection();
    logger.info('BullMQ queue initialized');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize BullMQ queue');
  }
}

export function isQueueReady(): boolean {
  return connection !== null && connection.status === 'ready';
}

// --- Shutdown ---

export async function closeQueue(): Promise<void> {
  if (queueEventsInstance) {
    await queueEventsInstance.close();
    queueEventsInstance = null;
  }
  for (const q of queues.values()) {
    await q.close();
  }
  queues.clear();
  if (connection) {
    await connection.quit();
    connection = null;
  }
  logger.info('BullMQ queue closed');
}
