import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockDb, resetMocks } from './helpers.js'

describe('Rules API (SG-028)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    resetMocks()
    const { rulesRoutes } = await import('../rules.js')
    app = await buildTestApp(async (a) => { await a.register(rulesRoutes) })
  })

  afterEach(async () => { await app?.close() })

  it('GET /scripts/:id/rules returns list', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockResolvedValue([])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'GET', url: '/scripts/550e8400-e29b-41d4-a716-446655440000/rules' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toHaveProperty('items')
  })

  it('POST /scripts/:id/rules creates rule', async () => {
    const mockRule = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      scriptId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Rule', type: 'selector', config: {},
      required: true, timeout: 3000, alertLevel: 'medium', order: 0,
    }
    mockDb.insert.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.values = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([mockRule])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockRule]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'POST', url: '/scripts/550e8400-e29b-41d4-a716-446655440001/rules',
      payload: { name: 'Test Rule', type: 'selector' },
    })
    expect(res.statusCode).toBe(201)
  })

  it('PUT /rules/:id updates rule', async () => {
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
      method: 'PUT', url: '/rules/550e8400-e29b-41d4-a716-446655440000',
      payload: { name: 'Updated' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('DELETE /rules/:id removes rule', async () => {
    mockDb.delete.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000' }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000' }]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'DELETE', url: '/rules/550e8400-e29b-41d4-a716-446655440000' })
    expect(res.statusCode).toBe(204)
  })

  it('POST /scripts/:id/rules returns 400 for invalid body', async () => {
    const res = await app.inject({
      method: 'POST', url: '/scripts/550e8400-e29b-41d4-a716-446655440000/rules',
      payload: { name: '' },
    })
    expect(res.statusCode).toBe(400)
  })
})
