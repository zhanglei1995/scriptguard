import { describe, it, expect, beforeEach } from 'vitest';
import {
  ScriptCurrent,
  CheckRule,
  LocalSchedule,
  NotifyChannel,
  UserPreferences,
  SyncMeta,
  CheckRecord,
  DomSnapshot,
  AlertRecord,
  ScriptV1,
  ScriptV2,
  migrateScript,
} from '../schemas';

describe('Schemas', () => {
  describe('ScriptV1', () => {
    it('validates valid script', () => {
      const script = { id: '1', name: 'Test', version: '1.0.0' };
      expect(ScriptV1.parse(script)).toEqual(script);
    });

    it('rejects invalid script', () => {
      expect(() => ScriptV1.parse({ id: 123 })).toThrow();
    });
  });

  describe('ScriptV2 (ScriptCurrent)', () => {
    it('validates script with alertLevel', () => {
      const now = Date.now();
      const script = {
        id: '1',
        name: 'Test',
        version: '1.0.0',
        alertLevel: 'medium',
        createdAt: now,
        updatedAt: now,
      };
      const parsed = ScriptCurrent.parse(script);
      expect(parsed.id).toBe('1');
      expect(parsed.name).toBe('Test');
      expect(parsed.alertLevel).toBe('medium');
      expect(parsed.createdAt).toBe(now);
      expect(parsed.enabled).toBe(true);
      expect(parsed.tags).toEqual([]);
    });

    it('rejects invalid alertLevel', () => {
      const script = { id: '1', name: 'Test', version: '1.0.0', alertLevel: 'invalid' };
      expect(() => ScriptCurrent.parse(script)).toThrow();
    });
  });

  describe('CheckRule', () => {
    it('validates check rule with defaults', () => {
      const rule = { id: '1', scriptId: 's1', type: 'selector', target: '.btn' };
      const parsed = CheckRule.parse(rule);
      expect(parsed.type).toBe('selector_exists');
      expect(parsed.config).toEqual({ selector: '.btn' });
      expect(parsed.required).toBe(true);
      expect(parsed.enabled).toBe(true);
    });
  });

  describe('LocalSchedule', () => {
    it('validates schedule', () => {
      const schedule = { id: '1', scriptId: 's1', intervalMinutes: 30 };
      const parsed = LocalSchedule.parse(schedule);
      expect(parsed.enabled).toBe(true);
    });

    it('rejects interval < 1', () => {
      expect(() => LocalSchedule.parse({ id: '1', scriptId: 's1', intervalMinutes: 0 })).toThrow();
    });
  });

  describe('NotifyChannel', () => {
    it('validates channel with defaults', () => {
      const channel = { id: '1', type: 'browser' };
      const parsed = NotifyChannel.parse(channel);
      expect(parsed.enabled).toBe(true);
      expect(parsed.config).toEqual({});
    });
  });

  describe('UserPreferences', () => {
    it('validates with defaults', () => {
      const prefs = UserPreferences.parse({});
      expect(prefs.theme).toBe('system');
      expect(prefs.language).toBe('zh-CN');
      expect(prefs.autoCheck).toBe(true);
    });
  });

  describe('SyncMeta', () => {
    it('validates empty sync meta', () => {
      expect(SyncMeta.parse({})).toEqual({});
    });

    it('validates full sync meta', () => {
      const meta = { lastSyncAt: Date.now(), lastSyncVersion: '1.0', cloudId: 'abc' };
      expect(SyncMeta.parse(meta)).toEqual(meta);
    });
  });

  describe('CheckRecord', () => {
    it('validates check record', () => {
      const record = {
        scriptId: 's1',
        timestamp: new Date(),
        status: 'healthy',
        url: 'https://example.com',
        duration: 100,
        failedRules: [],
      };
      expect(CheckRecord.parse(record)).toBeDefined();
    });
  });

  describe('DomSnapshot', () => {
    it('validates snapshot', () => {
      const snapshot = {
        scriptId: 's1',
        url: 'https://example.com',
        html: '<html></html>',
        timestamp: new Date(),
        reason: 'failure',
      };
      expect(DomSnapshot.parse(snapshot)).toBeDefined();
    });
  });

  describe('AlertRecord', () => {
    it('validates alert with defaults', () => {
      const alert = {
        scriptId: 's1',
        timestamp: new Date(),
        level: 'high',
        message: 'Script failed',
      };
      const parsed = AlertRecord.parse(alert);
      expect(parsed.acknowledged).toBe(false);
    });
  });

  describe('migrateScript', () => {
    it('migrates from V1 to V3 (current)', () => {
      const v1Data = { id: '1', name: 'Test', version: '1.0.0' };
      const result = migrateScript(v1Data, 1) as {
        alertLevel: string;
        createdAt: number;
        updatedAt: number;
      };
      expect(result.alertLevel).toBe('medium');
      expect(result.createdAt).toBeGreaterThan(0);
      expect(result.updatedAt).toBeGreaterThan(0);
    });

    it('migrates from V2 to V3 (current)', () => {
      const v2Data = { id: '1', name: 'Test', version: '1.0.0', alertLevel: 'high' };
      const result = migrateScript(v2Data, 2) as {
        alertLevel: string;
        createdAt: number;
        updatedAt: number;
      };
      expect(result.alertLevel).toBe('high');
      expect(result.createdAt).toBeGreaterThan(0);
      expect(result.updatedAt).toBeGreaterThan(0);
    });
  });
});
