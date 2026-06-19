/**
 * SG-034 POC: Queue Events (Observability)
 *
 * Demonstrates BullMQ QueueEvents for real-time monitoring.
 * Maps to TDD §12.4 server metrics (prom-client integration).
 */
import { QueueEvents } from 'bullmq'
import { createQueueEvents } from './connection.js'
import { TEST_RUN_QUEUE } from './test-run-queue.js'

let queueEventsInstance: QueueEvents | null = null

export function getQueueEvents(): QueueEvents {
  if (!queueEventsInstance) {
    queueEventsInstance = createQueueEvents(TEST_RUN_QUEUE)
  }
  return queueEventsInstance
}

export function startEventListeners(): void {
  const events = getQueueEvents()

  events.on('waiting', ({ jobId }) => {
    console.log(`[Event] Job ${jobId} is waiting`)
  })

  events.on('active', ({ jobId, prev }) => {
    console.log(`[Event] Job ${jobId} is now active (prev: ${prev})`)
  })

  events.on('completed', ({ jobId, returnvalue }) => {
    console.log(`[Event] Job ${jobId} completed:`, returnvalue)
  })

  events.on('failed', ({ jobId, failedReason }) => {
    console.error(`[Event] Job ${jobId} failed: ${failedReason}`)
  })

  events.on('progress', ({ jobId, data }) => {
    console.log(`[Event] Job ${jobId} progress:`, data)
  })

  events.on('delayed', ({ jobId }) => {
    console.log(`[Event] Job ${jobId} delayed`)
  })

  events.on('removed', ({ jobId }) => {
    console.log(`[Event] Job ${jobId} removed`)
  })

  events.on('drained', () => {
    console.log(`[Event] Queue ${TEST_RUN_QUEUE} drained`)
  })

  console.log(`[Event] Listening to queue events for ${TEST_RUN_QUEUE}`)
}

export function stopEventListeners(): void {
  if (queueEventsInstance) {
    queueEventsInstance.close()
    queueEventsInstance = null
  }
}
