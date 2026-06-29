/**
 * SG-034 POC: BullMQ Task Queue Tests
 *
 * Tests the queue infrastructure with Vitest.
 * Uses a real Redis connection for integration testing.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Queue, Worker, Job } from 'bullmq';
import {
  getTestRunQueue,
  addTestRunJob,
  addDelayedTestRun,
  TestRunJobData,
  TEST_RUN_QUEUE,
} from './test-run-queue.js';
import { processTestRun } from './test-run-worker.js';
import {
  createRepeatableTestRun,
  listRepeatableTestRuns,
  removeRepeatableTestRun,
  ScheduleConfig,
} from './repeatable-jobs.js';
import { createQueue, createWorker } from './connection.js';

beforeAll(async () => {
  // Verify Redis is available
  const queue = createQueue('test-connection-check');
  await queue.add('ping', {});
  await queue.obliterate({ force: true });
  await queue.close();
});

beforeEach(async () => {
  const queue = createQueue(TEST_RUN_QUEUE);
  await queue.obliterate({ force: true });
  await queue.close();
});

function createTestJobData(overrides?: Partial<TestRunJobData>): TestRunJobData {
  return {
    scheduleId: 'test-schedule-001',
    scriptId: 'test-script-001',
    url: 'https://example.com/test',
    rules: [{ id: 'rule-1', type: 'selector_exists', config: { selector: '#submit' } }],
    ...overrides,
  };
}

describe('Test Run Queue', () => {
  it('should add a job to the queue', async () => {
    const queue = getTestRunQueue();
    const data = createTestJobData();
    const job = await addTestRunJob(data);

    expect(job.id).toBeDefined();
    expect(job.data.scriptId).toBe('test-script-001');

    await queue.close();
  });

  it('should add a delayed job', async () => {
    const queue = getTestRunQueue();
    const data = createTestJobData();
    const job = await addDelayedTestRun(data, 5000);

    expect(job.id).toBeDefined();
    expect(job.opts.delay).toBe(5000);

    await queue.close();
  });

  it('should process a job with worker', async () => {
    const queue = getTestRunQueue();
    const data = createTestJobData();

    const result = await new Promise<any>((resolve) => {
      const worker = createWorker(TEST_RUN_QUEUE, async (job: Job<TestRunJobData>) => {
        return processTestRun(job);
      });

      worker.on('completed', (job, result) => {
        resolve(result);
      });

      addTestRunJob(data);
    });

    expect(result).toBeDefined();
    expect(result.status).toMatch(/^(passed|failed|degraded)$/);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(Array.isArray(result.failedRules)).toBe(true);

    await queue.close();
  }, 10000);
});

describe('Repeatable Jobs', () => {
  it('should create a repeatable job', async () => {
    const config: ScheduleConfig = {
      scheduleId: 'schedule-repeat-001',
      scriptId: 'script-repeat-001',
      url: 'https://example.com/repeat',
      cron: '*/10 * * * *',
      rules: [{ id: 'rule-r1', type: 'url_match', config: { pattern: '*' } }],
      enabled: true,
    };

    const jobId = await createRepeatableTestRun(config);
    expect(jobId).toBeDefined();

    const repeatables = await listRepeatableTestRuns();
    expect(repeatables.length).toBe(1);
    expect(repeatables[0].scheduleId).toBe('schedule-repeat-001');
    expect(repeatables[0].cron).toBe('*/10 * * * *');

    await removeRepeatableTestRun('schedule-repeat-001');
  });

  it('should remove a repeatable job', async () => {
    const config: ScheduleConfig = {
      scheduleId: 'schedule-repeat-002',
      scriptId: 'script-repeat-002',
      url: 'https://example.com/repeat2',
      cron: '0 9 * * *',
      rules: [],
      enabled: true,
    };

    await createRepeatableTestRun(config);
    let repeatables = await listRepeatableTestRuns();
    expect(repeatables.length).toBe(1);

    await removeRepeatableTestRun('schedule-repeat-002');
    repeatables = await listRepeatableTestRuns();
    expect(repeatables.length).toBe(0);
  });

  it('should list multiple repeatable jobs', async () => {
    const configs: ScheduleConfig[] = [
      {
        scheduleId: 'schedule-multi-001',
        scriptId: 'script-multi-001',
        url: 'https://example.com/multi1',
        cron: '*/5 * * * *',
        rules: [],
        enabled: true,
      },
      {
        scheduleId: 'schedule-multi-002',
        scriptId: 'script-multi-002',
        url: 'https://example.com/multi2',
        cron: '*/15 * * * *',
        rules: [],
        enabled: true,
      },
    ];

    for (const config of configs) {
      await createRepeatableTestRun(config);
    }

    const repeatables = await listRepeatableTestRuns();
    expect(repeatables.length).toBe(2);

    // Cleanup
    for (const config of configs) {
      await removeRepeatableTestRun(config.scheduleId);
    }
  });
});

describe('Job Retry Logic', () => {
  it('should retry failed jobs with exponential backoff', async () => {
    const queue = getTestRunQueue();
    let attempts = 0;

    const worker = createWorker(TEST_RUN_QUEUE, async (job: Job) => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Simulated failure');
      }
      return { status: 'passed', durationMs: 100, failedRules: [] };
    });

    const data = createTestJobData();
    await queue.add('test-run', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 100 },
    });

    const result = await new Promise<any>((resolve) => {
      worker.on('completed', (job, result) => {
        resolve(result);
      });
    });

    expect(attempts).toBe(3);
    expect(result.status).toBe('passed');

    await worker.close();
    await queue.close();
  }, 10000);
});
