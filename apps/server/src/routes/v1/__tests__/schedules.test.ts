import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockDb, resetMocks } from './helpers.js'

describe('Schedules API (SG-028)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    resetMocks()
    const { schedulesRoutes } = await import('../schedules.js')
    app = await buildTestApp(async (a) => { await a.register(schedulesRoutes) })
  })

  afterEach(async () => { await app?.close() })

  it('GET /schedules returns list', async () => {
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

    const res = await app.inject({ method: 'GET', url: '/schedules' })
    expect(res.statusCode).toBe(200)
  })

  it('POST /schedules creates schedule', async () => {
    const mockSchedule = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      scriptId: '550e8400-e29b-41d4-a716-446655440001',
      cron: '0 * * * *', mode: 'full', config: {},
      enabled: true, createdAt: new Date().toISOString(),
    }
    mockDb.insert.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.values = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([mockSchedule])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockSchedule]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'POST', url: '/schedules',
      payload: { scriptId: '550e8400-e29b-41d4-a716-446655440001', cron: '0 * * * *', mode: 'full' },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST /schedules returns 400 for invalid body', async () => {
    const res = await app.inject({ method: 'POST', url: '/schedules', payload: { cron: '' } })
    expect(res.statusCode).toBe(400)
  })

  it('PUT /schedules/:id updates schedule', async () => {
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.set = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000' }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000' }]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'PUT', url: '/schedules/550e8400-e29b-41d4-a716-446655440000',
      payload: { cron: '0 12 * * *' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('DELETE /schedules/:id removes schedule', async () => {
    mockDb.delete.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000' }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000' }]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'DELETE', url: '/schedules/550e8400-e29b-41d4-a716-446655440000' })
    expect(res.statusCode).toBe(204)
  })
})
