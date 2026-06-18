import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockDb, resetMocks } from './helpers.js'

describe('Rules API (SG-032)', () => {
  let app: FastifyInstance
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
  const mockScriptId = '550e8400-e29b-41d4-a716-446655440001'
  const mockRuleId = '550e8400-e29b-41d4-a716-446655440002'

  beforeEach(async () => {
    resetMocks()
    const { rulesRoutes } = await import('../rules.js')
    app = await buildTestApp(async (a) => {
      a.addHook('onRequest', async (req) => { (req as any).userId = mockUserId })
      await a.register(rulesRoutes)
    })
  })

  afterEach(async () => { await app?.close() })

  const mockScript = (userId = mockUserId) => ({
    id: mockScriptId, userId, teamId: null, name: 'Test', description: null,
    version: '1.0.0', code: 'code', matchRules: [], runAt: 'document_idle',
    enabled: true, config: {}, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
  })

  const mockRule = (scriptId = mockScriptId) => ({
    id: mockRuleId, scriptId, name: 'Test Rule', type: 'selector', config: {},
    required: true, timeout: 3000, alertLevel: 'medium', order: 0,
  })

  function mockSelectScript(script = mockScript()) {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.limit = vi.fn().mockResolvedValue([script])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([script]).then(resolve)
      return chain
    })
  }

  function mockSelectRules(rules: unknown[] = []) {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.orderBy = vi.fn().mockResolvedValue(rules)
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve(rules).then(resolve)
      return chain
    })
  }

  // GET /scripts/:id/rules
  it('GET /scripts/:id/rules returns list ordered by order', async () => {
    mockSelectScript()
    mockSelectRules([mockRule(), { ...mockRule(), id: 'rule-2', order: 1 }])

    const res = await app.inject({ method: 'GET', url: `/scripts/${mockScriptId}/rules` })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body).toHaveProperty('items')
    expect(body).toHaveProperty('total')
  })

  it('GET /scripts/:id/rules returns 404 for missing script', async () => {
    mockSelectScript(null)

    const res = await app.inject({ method: 'GET', url: `/scripts/${mockScriptId}/rules` })
    expect(res.statusCode).toBe(404)
  })

  it('GET /scripts/:id/rules returns 403 for other user script', async () => {
    mockSelectScript(mockScript('other-user-id'))

    const res = await app.inject({ method: 'GET', url: `/scripts/${mockScriptId}/rules` })
    expect(res.statusCode).toBe(403)
  })

  // POST /scripts/:id/rules
  it('POST /scripts/:id/rules creates rule', async () => {
    mockSelectScript()
    mockDb.insert.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.values = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([mockRule()])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockRule()]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'POST', url: `/scripts/${mockScriptId}/rules`,
      payload: { name: 'Test Rule', type: 'selector' },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST /scripts/:id/rules returns 404 for missing script', async () => {
    mockSelectScript(null)

    const res = await app.inject({
      method: 'POST', url: `/scripts/${mockScriptId}/rules`,
      payload: { name: 'Test Rule', type: 'selector' },
    })
    expect(res.statusCode).toBe(404)
  })

  it('POST /scripts/:id/rules returns 400 for invalid body', async () => {
    mockSelectScript()

    const res = await app.inject({
      method: 'POST', url: `/scripts/${mockScriptId}/rules`,
      payload: { name: '' },
    })
    expect(res.statusCode).toBe(400)
  })

  // PUT /rules/:id
  it('PUT /rules/:id updates rule', async () => {
    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([mockRule()])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockRule()]).then(resolve)
        return chain
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([mockScript()])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript()]).then(resolve)
        return chain
      })
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.set = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([{ ...mockRule(), name: 'Updated' }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ ...mockRule(), name: 'Updated' }]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'PUT', url: `/rules/${mockRuleId}`,
      payload: { name: 'Updated' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('PUT /rules/:id returns 404 for non-existent rule', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.limit = vi.fn().mockResolvedValue([])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'PUT', url: `/rules/${mockRuleId}`,
      payload: { name: 'Updated' },
    })
    expect(res.statusCode).toBe(404)
  })

  // DELETE /rules/:id
  it('DELETE /rules/:id removes rule', async () => {
    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([mockRule()])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockRule()]).then(resolve)
        return chain
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([mockScript()])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript()]).then(resolve)
        return chain
      })
    mockDb.delete.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([mockRule()])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([mockRule()]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'DELETE', url: `/rules/${mockRuleId}` })
    expect(res.statusCode).toBe(204)
  })

  it('DELETE /rules/:id returns 404 for non-existent rule', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.limit = vi.fn().mockResolvedValue([])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
      return chain
    })

    const res = await app.inject({ method: 'DELETE', url: `/rules/${mockRuleId}` })
    expect(res.statusCode).toBe(404)
  })

  // POST /rules/reorder
  it('POST /rules/reorder updates order', async () => {
    mockDb.select
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([mockRule()])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockRule()]).then(resolve)
        return chain
      })
      .mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([mockScript()])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript()]).then(resolve)
        return chain
      })
    mockDb.update.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.set = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([mockRule()])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockRule()]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'POST', url: '/rules/reorder',
      payload: { items: [{ id: mockRuleId, order: 5 }] },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({ success: true })
  })

  it('POST /rules/reorder returns 400 for invalid body', async () => {
    const res = await app.inject({
      method: 'POST', url: '/rules/reorder',
      payload: { items: [] },
    })
    expect(res.statusCode).toBe(400)
  })
})
