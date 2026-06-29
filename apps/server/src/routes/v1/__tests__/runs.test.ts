import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestAppWithAuth, mockDb, resetMocks } from './helpers.js';

vi.mock('../../../lib/queue.js', () => ({
  addTestRunJob: vi.fn().mockResolvedValue(undefined),
  initQueue: vi.fn().mockResolvedValue(undefined),
  isQueueReady: vi.fn().mockReturnValue(false),
}));

function chainWithResult(result: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

function countChain(count: number) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve([{ count }]).then(resolve);
  return chain;
}

describe('Runs API (SG-033)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    resetMocks();
    const { runsRoutes } = await import('../runs.js');
    app = await buildTestAppWithAuth(async (a) => {
      await a.register(runsRoutes);
    });
  });

  afterEach(async () => {
    await app?.close();
  });

  it('POST /scripts/:id/run-now creates a run and queues job', async () => {
    const mockRun = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      scriptId: '550e8400-e29b-41d4-a716-446655440001',
      status: 'unknown',
      url: '',
      startedAt: new Date().toISOString(),
      result: {},
    };
    mockDb.select.mockImplementationOnce(() =>
      chainWithResult([{ id: '550e8400-e29b-41d4-a716-446655440001' }]),
    );
    mockDb.insert.mockImplementationOnce(() => chainWithResult([mockRun]));

    const res = await app.inject({
      method: 'POST',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440001/run-now',
    });
    expect(res.statusCode).toBe(200);
    const { addTestRunJob } = await import('../../../lib/queue.js');
    expect(addTestRunJob).toHaveBeenCalledWith({
      scriptId: '550e8400-e29b-41d4-a716-446655440001',
      url: '',
      rules: [],
    });
  });

  it('POST /scripts/:id/run-now returns 404 if script not owned', async () => {
    mockDb.select.mockImplementationOnce(() => chainWithResult([]));

    const res = await app.inject({
      method: 'POST',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440001/run-now',
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /scripts/:id/runs returns paginated list sorted by createdAt desc', async () => {
    const mockRuns = [
      { id: 'run-2', createdAt: '2026-01-02T00:00:00Z', status: 'healthy' },
      { id: 'run-1', createdAt: '2026-01-01T00:00:00Z', status: 'failed' },
    ];
    mockDb.select
      .mockImplementationOnce(() =>
        chainWithResult([{ id: '550e8400-e29b-41d4-a716-446655440001' }]),
      )
      .mockImplementationOnce(() => chainWithResult(mockRuns))
      .mockImplementationOnce(() => countChain(2));

    const res = await app.inject({
      method: 'GET',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440001/runs?limit=10&offset=0',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it('GET /scripts/:id/runs returns 404 if script not owned', async () => {
    mockDb.select.mockImplementationOnce(() => chainWithResult([]));

    const res = await app.inject({
      method: 'GET',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440001/runs',
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /runs/:id returns run detail', async () => {
    const mockRun = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      scriptId: '550e8400-e29b-41d4-a716-446655440001',
      status: 'healthy',
    };
    mockDb.select.mockImplementationOnce(() =>
      chainWithResult([{ id: '550e8400-e29b-41d4-a716-446655440000' }]),
    );
    mockDb.select.mockImplementationOnce(() => chainWithResult([mockRun]));

    const res = await app.inject({
      method: 'GET',
      url: '/runs/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET /runs/:id returns 404 for missing or unauthorized run', async () => {
    mockDb.select.mockImplementationOnce(() => chainWithResult([]));

    const res = await app.inject({
      method: 'GET',
      url: '/runs/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(404);
  });
});
