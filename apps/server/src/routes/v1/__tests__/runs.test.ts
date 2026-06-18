import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockDb, resetMocks } from './helpers.js'

describe('Runs API (SG-028)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    resetMocks()
    const { runsRoutes } = await import('../runs.js')
    app = await buildTestApp(async (a) => { await a.register(runsRoutes) })
  })

  afterEach(async () => { await app?.close() })

  it('POST /scripts/:id/run-now creates a run', async () => {
    const mockRun = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      scriptId: '550e8400-e29b-41d4-a716-446655440001',
      status: 'unknown', url: '',
      startedAt: new Date().toISOString(), result: {},
    }
    mockDb.insert.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.values = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([mockRun])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockRun]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'POST', url: '/scripts/550e8400-e29b-41d4-a716-446655440001/run-now',
    })
    expect(res.statusCode).toBe(200)
  })

  it('GET /scripts/:id/runs returns list', async () => {
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

    const res = await app.inject({ method: 'GET', url: '/scripts/550e8400-e29b-41d4-a716-446655440000/runs' })
    expect(res.statusCode).toBe(200)
  })

  it('GET /runs/:id returns run detail', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.limit = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000', status: 'healthy' }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000', status: 'healthy' }]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'GET', url: '/runs/550e8400-e29b-41d4-a716-446655440000' })
    expect(res.statusCode).toBe(200)
  })

  it('GET /runs/:id returns 404 for missing run', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.limit = vi.fn().mockResolvedValue([])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'GET', url: '/runs/550e8400-e29b-41d4-a716-446655440000' })
    expect(res.statusCode).toBe(404)
  })
})
