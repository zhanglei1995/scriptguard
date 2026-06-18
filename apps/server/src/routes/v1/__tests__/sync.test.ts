import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestAppWithAuth, mockDb, resetMocks } from './helpers.js'

describe('Sync API (SG-031)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    resetMocks()
    const { syncRoutes } = await import('../sync.js')
    app = await buildTestAppWithAuth(async (a) => { await a.register(syncRoutes) })
  })

  afterEach(async () => { await app?.close() })

  // ---- POST /sync/push ----

  describe('POST /sync/push', () => {
    it('push new scripts without conflict', async () => {
      // select returns empty → new script
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
        return chain
      })
      // insert succeeds
      mockDb.insert.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.values = vi.fn().mockReturnValue(chain)
        chain.returning = vi.fn().mockResolvedValue([{}])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([{}]).then(resolve)
        return chain
      })

      const res = await app.inject({
        method: 'POST',
        url: '/sync/push',
        payload: {
          clientVersion: 1,
          lastSyncAt: 0,
          changes: {
            scripts: [{
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Test Script',
              updatedAt: new Date().toISOString(),
            }],
          },
        },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.serverVersion).toBe(2)
      expect(body.syncedAt).toBeGreaterThan(0)
      expect(body.conflicts).toEqual([])
    })

    it('push with conflict returns conflicts array (last-write-wins)', async () => {
      const serverTime = new Date('2024-06-02T00:00:00Z')
      const clientTime = new Date('2024-06-01T00:00:00Z')

      // select returns server version (newer)
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([{
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '00000000-0000-0000-0000-000000000001',
          name: 'Server Script',
          code: 'server code',
          updatedAt: serverTime,
          config: {},
          matchRules: [],
          runAt: 'document_idle',
          enabled: true,
          version: '1.0.0',
          description: null,
          teamId: null,
          createdAt: new Date(),
        }])
        chain.then = (resolve: (v: unknown) => void) =>
          Promise.resolve([{
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Server Script',
            updatedAt: serverTime,
          }]).then(resolve)
        return chain
      })

      const res = await app.inject({
        method: 'POST',
        url: '/sync/push',
        payload: {
          clientVersion: 1,
          lastSyncAt: 0,
          changes: {
            scripts: [{
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Client Script',
              code: 'client code',
              updatedAt: clientTime.toISOString(),
            }],
          },
        },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.conflicts).toHaveLength(1)
      expect(body.conflicts[0].entity).toBe('script')
      expect(body.conflicts[0].id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(body.conflicts[0].local.name).toBe('Client Script')
      expect(body.conflicts[0].server.name).toBe('Server Script')
    })

    it('push with client newer updates server (client wins)', async () => {
      const serverTime = new Date('2024-06-01T00:00:00Z')
      const clientTime = new Date('2024-06-02T00:00:00Z')

      // select returns server version (older)
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([{
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '00000000-0000-0000-0000-000000000001',
          name: 'Server Script',
          updatedAt: serverTime,
        }])
        chain.then = (resolve: (v: unknown) => void) =>
          Promise.resolve([{
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Server Script',
            updatedAt: serverTime,
          }]).then(resolve)
        return chain
      })
      // update succeeds
      mockDb.update.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.set = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.returning = vi.fn().mockResolvedValue([{}])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([{}]).then(resolve)
        return chain
      })

      const res = await app.inject({
        method: 'POST',
        url: '/sync/push',
        payload: {
          clientVersion: 1,
          lastSyncAt: 0,
          changes: {
            scripts: [{
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Client Script',
              updatedAt: clientTime.toISOString(),
            }],
          },
        },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.conflicts).toEqual([])
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('push with deleted script IDs soft-deletes them', async () => {
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
        method: 'POST',
        url: '/sync/push',
        payload: {
          clientVersion: 1,
          lastSyncAt: 0,
          changes: {
            deletedScriptIds: ['550e8400-e29b-41d4-a716-446655440000'],
          },
        },
      })

      expect(res.statusCode).toBe(200)
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('push with rule changes inserts new rules', async () => {
      // select for existing rule returns empty
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockResolvedValue([])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
        return chain
      })
      // insert rule
      mockDb.insert.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.values = vi.fn().mockReturnValue(chain)
        chain.returning = vi.fn().mockResolvedValue([{}])
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([{}]).then(resolve)
        return chain
      })

      const res = await app.inject({
        method: 'POST',
        url: '/sync/push',
        payload: {
          clientVersion: 1,
          lastSyncAt: 0,
          changes: {
            rules: [{
              id: '550e8400-e29b-41d4-a716-446655440001',
              scriptId: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Test Rule',
              type: 'selector',
              config: {},
            }],
          },
        },
      })

      expect(res.statusCode).toBe(200)
      expect(mockDb.insert).toHaveBeenCalled()
    })
  })

  // ---- POST /sync/pull ----

  describe('POST /sync/pull', () => {
    it('pull returns changes since lastSyncAt', async () => {
      const mockScript = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '00000000-0000-0000-0000-000000000001',
        name: 'Updated Script',
        code: 'code',
        matchRules: [],
        runAt: 'document_idle',
        enabled: true,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: null,
        teamId: null,
        version: '1.0.0',
      }
      const mockRule = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        scriptId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Rule 1',
        type: 'selector',
        config: {},
        required: true,
        timeout: 3000,
        alertLevel: 'medium',
        order: 0,
      }

      // select 1: changed scripts (not deleted)
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockScript]).then(resolve)
        return chain
      })

      // select 2: all changed scripts (for deleted detection)
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([{ ...mockScript, deletedAt: null }]).then(resolve)
        return chain
      })

      // select 3: rules for changed scripts
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([mockRule]).then(resolve)
        return chain
      })

      const res = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        payload: {
          clientVersion: 0,
          lastSyncAt: 0,
          changes: {},
        },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.serverVersion).toBe(1)
      expect(body.syncedAt).toBeGreaterThan(0)
      expect(body.changes.scripts).toHaveLength(1)
      expect(body.changes.rules).toHaveLength(1)
      expect(body.conflicts).toEqual([])
    })

    it('pull returns empty changes when nothing updated', async () => {
      // All selects return empty
      mockDb.select
        .mockImplementationOnce(() => {
          const chain: Record<string, unknown> = {}
          chain.from = vi.fn().mockReturnValue(chain)
          chain.where = vi.fn().mockReturnValue(chain)
          chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
          return chain
        })
        .mockImplementationOnce(() => {
          const chain: Record<string, unknown> = {}
          chain.from = vi.fn().mockReturnValue(chain)
          chain.where = vi.fn().mockReturnValue(chain)
          chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
          return chain
        })

      const res = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        payload: {
          clientVersion: 5,
          lastSyncAt: Date.now(),
          changes: {},
        },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.changes.scripts).toEqual([])
      expect(body.changes.rules).toEqual([])
      expect(body.changes.deletedScriptIds).toEqual([])
      expect(body.conflicts).toEqual([])
    })

    it('pull detects deleted scripts', async () => {
      // select 1: changed scripts (not deleted) — empty
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve)
        return chain
      })

      // select 2: all changed scripts — includes deleted
      mockDb.select.mockImplementationOnce(() => {
        const chain: Record<string, unknown> = {}
        chain.from = vi.fn().mockReturnValue(chain)
        chain.where = vi.fn().mockReturnValue(chain)
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve([
          { id: '550e8400-e29b-41d4-a716-446655440000', deletedAt: new Date() },
        ]).then(resolve)
        return chain
      })

      const res = await app.inject({
        method: 'POST',
        url: '/sync/pull',
        payload: {
          clientVersion: 0,
          lastSyncAt: 0,
          changes: {},
        },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.changes.deletedScriptIds).toContain('550e8400-e29b-41d4-a716-446655440000')
    })
  })
})
