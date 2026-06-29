/**
 * LogStore 单元测试
 * SG-022: 本地运行日志
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogStore } from '../log-store';
import { getDB, resetDB } from '../../storage/db';
import type { CheckRecord } from '../../storage/schemas';

// ====== Helpers ======
function createCheckRecord(overrides: Partial<CheckRecord> = {}): Omit<CheckRecord, 'id'> {
  return {
    scriptId: 'test-script-1',
    timestamp: new Date(),
    status: 'healthy',
    url: 'https://example.com',
    duration: 100,
    failedRules: [],
    ...overrides,
  };
}

// ====== Tests ======
describe('LogStore', () => {
  let store: LogStore;

  beforeEach(async () => {
    await resetDB();
    store = new LogStore();
  });

  describe('addCheck', () => {
    it('should add a check record', async () => {
      const record = createCheckRecord();
      const id = await store.addCheck(record);

      expect(id).toBeGreaterThan(0);

      const saved = await store.getCheckById(id);
      expect(saved).toBeDefined();
      expect(saved?.scriptId).toBe('test-script-1');
      expect(saved?.status).toBe('healthy');
    });
  });

  describe('getChecks', () => {
    beforeEach(async () => {
      // Add test data
      await store.addCheck(
        createCheckRecord({
          scriptId: 'script-a',
          status: 'healthy',
          timestamp: new Date('2024-01-01'),
        }),
      );
      await store.addCheck(
        createCheckRecord({
          scriptId: 'script-b',
          status: 'failed',
          timestamp: new Date('2024-01-02'),
        }),
      );
      await store.addCheck(
        createCheckRecord({
          scriptId: 'script-a',
          status: 'failed',
          timestamp: new Date('2024-01-03'),
        }),
      );
      await store.addCheck(
        createCheckRecord({
          scriptId: 'script-c',
          status: 'healthy',
          timestamp: new Date('2024-01-04'),
        }),
      );
    });

    it('should return all records when no filters', async () => {
      const logs = await store.getChecks();
      expect(logs).toHaveLength(4);
    });

    it('should filter by scriptId', async () => {
      const logs = await store.getChecks({ scriptId: 'script-a' });
      expect(logs).toHaveLength(2);
      logs.forEach((log) => expect(log.scriptId).toBe('script-a'));
    });

    it('should filter by status', async () => {
      const logs = await store.getChecks({ status: 'failed' });
      expect(logs).toHaveLength(2);
      logs.forEach((log) => expect(log.status).toBe('failed'));
    });

    it('should filter by time range', async () => {
      const logs = await store.getChecks({
        startTime: new Date('2024-01-02'),
        endTime: new Date('2024-01-03'),
      });
      expect(logs).toHaveLength(2);
    });

    it('should combine filters', async () => {
      const logs = await store.getChecks({
        scriptId: 'script-a',
        status: 'failed',
      });
      expect(logs).toHaveLength(1);
      const first = logs[0];
      expect(first).toBeDefined();
      expect(first?.scriptId).toBe('script-a');
      expect(first?.status).toBe('failed');
    });

    it('should sort by timestamp descending', async () => {
      const logs = await store.getChecks();
      for (let i = 1; i < logs.length; i++) {
        const prev = logs[i - 1];
        const curr = logs[i];
        expect(prev?.timestamp.getTime()).toBeGreaterThanOrEqual(curr?.timestamp.getTime() ?? 0);
      }
    });
  });

  describe('getCheckById', () => {
    it('should return a record by id', async () => {
      const id = await store.addCheck(createCheckRecord());
      const record = await store.getCheckById(id);

      expect(record).toBeDefined();
      expect(record?.id).toBe(id);
    });

    it('should return undefined for non-existent id', async () => {
      const record = await store.getCheckById(99999);
      expect(record).toBeUndefined();
    });
  });

  describe('deleteOldRecords', () => {
    it('should delete records older than 30 days', async () => {
      const now = Date.now();
      const thirtyOneDaysAgo = new Date(now - 31 * 24 * 60 * 60 * 1000);
      const twentyNineDaysAgo = new Date(now - 29 * 24 * 60 * 60 * 1000);

      await store.addCheck(createCheckRecord({ timestamp: thirtyOneDaysAgo }));
      await store.addCheck(createCheckRecord({ timestamp: twentyNineDaysAgo }));

      const result = await store.deleteOldRecords();
      expect(result.checks).toBe(1);

      const remaining = await store.getChecks();
      expect(remaining).toHaveLength(1);
    });
  });

  describe('exportCSV', () => {
    it('should generate CSV without errors', async () => {
      await store.addCheck(createCheckRecord({ failedRules: ['rule-1', 'rule-2'] }));
      await store.addCheck(createCheckRecord({ status: 'failed', errorMessage: 'Test error' }));

      // Mock URL and document methods
      const mockClick = vi.fn();
      const mockRevokeObjectURL = vi.fn();
      const mockCreateObjectURL = vi.fn(() => 'blob:mock');

      vi.stubGlobal('URL', {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      });

      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
      };
      vi.stubGlobal('document', {
        createElement: vi.fn(() => mockLink),
      });

      store.exportCSV();

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });
});
