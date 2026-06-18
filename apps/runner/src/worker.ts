import { Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'
import pino from 'pino'
import { browserPool } from './browser-pool.js'

const logger = pino({ level: process.env.LOG_LEVEL || 'info', base: { service: 'scriptguard-runner' } })

interface TestRunJobData {
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

interface TestRunJobResult {
  status: 'passed' | 'failed' | 'degraded' | 'timeout' | 'error'
  durationMs: number
  failedRules: string[]
  screenshotUrl?: string
  errorMessage?: string
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const CONTEXT_TIMEOUT = 30_000

async function processTestRun(job: Job<TestRunJobData>): Promise<TestRunJobResult> {
  const startTime = Date.now()
  const browser = await browserPool.acquire()

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })

  try {
    const page = await context.newPage()

    if (job.data.cookies) {
      try {
        const cookies = JSON.parse(job.data.cookies) as Array<{
          name: string
          value: string
          domain?: string
          path?: string
        }>
        await context.addCookies(cookies)
      } catch {
        logger.warn({ jobId: job.id }, 'Failed to parse cookies')
      }
    }

    const timeout = job.data.timeout || CONTEXT_TIMEOUT
    await page.goto(job.data.url, { waitUntil: 'networkidle', timeout })

    await page.evaluate(() => {
      ;(window as any).__scriptguard_errors = []
      window.addEventListener('error', (e: ErrorEvent) => {
        ;(window as any).__scriptguard_errors.push({ type: 'error', message: e.message, stack: e.error?.stack })
      })
      window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        ;(window as any).__scriptguard_errors.push({ type: 'unhandledrejection', message: String(e.reason) })
      })
    })

    // Execute rules check
    const failedRules: string[] = []

    for (const rule of job.data.rules) {
      try {
        const passed = await page.evaluate(
          (ruleConfig: { type: string; config: Record<string, unknown> }) => {
            const sdk = (window as any).__scriptguard_sdk
            if (sdk && typeof sdk.check === 'function') {
              return sdk.check(ruleConfig.type, ruleConfig.config)
            }
            return true
          },
          { type: rule.type, config: rule.config }
        )
        if (!passed) {
          failedRules.push(rule.id)
        }
      } catch {
        failedRules.push(rule.id)
      }
    }

    // Check for injected errors
    const injectedErrors = await page.evaluate(() => {
      return (window as any).__scriptguard_errors || []
    }).catch(() => [])

    if (injectedErrors.length > 0) {
      failedRules.push(...injectedErrors.map((_: unknown, i: number) => `runtime-error-${i}`))
    }

    // Take screenshot
    let screenshotUrl: string | undefined
    try {
      const screenshot = await page.screenshot({ type: 'png', fullPage: true })
      screenshotUrl = `data:image/png;base64,${screenshot.toString('base64')}`
    } catch {
      logger.warn({ jobId: job.id }, 'Failed to take screenshot')
    }

    const durationMs = Date.now() - startTime

    if (failedRules.length === 0) {
      return { status: 'passed', durationMs, failedRules: [], screenshotUrl }
    }

    const requiredRules = job.data.rules.filter((r) => (r.config as { required?: boolean }).required !== false)
    const hasRequiredFailure = failedRules.some((id) => requiredRules.some((r) => r.id === id))

    return {
      status: hasRequiredFailure ? 'failed' : 'degraded',
      durationMs,
      failedRules,
      screenshotUrl,
    }
  } catch (err) {
    const durationMs = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    if (errorMessage.includes('Timeout') || errorMessage.includes('timeout')) {
      return { status: 'timeout', durationMs, failedRules: [], errorMessage }
    }

    return { status: 'error', durationMs, failedRules: [], errorMessage }
  } finally {
    await context.close()
  }
}

function createWorker(): Worker {
  const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  } as any)

  const worker = new Worker('test-runs', processTestRun, {
    connection: connection as any,
    concurrency: 3,
  })

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, result: job.returnvalue }, 'Test run completed')
  })

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Test run failed')
  })

  return worker
}

// Start worker if run directly
const isMainModule = process.argv[1]?.includes('worker')

if (isMainModule) {
  const worker = createWorker()
  logger.info('Playwright runner worker started')

  const shutdown = async () => {
    logger.info('Shutting down...')
    await worker.close()
    await browserPool.closeAll()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

export { createWorker, processTestRun, type TestRunJobData, type TestRunJobResult }
