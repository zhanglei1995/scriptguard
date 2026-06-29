/**
 * SG-034 POC: BullMQ Task Queue - Main Entry Point
 *
 * Demonstrates:
 * 1. Queue + Worker setup
 * 2. One-off job processing
 * 3. Repeatable jobs (cron scheduling)
 * 4. Queue events (observability)
 *
 * Run: pnpm --filter @scriptguard/server tsx src/spike/bullmq-poc/poc.ts
 */
import { getTestRunQueue, addTestRunJob, TestRunJobData } from './test-run-queue.js';
import { getTestRunWorker } from './test-run-worker.js';
import {
  createRepeatableTestRun,
  listRepeatableTestRuns,
  removeRepeatableTestRun,
  ScheduleConfig,
} from './repeatable-jobs.js';
import { startEventListeners, stopEventListeners } from './events.js';

async function main() {
  console.log('=== SG-034 BullMQ POC ===\n');

  // 1. Initialize queue and worker
  const queue = getTestRunQueue();
  const worker = getTestRunWorker();

  // Wait for connections
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 2. Start event listeners
  startEventListeners();

  // 3. Add a one-off test run job
  console.log('\n--- One-off Test Run ---');
  const jobData: TestRunJobData = {
    scheduleId: 'schedule-001',
    scriptId: 'script-abc-123',
    url: 'https://example.com/test-page',
    rules: [
      { id: 'rule-1', type: 'selector_exists', config: { selector: '[data-testid="submit"]' } },
      { id: 'rule-2', type: 'url_match', config: { pattern: 'https://example.com/*' } },
    ],
  };

  const job = await addTestRunJob(jobData);
  console.log(`Added one-off job: ${job.id}`);

  // 4. Create a repeatable job (every 5 minutes)
  console.log('\n--- Repeatable Job (Cron) ---');
  const scheduleConfig: ScheduleConfig = {
    scheduleId: 'schedule-002',
    scriptId: 'script-xyz-789',
    url: 'https://example.com/dashboard',
    cron: '*/5 * * * *', // Every 5 minutes
    rules: [{ id: 'rule-3', type: 'selector_visible', config: { selector: '.dashboard-chart' } }],
    enabled: true,
  };

  await createRepeatableTestRun(scheduleConfig);

  // 5. List all repeatable jobs
  const repeatables = await listRepeatableTestRuns();
  console.log('\nRepeatable jobs:', repeatables);

  // 6. Wait for job completion
  console.log('\n--- Waiting for jobs to process ---');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // 7. Get queue stats
  const counts = await queue.getJobCounts();
  console.log('\nQueue stats:', counts);

  // 8. Cleanup
  console.log('\n--- Cleanup ---');
  await removeRepeatableTestRun('schedule-002');
  stopEventListeners();
  await worker.close();
  await queue.close();

  console.log('\n=== POC Complete ===');
}

main().catch((err) => {
  console.error('POC failed:', err);
  process.exit(1);
});
