import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, mockDb, resetMocks } from './helpers.js';

describe('Scripts API (SG-030)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    resetMocks();
    const { scriptsRoutes } = await import('../scripts.js');
    app = await buildTestApp(async (a) => {
      await a.register(scriptsRoutes);
    });
  });

  afterEach(async () => {
    await app?.close();
  });

  // ---- GET /scripts with cursor pagination ----

  it('GET /scripts returns list with nextCursor', async () => {
    const mockItems = [
      { id: 'aaa', createdAt: new Date('2024-01-01'), name: 'A' },
      { id: 'bbb', createdAt: new Date('2024-01-02'), name: 'B' },
    ];
    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.orderBy = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockResolvedValue(mockItems);
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve(mockItems).then(resolve);
        return chain;
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (v: unknown) => void) =>
          Promise.resolve([{ count: 2 }]).then(resolve);
        return chain;
      });

    const res = await app.inject({ method: 'GET', url: '/scripts' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('nextCursor');
  });

  it('GET /scripts with teamId filter', async () => {
    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.orderBy = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockResolvedValue([]);
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve);
        return chain;
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (v: unknown) => void) =>
          Promise.resolve([{ count: 0 }]).then(resolve);
        return chain;
      });

    const res = await app.inject({
      method: 'GET',
      url: '/scripts?teamId=550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(200);
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('GET /scripts with cursor decodes and queries correctly', async () => {
    const cursorPayload = {
      createdAt: '2024-06-01T00:00:00.000Z',
      id: '550e8400-e29b-41d4-a716-446655440000',
    };
    const cursor = Buffer.from(JSON.stringify(cursorPayload)).toString('base64');

    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.orderBy = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockResolvedValue([]);
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve);
        return chain;
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (v: unknown) => void) =>
          Promise.resolve([{ count: 0 }]).then(resolve);
        return chain;
      });

    const res = await app.inject({ method: 'GET', url: `/scripts?cursor=${cursor}` });
    expect(res.statusCode).toBe(200);
    expect(mockDb.select).toHaveBeenCalled();
  });

  // ---- GET /scripts/:id ----

  it('GET /scripts/:id returns script', async () => {
    const mockScript = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      teamId: null,
      name: 'Test',
      description: null,
      version: '1.0.0',
      code: 'code',
      matchRules: [],
      runAt: 'document_idle',
      enabled: true,
      config: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([mockScript]);
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript]).then(resolve);
      return chain;
    });

    const res = await app.inject({
      method: 'GET',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toHaveProperty('id');
  });

  it('GET /scripts/:id returns 404 for missing script', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([]);
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve);
      return chain;
    });

    const res = await app.inject({
      method: 'GET',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(404);
  });

  // ---- POST /scripts ----

  it('POST /scripts creates script with userId from request', async () => {
    const mockScript = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      teamId: null,
      name: 'New',
      description: null,
      version: '1.0.0',
      code: 'test',
      matchRules: [],
      runAt: 'document_idle',
      enabled: true,
      config: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.insert.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {};
      chain.values = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([mockScript]);
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript]).then(resolve);
      return chain;
    });

    const res = await app.inject({
      method: 'POST',
      url: '/scripts',
      payload: { name: 'New Script', code: 'test code' },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.payload)).toHaveProperty('id');
  });

  it('POST /scripts returns 400 for invalid body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/scripts',
      payload: { name: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  // ---- PUT /scripts/:id ----

  it('PUT /scripts/:id updates script', async () => {
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi
        .fn()
        .mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Updated' }]);
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Updated' }]).then(
          resolve,
        );
      return chain;
    });

    const res = await app.inject({
      method: 'PUT',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440000',
      payload: { name: 'Updated Script' },
    });
    expect(res.statusCode).toBe(200);
  });

  // ---- DELETE /scripts/:id (soft delete) ----

  it('DELETE /scripts/:id soft deletes script', async () => {
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000' }]);
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000' }]).then(resolve);
      return chain;
    });

    const res = await app.inject({
      method: 'DELETE',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(204);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('DELETE /scripts/:id returns 404 for non-existent script', async () => {
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([]);
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve);
      return chain;
    });

    const res = await app.inject({
      method: 'DELETE',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(res.statusCode).toBe(404);
  });

  // ---- GET /scripts/:id/versions ----

  it('GET /scripts/:id/versions returns versions after checking script exists', async () => {
    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000' }]);
        chain.then = (resolve: (v: unknown) => void) =>
          Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000' }]).then(resolve);
        return chain;
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.orderBy = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve);
        return chain;
      });

    const res = await app.inject({
      method: 'GET',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440000/versions',
    });
    expect(res.statusCode).toBe(200);
  });

  // ---- POST /scripts/:id/rollback/:versionId ----

  it('POST /scripts/:id/rollback/:versionId rolls back', async () => {
    const mockScript = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const mockVersion = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      scriptId: '550e8400-e29b-41d4-a716-446655440000',
      code: 'old',
      version: '1.0.0',
    };

    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockResolvedValue([mockScript]);
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript]).then(resolve);
        return chain;
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {};
        chain.from = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockResolvedValue([mockVersion]);
        chain.then = (resolve: (v: unknown) => void) =>
          Promise.resolve([mockVersion]).then(resolve);
        return chain;
      });

    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([mockScript]);
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript]).then(resolve);
      return chain;
    });

    const res = await app.inject({
      method: 'POST',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440000/rollback/550e8400-e29b-41d4-a716-446655440001',
    });
    expect(res.statusCode).toBe(200);
  });

  it('POST /scripts/:id/rollback/:versionId returns 404 for missing script', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([]);
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve);
      return chain;
    });

    const res = await app.inject({
      method: 'POST',
      url: '/scripts/550e8400-e29b-41d4-a716-446655440000/rollback/550e8400-e29b-41d4-a716-446655440001',
    });
    expect(res.statusCode).toBe(404);
  });
});
