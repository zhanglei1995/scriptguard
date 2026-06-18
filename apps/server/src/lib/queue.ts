/**
 * Simplified test queue — degrades to in-process execution when Redis is unavailable.
 * Extend to real BullMQ when Redis is provisioned.
 */

let redisAvailable = false
let queueInstance: unknown = null

async function tryConnectRedis(): Promise<boolean> {
  try {
    // Dynamic imports for optional dependencies
    const queueModule: { Queue: new (name: string, opts: unknown) => { add: (name: string, data: unknown) => Promise<unknown> } } =
      // @ts-expect-error bullmq is an optional peer dependency
      await import('bullmq')
    const ioredisModule: { default: new (url: string, opts?: unknown) => { status: string; once: (evt: string, cb: () => void) => void; disconnect: () => void } } =
      // @ts-expect-error ioredis is an optional peer dependency
      await import('ioredis')
    const connection = new ioredisModule.default(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 2000,
    })
    await Promise.race([
      new Promise<void>((resolve) => connection.once('ready', resolve)),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ])
    if (connection.status === 'ready') {
      queueInstance = new queueModule.Queue('test-runs', { connection })
      redisAvailable = true
      return true
    }
    connection.disconnect()
  } catch {
    // bullmq or ioredis not installed — degrade gracefully
  }
  return false
}

export async function initQueue(): Promise<void> {
  redisAvailable = await tryConnectRedis()
}

export function isQueueReady(): boolean {
  return redisAvailable
}

export interface TestJobData {
  scriptId: string
  url: string
}

export async function addTestJob(scriptId: string, url: string): Promise<void> {
  const data: TestJobData = { scriptId, url }
  if (redisAvailable && queueInstance) {
    const q = queueInstance as { add: (name: string, data: TestJobData) => Promise<unknown> }
    await q.add('test-run', data)
  }
}
