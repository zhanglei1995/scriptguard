/**
 * SG-034 POC: Test Run Queue
 *
 * Defines the queue and job types for script health check test runs.
 * Maps directly to ScriptGuard's cloud test scheduling flow (TDD §2.3.2).
 */
import { Queue, Job } from 'bullmq';
import { createQueue } from './connection.js';

export interface TestRunJobData {
  scheduleId: string;
  scriptId: string;
  url: string;
  cookies?: string;
  timeout?: number;
  rules: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
  }>;
}

export interface TestRunJobResult {
  status: 'passed' | 'failed' | 'degraded' | 'timeout' | 'error';
  durationMs: number;
  failedRules: string[];
  screenshotUrl?: string;
  errorMessage?: string;
}

const QUEUE_NAME = 'test-runs';

let queueInstance: Queue | null = null;

export function getTestRunQueue(): Queue {
  if (!queueInstance) {
    queueInstance = createQueue(QUEUE_NAME);
  }
  return queueInstance;
}

export async function addTestRunJob(data: TestRunJobData): Promise<Job<TestRunJobData>> {
  const queue = getTestRunQueue();
  return queue.add('test-run', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });
}

export async function addDelayedTestRun(
  data: TestRunJobData,
  delayMs: number,
): Promise<Job<TestRunJobData>> {
  const queue = getTestRunQueue();
  return queue.add('test-run', data, {
    delay: delayMs,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

export { QUEUE_NAME as TEST_RUN_QUEUE };
