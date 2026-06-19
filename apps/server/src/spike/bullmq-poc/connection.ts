/**
 * SG-034 POC: BullMQ Redis Connection
 *
 * Centralized Redis connection for Queue, Worker, and QueueEvents.
 * Uses BullMQ's built-in connection support with URL string.
 */
import { Queue, Worker, QueueEvents } from 'bullmq'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export function createQueue(name: string): Queue {
  return new Queue(name, { connection: { url: REDIS_URL } } as any)
}

export function createWorker(
  name: string,
  processor: (job: any) => Promise<any>
): Worker {
  return new Worker(name, processor, {
    connection: { url: REDIS_URL } as any,
    concurrency: 5,
  })
}

export function createQueueEvents(name: string): QueueEvents {
  return new QueueEvents(name, {
    connection: { url: REDIS_URL } as any,
  })
}
