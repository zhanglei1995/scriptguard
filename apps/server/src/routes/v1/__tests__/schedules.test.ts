import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestAppWithAuth, mockDb, resetMocks } from './helpers.js';

function chainWithResult(result: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
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
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve([{ count }]).then(resolve);
  return chain;
}

describe('Schedules API (SG-033)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    resetMocks();
    const { schedulesRoutes } = await import('../schedules.js');
    app = await buildTestAppWithAuth(async (a) => {
      await a.register(schedulesRoutes);
    });
  });

  afterEach(async () => {
    await app?.close();
  });

  it('GET /schedules returns list for current user', async () => {
    mockDb.select
      .mockImplementationOnce(() => chainWithResult([]))
      .mockImplementationOnce(() => countChain(0));

    const res = await app.inject({ method: 'GET', url: '/schedules' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('total');
  });

  it('POST /schedules creates schedule with valid cron', async () => {
    const mockSchedule = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      scriptId: '550e8400-e29b-41d4-a716-446655440001',
      cron: '0 * * * *',
      mode: 'full',
      config: {},
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    mockDb.select.mockImplementationOnce(() =>
      chainWithResult([{ id: '550e8400-e29b-41d4-a716-446655440001' }]),
    );
    mockDb.insert.mockImplementationOnce(() => chainWithResult([mockSchedule]));

    const res = await app.inject({
      method: 'POST',
      url: '/schedules',
      payload: {
        scriptId: '550e8400-e29b-41d4-a716-446655440001',
        cron: '0 * * * *',
        mode: 'full',
      },
    });
    expect(res.statusCode).toBe(201);
  });

  it('POST /schedules returns 400 for invalid cron', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/schedules',
      payload: { scriptId: '550e8400-e29b-41d4-a716-446655440001', cron: 'invalid', mode: 'full' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /schedules returns 400 for missing body', async () => {
    const res = await app.inject({ method: 'POST', url: '/schedules', payload: { cron: '' } });
    expect(res.statusCode).toBe(400);
  });

  it('PUT /schedules/:id updates schedule', async () => {
    const updatedSchedule = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      cron: '0 12 * * *',
      mode: 'full',
      config: {},
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    mockDb.select.mockImplementationOnce(() =>
      chainWithResult([{ test_schedules: updatedSchedule }]),
    );
    mockDb.update.mockImplementationOnce(() => chainWithResult([updatedSchedule]));

    const res = await app.inject({
      method: 'PUT',
      url: '/schedules/550e8400-e29b-41d4-a716-446655440000',
      payload: { cron: '0 12 * * *' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('PUT /schedules/:id returns 400 for invalid cron', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/schedules/550e8400-e29b-41d4-a716-446655440000',
      payload: { cron: 'bad-cron' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /schedules/:id removes schedule', async () => {
    const mockSchedule = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      test_schedules: { id: '550e8400-e29b-41d4-a716-446655440000' },
    };
    mockDb.select.mockImplementationOnce(() => chainWithResult([mockSchedule]));
    mockDb.delete.mockImplementationOnce(() =>
      chainWithResult([{ id: '550e8400-e29b-41d4-a716-446655440000' }]),
    );

    const res = await app.inject({
      method: 'DELETE',
      url: '/schedules/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(204);
  });

  it('DELETE /schedules/:id returns 404 for missing', async () => {
    mockDb.select.mockImplementationOnce(() => chainWithResult([]));

    const res = await app.inject({
      method: 'DELETE',
      url: '/schedules/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(404);
  });
});
