/**
 * SG-034 POC: Test Run Worker
 *
 * Processes test-run jobs from the queue.
 * In production, this would launch Playwright to run health checks (TDD §3.2.3).
 */
import { Job, Worker } from 'bullmq';
import { createWorker } from './connection.js';
import { TestRunJobData, TestRunJobResult, TEST_RUN_QUEUE } from './test-run-queue.js';

let workerInstance: Worker | null = null;

export async function processTestRun(job: Job<TestRunJobData>): Promise<TestRunJobResult> {
  const { scriptId, url, rules, timeout = 30000 } = job.data;
  const startedAt = Date.now();

  console.log(`[Worker] Processing test run for script ${scriptId} on ${url}`);

  // POC: Simulate Playwright test execution
  // In production, this would be replaced with actual Playwright code (TDD §3.2.3)
  await simulatePlaywrightExecution(url, timeout);

  // POC: Simulate rule checking
  const failedRules: string[] = [];
  for (const rule of rules) {
    const passed = await simulateRuleCheck(rule);
    if (!passed) {
      failedRules.push(rule.id);
    }
  }

  const durationMs = Date.now() - startedAt;
  const status = failedRules.length === 0 ? 'passed' : 'failed';

  // Report progress
  await job.updateProgress({
    status,
    checkedRules: rules.length,
    failedRules: failedRules.length,
  });

  console.log(`[Worker] Test run completed: ${status} in ${durationMs}ms`);

  return {
    status,
    durationMs,
    failedRules,
  };
}

async function simulatePlaywrightExecution(url: string, timeout: number): Promise<void> {
  // POC: Simulate page load + script injection
  // In production: chromium.launch() → newPage() → goto(url) → addScriptTag()
  const delay = Math.min(Math.random() * 2000 + 500, timeout);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function simulateRuleCheck(rule: { id: string; type: string }): Promise<boolean> {
  // POC: Simulate rule execution
  // In production: page.evaluate() to run check logic
  const delay = Math.random() * 200;
  await new Promise((resolve) => setTimeout(resolve, delay));
  // 90% pass rate for POC
  return Math.random() > 0.1;
}

export function getTestRunWorker(): Worker {
  if (!workerInstance) {
    workerInstance = createWorker(TEST_RUN_QUEUE, processTestRun);

    workerInstance.on('completed', (job) => {
      console.log(`[Worker] Job ${job.id} completed with result:`, job.returnvalue);
    });

    workerInstance.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    workerInstance.on('progress', (job, progress) => {
      console.log(`[Worker] Job ${job.id} progress:`, progress);
    });
  }
  return workerInstance;
}
