import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockDb, resetMocks } from './helpers.js'

describe('Alerts API (SG-028)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    resetMocks()
    const { alertsRoutes } = await import('../alerts.js')
    app = await buildTestApp(async (a) => { await a.register(alertsRoutes) })
  })

  afterEach(async () => { await app?.close() })

  it('GET /alerts returns list', async () => {
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

    const res = await app.inject({ method: 'GET', url: '/alerts' })
    expect(res.statusCode).toBe(200)
  })

  it('POST /alerts/:id/ack acknowledges alert', async () => {
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.set = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([{
        id: '550e8400-e29b-41d4-a716-446655440000', acknowledged: true,
        acknowledgedAt: new Date().toISOString(),
      }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000', acknowledged: true }]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'POST', url: '/alerts/550e8400-e29b-41d4-a716-446655440000/ack' })
    expect(res.statusCode).toBe(200)
  })

  it('POST /alerts/:id/ack returns 404 for missing alert', async () => {
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.set = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'POST', url: '/alerts/550e8400-e29b-41d4-a716-446655440000/ack' })
    expect(res.statusCode).toBe(404)
  })
})
