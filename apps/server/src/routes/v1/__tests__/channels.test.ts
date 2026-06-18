import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockDb, resetMocks } from './helpers.js'

const mockNotificationService = {
  sendTest: vi.fn().mockResolvedValue({ success: true }),
  send: vi.fn().mockResolvedValue(undefined),
}
vi.mock('../../../lib/notify/index.js', () => ({
  notificationService: mockNotificationService,
}))

describe('Channels API (SG-028)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    resetMocks()
    mockNotificationService.sendTest.mockResolvedValue({ success: true })
    const { channelsRoutes } = await import('../channels.js')
    app = await buildTestApp(async (a) => { await a.register(channelsRoutes) })
  })

  afterEach(async () => { await app?.close() })

  it('GET /channels returns list', async () => {
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

    const res = await app.inject({ method: 'GET', url: '/channels' })
    expect(res.statusCode).toBe(200)
  })

  it('POST /channels creates channel', async () => {
    const mockChannel = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '00000000-0000-0000-0000-000000000000',
      type: 'email', config: { email: 'test@example.com' },
      enabled: true, createdAt: new Date().toISOString(),
    }
    mockDb.insert.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.values = vi.fn().mockReturnValue(chain)
      chain.returning = vi.fn().mockResolvedValue([mockChannel])
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockChannel]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'POST', url: '/channels',
      payload: { type: 'email', config: { email: 'test@example.com' } },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST /channels returns 400 for invalid body', async () => {
    const res = await app.inject({ method: 'POST', url: '/channels', payload: { type: '' } })
    expect(res.statusCode).toBe(400)
  })

  it('POST /channels/:id/test sends test message', async () => {
    mockDb.select.mockImplementationOnce(() => {
      const chain: Record<string, unknown> = {}
      chain.from = vi.fn().mockReturnValue(chain)
      chain.where = vi.fn().mockReturnValue(chain)
      chain.limit = vi.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000', type: 'email' }])
      chain.then = (resolve: (v: unknown) => void) =>
        Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000', type: 'email' }]).then(resolve)
      return chain
    })

    const res = await app.inject({
      method: 'POST', url: '/channels/550e8400-e29b-41d4-a716-446655440000/test',
      payload: { message: 'Hello' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toHaveProperty('success', true)
  })
})
