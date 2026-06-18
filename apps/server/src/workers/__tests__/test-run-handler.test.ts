import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../lib/db.js', () => {
  const mockChain = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'run-1', scriptId: 'script-1', status: 'healthy' }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ userId: 'user-1' }]),
    then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve([{ id: 'run-1' }])),
  }
  return {
    db: {
      insert: vi.fn(() => mockChain),
      select: vi.fn(() => mockChain),
    },
  }
})

vi.mock('../../lib/queue.js', () => ({
  createTestRunWorker: vi.fn().mockReturnValue({
    close: vi.fn().mockResolvedValue(undefined),
  }),
  getTestRunWorker: vi.fn().mockReturnValue(null),
  closeQueue: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@scriptguard/db', () => ({
  testRuns: { id: 'id', scriptId: 'scriptId', status: 'status', url: 'url', startedAt: 'startedAt', endedAt: 'endedAt', durationMs: 'durationMs', result: 'result', screenshotUrl: 'screenshotUrl' },
  alerts: { id: 'id', userId: 'userId', scriptId: 'scriptId', runId: 'runId', level: 'level', message: 'message', payload: 'payload' },
  scripts: { id: 'id', userId: 'userId' },
}))

describe('TestRunHandler (SG-037)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports startTestRunHandler and stopTestRunHandler', async () => {
    const { startTestRunHandler, stopTestRunHandler } = await import('../test-run-handler.js')
    expect(typeof startTestRunHandler).toBe('function')
    expect(typeof stopTestRunHandler).toBe('function')
  })

  it('startTestRunHandler creates worker and logs', async () => {
    const { startTestRunHandler } = await import('../test-run-handler.js')
    const { createTestRunWorker } = await import('../../lib/queue.js')

    startTestRunHandler()
    expect(createTestRunWorker).toHaveBeenCalled()
  })

  it('stopTestRunHandler closes worker and queue', async () => {
    const { stopTestRunHandler } = await import('../test-run-handler.js')
    const { getTestRunWorker, closeQueue } = await import('../../lib/queue.js')

    await stopTestRunHandler()
    expect(getTestRunWorker).toHaveBeenCalled()
    expect(closeQueue).toHaveBeenCalled()
  })
})
