/**
 * SG-034 POC: Repeatable Jobs (Cron Scheduling)
 *
 * Demonstrates BullMQ's repeatable job feature for scheduled test runs.
 * Maps to TestSchedule.cron in the Drizzle schema (packages/db/src/schema.ts).
 */
import { RepeatOptions } from 'bullmq'
import { getTestRunQueue } from './test-run-queue.js'

export interface ScheduleConfig {
  scheduleId: string
  scriptId: string
  url: string
  cron: string
  rules: Array<{
    id: string
    type: string
    config: Record<string, unknown>
  }>
  enabled: boolean
}

export async function createRepeatableTestRun(
  config: ScheduleConfig
): Promise<string> {
  const queue = getTestRunQueue()

  const repeatOptions: RepeatOptions = {
    pattern: config.cron,
    tz: 'UTC',
  }

  const job = await queue.add(
    'repeatable-test-run',
    {
      scheduleId: config.scheduleId,
      scriptId: config.scriptId,
      url: config.url,
      rules: config.rules,
    },
    {
      repeat: repeatOptions,
      jobId: `schedule:${config.scheduleId}`,
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 10 },
    }
  )

  console.log(`[Scheduler] Created repeatable job for schedule ${config.scheduleId}: ${config.cron}`)
  return job.id!
}

export async function removeRepeatableTestRun(
  scheduleId: string
): Promise<void> {
  const queue = getTestRunQueue()
  const jobId = `schedule:${scheduleId}`

  // Find and remove the repeatable job
  const repeatableJobs = await queue.getRepeatableJobs()
  const target = repeatableJobs.find((j) => j.id === jobId)

  if (target) {
    await queue.removeRepeatableByKey(target.key)
    console.log(`[Scheduler] Removed repeatable job for schedule ${scheduleId}`)
  }
}

export async function listRepeatableTestRuns(): Promise<
  Array<{
    id: string
    scheduleId: string
    cron: string
    nextRun: number
  }>
> {
  const queue = getTestRunQueue()
  const repeatableJobs = await queue.getRepeatableJobs()

  return repeatableJobs
    .filter((j) => j.name === 'repeatable-test-run')
    .map((j) => ({
      id: j.id ?? '',
      scheduleId: (j as any).scheduleId ?? '',
      cron: j.pattern ?? '',
      nextRun: j.next ?? 0,
    }))
}

export async function pauseSchedule(scheduleId: string): Promise<void> {
  const queue = getTestRunQueue()
  await queue.pause()
  console.log(`[Scheduler] Paused schedule ${scheduleId}`)
}

export async function resumeSchedule(scheduleId: string): Promise<void> {
  const queue = getTestRunQueue()
  await queue.resume()
  console.log(`[Scheduler] Resumed schedule ${scheduleId}`)
}
