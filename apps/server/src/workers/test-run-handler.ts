import { eq, and } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { testRuns, alerts, scripts } from '@scriptguard/db'
import { logger } from '../lib/logger.js'
import {
  createTestRunWorker,
  type TestRunJobData,
  type TestRunJobResult,
} from '../lib/queue.js'

function getAlertLevel(
  status: TestRunJobResult['status']
): 'low' | 'medium' | 'high' | 'critical' {
  switch (status) {
    case 'failed':
      return 'high'
    case 'degraded':
      return 'medium'
    case 'timeout':
      return 'high'
    default:
      return 'low'
  }
}

export function startTestRunHandler(): void {
  createTestRunWorker(async (job) => {
    const { scriptId, scheduleId } = job.data
    logger.info({ jobId: job.id, scriptId }, 'Processing test run result')

    // The job result is set by the runner worker
    // This handler persists the result to the database
    const result = job.returnvalue as TestRunJobResult | undefined

    if (!result) {
      // Job completed but no result from runner - treat as error
      await db.insert(testRuns).values({
        scriptId,
        scheduleId,
        status: 'failed',
        url: job.data.url,
        startedAt: new Date(),
        endedAt: new Date(),
        durationMs: 0,
        result: { error: 'No result from runner' },
      })

      return { status: 'failed', durationMs: 0, failedRules: [], errorMessage: 'No result from runner' }
    }

    const statusMap: Record<string, 'healthy' | 'degraded' | 'failed' | 'unknown'> = {
      passed: 'healthy',
      failed: 'failed',
      degraded: 'degraded',
      timeout: 'failed',
      error: 'failed',
    }

    const [run] = await db.insert(testRuns).values({
      scriptId,
      scheduleId: scheduleId ?? undefined,
      status: statusMap[result.status] ?? 'unknown',
      url: job.data.url,
      startedAt: new Date(),
      endedAt: new Date(),
      durationMs: result.durationMs,
      result: {
        failedRules: result.failedRules,
        errorMessage: result.errorMessage,
      },
      screenshotUrl: result.screenshotUrl,
    }).returning()

    if (run && (result.status === 'failed' || result.status === 'degraded')) {
      const [script] = await db
        .select({ userId: scripts.userId })
        .from(scripts)
        .where(eq(scripts.id, scriptId))
        .limit(1)

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
          },
        })

        logger.info(
          { runId: run.id, scriptId, status: result.status },
          'Alert created for failed/degraded run'
        )
      }
    }

    return result
  })

  logger.info('Test run handler started')
}

export async function stopTestRunHandler(): Promise<void> {
  const { getTestRunWorker, closeQueue } = await import('../lib/queue.js')
  const worker = getTestRunWorker()
  if (worker) {
    await worker.close()
  }
  await closeQueue()
}
