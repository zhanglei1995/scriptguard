import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  scriptsStore,
  rulesStore,
  schedulesStore,
  channelsStore,
  preferencesStore,
  syncMetaStore,
  authStore,
  defaultPreferences,
  defaultSyncMeta,
} from '../chrome';

describe('Chrome Storage', () => {
  describe('scriptsStore', () => {
    it('sets and gets scripts', async () => {
      const now = Date.now();
      const scripts = [
        {
          id: '1',
          name: 'Script 1',
          version: '1.0.0',
          alertLevel: 'medium' as const,
          description: '',
          code: '',
          matchRules: [],
          runAt: 'document_idle' as const,
          enabled: true,
          tags: [],
          groupId: null,
          config: {},
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          name: 'Script 2',
          version: '2.0.0',
          alertLevel: 'high' as const,
          description: '',
          code: '',
          matchRules: [],
          runAt: 'document_idle' as const,
          enabled: true,
          tags: [],
          groupId: null,
          config: {},
          createdAt: now,
          updatedAt: now,
        },
      ];
      await scriptsStore.set(scripts);
      const result = await scriptsStore.get();
      expect(result).toEqual(scripts);
    });

    it('validates data on set', async () => {
      await expect(scriptsStore.set([{ id: 123 } as any])).rejects.toThrow();
    });

    it('removes scripts', async () => {
      const now = Date.now();
      await scriptsStore.set([
        {
          id: '1',
          name: 'Test',
          version: '1.0',
          alertLevel: 'low' as const,
          description: '',
          code: '',
          matchRules: [],
          runAt: 'document_idle' as const,
          enabled: true,
          tags: [],
          groupId: null,
          config: {},
          createdAt: now,
          updatedAt: now,
        },
      ]);
      await scriptsStore.remove();
      const result = await scriptsStore.get();
      expect(result).toEqual([]);
    });
  });

  describe('rulesStore', () => {
    it('sets and gets rules', async () => {
      const legacyRules = [
        {
          id: '1',
          scriptId: 's1',
          type: 'selector' as const,
          target: '.btn',
          operator: 'exists' as const,
          enabled: true,
        },
      ];
      await rulesStore.set(legacyRules as never);
      const result = await rulesStore.get();
      expect(result).toEqual([
        {
          id: '1',
          scriptId: 's1',
          name: '.btn',
          type: 'selector_exists',
          config: { selector: '.btn' },
          required: true,
          enabled: true,
          timeout: 5000,
          alertLevel: 'medium',
          order: 0,
        },
      ]);
    });
  });

  describe('schedulesStore', () => {
    it('sets and gets schedules', async () => {
      const schedules = [{ id: '1', scriptId: 's1', intervalMinutes: 30, enabled: true }];
      await schedulesStore.set(schedules);
      const result = await schedulesStore.get();
      expect(result).toEqual(schedules);
    });
  });

  describe('channelsStore', () => {
    it('sets and gets channels', async () => {
      const channels = [{ id: '1', type: 'browser' as const, enabled: true, config: {} }];
      await channelsStore.set(channels);
      const result = await channelsStore.get();
      expect(result).toEqual(channels);
    });
  });

  describe('preferencesStore', () => {
    it('sets and gets preferences', async () => {
      await preferencesStore.set(defaultPreferences);
      const result = await preferencesStore.get();
      expect(result).toEqual(defaultPreferences);
    });
  });

  describe('syncMetaStore', () => {
    it('sets and gets sync meta', async () => {
      const meta = { lastSyncAt: Date.now(), lastSyncVersion: '1.0', cloudId: 'abc' };
      await syncMetaStore.set(meta);
      const result = await syncMetaStore.get();
      expect(result).toEqual(meta);
    });
  });

  describe('authStore', () => {
    it('sets and gets auth token', async () => {
      await authStore.set('test-token-123');
      const result = await authStore.get();
      expect(result).toBe('test-token-123');
    });

    it('validates token is string', async () => {
      await expect(authStore.set(123 as any)).rejects.toThrow();
    });
  });
});
