import { eq } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { testRuns, alerts, scripts } from '@scriptguard/db';
import { logger } from '../lib/logger.js';
import {
  registerTestRunResultHandler,
  type StopQueueListener,
  type TestRunCompletionEvent,
  type TestRunJobResult,
} from '../lib/queue.js';

let stopListening: StopQueueListener | null = null;

function getAlertLevel(status: TestRunJobResult['status']): 'low' | 'medium' | 'high' | 'critical' {
  switch (status) {
    case 'failed':
      return 'high';
    case 'degraded':
      return 'medium';
    case 'timeout':
      return 'high';
    default:
      return 'low';
  }
}

async function persistTestRunResult(event: TestRunCompletionEvent): Promise<void> {
  const { data, result, jobId } = event;
  const { scriptId, scheduleId } = data;
  logger.info({ jobId, scriptId, status: result.status }, 'Persisting test run result');

  const statusMap: Record<string, 'healthy' | 'degraded' | 'failed' | 'unknown'> = {
    passed: 'healthy',
    failed: 'failed',
    degraded: 'degraded',
    timeout: 'failed',
    error: 'failed',
  };

  const [run] = await db
    .insert(testRuns)
    .values({
      scriptId,
      scheduleId: scheduleId ?? undefined,
      status: statusMap[result.status] ?? 'unknown',
      url: data.url,
      startedAt: new Date(),
      endedAt: new Date(),
      durationMs: result.durationMs,
      result: {
        failedRules: result.failedRules,
        errorMessage: result.errorMessage,
        jobId,
      },
      screenshotUrl: result.screenshotUrl,
    })
    .returning();

  if (run && (result.status === 'failed' || result.status === 'degraded')) {
    const [script] = await db
      .select({ userId: scripts.userId })
      .from(scripts)
      .where(eq(scripts.id, scriptId))
      .limit(1);

    if (script) {
      await db.insert(alerts).values({
        userId: script.userId,
        scriptId,
        runId: run.id,
        level: getAlertLevel(result.status),
        message: `Script test ${result.status}: ${result.failedRules.length} rule(s) failed`,
        payload: {
          status: result.status,
          failedRules: result.failedRules,
          errorMessage: result.errorMessage,
          jobId,
        },
      });

      logger.info(
        { runId: run.id, scriptId, status: result.status },
        'Alert created for failed/degraded run',
      );
    }
  }
}

export function startTestRunHandler(): void {
  if (stopListening) return;
  stopListening = registerTestRunResultHandler(persistTestRunResult);
  logger.info('Test run result handler started');
}

export async function stopTestRunHandler(): Promise<void> {
  if (stopListening) {
    await stopListening();
    stopListening = null;
  }
}
