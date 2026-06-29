/**
 * SyncManager 单元测试
 * SG-031: 同步协议（增量同步 + 冲突解决）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncManager } from '../sync';

// ====== Hoisted Mocks ======
const { mockGet, mockSet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
}));

vi.mock('../../storage/chrome', () => ({
  scriptsStore: { get: mockGet, set: mockSet },
  rulesStore: { get: mockGet, set: mockSet },
  syncMetaStore: { get: mockGet, set: mockSet },
  authStore: { get: vi.fn().mockResolvedValue('test-token') },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({ authToken: 'test-token' }),
    },
  },
});

// ====== Tests ======
describe('SyncManager', () => {
  let syncManager: SyncManager;

  beforeEach(() => {
    vi.resetAllMocks();
    mockGet.mockResolvedValue(undefined);
    mockSet.mockResolvedValue(undefined);
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({ authToken: 'test-token' }),
        },
      },
    });
    syncManager = new SyncManager('https://api.example.com');
  });

  describe('push', () => {
    it('sends local changes to server', async () => {
      // Call order: syncMetaStore.get, scriptsStore.get, rulesStore.get
      mockGet
        .mockResolvedValueOnce({ lastSyncAt: 0, lastSyncVersion: '0' })
        .mockResolvedValueOnce([{ id: 'script-1', name: 'Test', createdAt: 1000, updatedAt: 1000 }])
        .mockResolvedValueOnce([]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            serverVersion: 1,
            syncedAt: Date.now(),
            changes: { scripts: [], rules: [], deletedScriptIds: [] },
            conflicts: [],
          }),
      });

      const result = await syncManager.push();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/sync/push',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
      expect(result.conflicts).toEqual([]);
    });

    it('handles push with conflicts', async () => {
      mockGet
        .mockResolvedValueOnce({ lastSyncAt: 0, lastSyncVersion: '0' })
        .mockResolvedValueOnce([
          { id: 'script-1', name: 'Local', createdAt: 1000, updatedAt: 1000 },
        ])
        .mockResolvedValueOnce([]);

      const serverConflict = {
        id: 'script-1',
        userId: 'user-1',
        name: 'Server',
        updatedAt: new Date(),
        config: {},
        matchRules: [],
        runAt: 'document_idle',
        enabled: true,
        version: '1.0.0',
        description: null,
        teamId: null,
        createdAt: new Date(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            serverVersion: 1,
            syncedAt: Date.now(),
            changes: { scripts: [], rules: [], deletedScriptIds: [] },
            conflicts: [
              {
                entity: 'script',
                id: 'script-1',
                local: { id: 'script-1', name: 'Local' },
                server: serverConflict,
              },
            ],
          }),
      });

      const result = await syncManager.push();
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].entity).toBe('script');
    });

    it('throws if sync already in progress', async () => {
      mockGet
        .mockResolvedValueOnce({ lastSyncAt: 0, lastSyncVersion: '0' })
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockFetch.mockImplementation(() => new Promise(() => {}));

      const promise1 = syncManager.push();
      await expect(syncManager.push()).rejects.toThrow('Sync already in progress');
    });
  });

  describe('pull', () => {
    it('pulls changes from server', async () => {
      // Call order: syncMetaStore.get, scriptsStore.get (for merge), rulesStore.get (for merge)
      mockGet
        .mockResolvedValueOnce({ lastSyncAt: 0, lastSyncVersion: '0' })
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            serverVersion: 1,
            syncedAt: Date.now(),
            changes: {
              scripts: [
                {
                  id: 'script-1',
                  name: 'Server Script',
                  code: 'code',
                  matchRules: [],
                  runAt: 'document_idle',
                  enabled: true,
                  config: {},
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  description: null,
                  teamId: null,
                  version: '1.0.0',
                  userId: 'user-1',
                },
              ],
              rules: [],
              deletedScriptIds: [],
            },
            conflicts: [],
          }),
      });

      const result = await syncManager.pull(0);

      expect(result.changes.scripts).toHaveLength(1);
      expect(mockSet).toHaveBeenCalled();
    });

    it('pull returns empty changes', async () => {
      mockGet.mockResolvedValueOnce({ lastSyncAt: Date.now(), lastSyncVersion: '5' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            serverVersion: 6,
            syncedAt: Date.now(),
            changes: { scripts: [], rules: [], deletedScriptIds: [] },
            conflicts: [],
          }),
      });

      const result = await syncManager.pull(Date.now());
      expect(result.changes.scripts).toEqual([]);
    });

    it('applies deleted script IDs', async () => {
      // Call order: syncMetaStore.get, scriptsStore.get (for deletion filter)
      mockGet
        .mockResolvedValueOnce({ lastSyncAt: 0, lastSyncVersion: '0' })
        .mockResolvedValueOnce([{ id: 'script-1', name: 'To Delete' }]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            serverVersion: 1,
            syncedAt: Date.now(),
            changes: {
              scripts: [],
              rules: [],
              deletedScriptIds: ['script-1'],
            },
            conflicts: [],
          }),
      });

      await syncManager.pull(0);

      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('resolveConflict', () => {
    it('resolves conflict with server version', async () => {
      const serverScript = {
        id: 'script-1',
        name: 'Server Version',
        code: 'server code',
        matchRules: [],
        runAt: 'document_idle',
        enabled: true,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        teamId: null,
        version: '1.0.0',
        userId: 'user-1',
      };

      mockGet.mockResolvedValueOnce([{ id: 'script-1', name: 'Local Version' }]);

      await syncManager.resolveConflict(
        {
          entity: 'script',
          id: 'script-1',
          local: { name: 'Local Version' },
          server: serverScript,
        },
        'server',
      );

      expect(mockSet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'script-1', name: 'Server Version' }),
        ]),
      );
    });

    it('resolves conflict with local version', async () => {
      mockGet.mockResolvedValueOnce([{ id: 'script-1', name: 'Local Version' }]);

      await syncManager.resolveConflict(
        {
          entity: 'script',
          id: 'script-1',
          local: { name: 'Local Version' },
          server: { name: 'Server Version' },
        },
        'local',
      );

      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('sync', () => {
    it('performs full bidirectional sync', async () => {
      // pull: syncMetaStore.get
      // push: syncMetaStore.get, scriptsStore.get, rulesStore.get
      mockGet
        .mockResolvedValueOnce({ lastSyncAt: 0, lastSyncVersion: '0' })
        .mockResolvedValueOnce({ lastSyncAt: 0, lastSyncVersion: '0' })
        .mockResolvedValueOnce([
          { id: 'script-1', name: 'Local', createdAt: 1000, updatedAt: 1000 },
        ])
        .mockResolvedValueOnce([]);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              serverVersion: 1,
              syncedAt: 1000,
              changes: { scripts: [], rules: [], deletedScriptIds: [] },
              conflicts: [],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              serverVersion: 2,
              syncedAt: 2000,
              changes: { scripts: [], rules: [], deletedScriptIds: [] },
              conflicts: [],
            }),
        });

      const result = await syncManager.sync();
      expect(result.serverVersion).toBe(2);
    });
  });
});
