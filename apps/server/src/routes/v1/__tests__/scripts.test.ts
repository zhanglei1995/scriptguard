import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockDb, resetMocks, mockDbResult } from './helpers.js'

describe('Scripts API (SG-028)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    resetMocks()
    const { scriptsRoutes } = await import('../scripts.js')
    app = await buildTestApp(async (a) => { await a.register(scriptsRoutes) })
  })

  afterEach(async () => { await app?.close() })

  it('GET /scripts returns list', async () => {
    // First call: select().from().where().limit().offset() returns items
    // Second call: select({count}).from().where() returns count
    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockReturnValue(chain)
        chain.offset = vi.fn().mockResolvedValue([])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
        return chain
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([{ count: 0 }]).then(resolve)
        return chain
      })

    const res = await app.inject({ method: 'GET', url: '/scripts' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body).toHaveProperty('items')
    expect(body).toHaveProperty('total')
  })

  it('GET /scripts/:id returns script', async () => {
    const mockScript = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      teamId: null, name: 'Test', description: null, version: '1.0.0',
      code: 'code', matchRules: [], runAt: 'document_idle', enabled: true,
      config: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.limit = vi.fn().mockResolvedValue([mockScript])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'GET', url: '/scripts/550e8400-e29b-41d4-a716-446655440000' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toHaveProperty('id')
  })

  it('GET /scripts/:id returns 404 for missing script', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.limit = vi.fn().mockResolvedValue([])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'GET', url: '/scripts/550e8400-e29b-41d4-a716-446655440000' })
    expect(res.statusCode).toBe(404)
  })

  it('POST /scripts creates script', async () => {
    const mockScript = {
      id: '550e8400-e29b-41d4-a716-446655440000', userId: '00000000-0000-0000-0000-000000000000',
      teamId: null, name: 'New', description: null, version: '1.0.0',
      code: 'test', matchRules: [], runAt: 'document_idle', enabled: true,
      config: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    mockDb.insert.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.values = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([mockScript])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'POST', url: '/scripts',
      payload: { name: 'New Script', code: 'test code' },
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.payload)).toHaveProperty('id')
  })

  it('POST /scripts returns 400 for invalid body', async () => {
    const res = await app.inject({
      method: 'POST', url: '/scripts',
      payload: { name: '' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('PUT /scripts/:id updates script', async () => {
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.set = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Updated' }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Updated' }]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'PUT', url: '/scripts/550e8400-e29b-41d4-a716-446655440000',
      payload: { name: 'Updated Script' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('DELETE /scripts/:id removes script', async () => {
    mockDb.delete.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000' }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000' }]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'DELETE', url: '/scripts/550e8400-e29b-41d4-a716-446655440000' })
    expect(res.statusCode).toBe(204)
  })

  it('GET /scripts/:id/versions returns versions', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockResolvedValue([])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'GET', url: '/scripts/550e8400-e29b-41d4-a716-446655440000/versions' })
    expect(res.statusCode).toBe(200)
  })
})
