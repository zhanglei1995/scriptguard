import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  stopListener: vi.fn().mockResolvedValue(undefined),
  registerTestRunResultHandler: vi.fn(),
}));

mocks.registerTestRunResultHandler.mockReturnValue(mocks.stopListener);

vi.mock('../../lib/db.js', () => {
  const mockChain = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi
      .fn()
      .mockResolvedValue([{ id: 'run-1', scriptId: 'script-1', status: 'healthy' }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ userId: 'user-1' }]),
    then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve([{ id: 'run-1' }])),
  };
  return {
    db: {
      insert: vi.fn(() => mockChain),
      select: vi.fn(() => mockChain),
    },
  };
});

vi.mock('../../lib/queue.js', () => ({
  registerTestRunResultHandler: mocks.registerTestRunResultHandler,
}));

vi.mock('@scriptguard/db', () => ({
  testRuns: {
    id: 'id',
    scriptId: 'scriptId',
    status: 'status',
    url: 'url',
    startedAt: 'startedAt',
    endedAt: 'endedAt',
    durationMs: 'durationMs',
    result: 'result',
    screenshotUrl: 'screenshotUrl',
  },
  alerts: {
    id: 'id',
    userId: 'userId',
    scriptId: 'scriptId',
    runId: 'runId',
    level: 'level',
    message: 'message',
    payload: 'payload',
  },
  scripts: { id: 'id', userId: 'userId' },
}));

describe('TestRunHandler (SG-037)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.registerTestRunResultHandler.mockReturnValue(mocks.stopListener);
  });

  it('exports startTestRunHandler and stopTestRunHandler', async () => {
    const { startTestRunHandler, stopTestRunHandler } = await import('../test-run-handler.js');
    expect(typeof startTestRunHandler).toBe('function');
    expect(typeof stopTestRunHandler).toBe('function');
  });

  it('startTestRunHandler registers queue event listener', async () => {
    vi.resetModules();
    const { startTestRunHandler } = await import('../test-run-handler.js');

    startTestRunHandler();
    expect(mocks.registerTestRunResultHandler).toHaveBeenCalledWith(expect.any(Function));
  });

  it('stopTestRunHandler unregisters queue event listener', async () => {
    vi.resetModules();
    const { startTestRunHandler, stopTestRunHandler } = await import('../test-run-handler.js');

    startTestRunHandler();
    await stopTestRunHandler();
    expect(mocks.stopListener).toHaveBeenCalled();
  });
});
