import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseAlarmScriptId,
  createCheckAlarm,
  clearCheckAlarm,
  clearAllCheckAlarms,
} from '../alarms';

describe('background/alarms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseAlarmScriptId', () => {
    it('extracts scriptId from check: alarm', () => {
      expect(parseAlarmScriptId('check:script-123')).toBe('script-123');
    });

    it('returns null for non-check alarms', () => {
      expect(parseAlarmScriptId('other-alarm')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseAlarmScriptId('')).toBeNull();
    });

    it('handles check: with empty scriptId', () => {
      expect(parseAlarmScriptId('check:')).toBe('');
    });
  });

  describe('createCheckAlarm', () => {
    it('creates alarm with correct name and interval', async () => {
      await createCheckAlarm('script-1', 300);
      expect(chrome.alarms.create).toHaveBeenCalledWith('check:script-1', {
        delayInMinutes: 5,
        periodInMinutes: 5,
      });
    });
  });

  describe('clearCheckAlarm', () => {
    it('clears specific alarm', async () => {
      await clearCheckAlarm('script-1');
      expect(chrome.alarms.clear).toHaveBeenCalledWith('check:script-1');
    });
  });

  describe('clearAllCheckAlarms', () => {
    it('clears only check: alarms', async () => {
      vi.mocked(chrome.alarms.getAll).mockResolvedValue([
        { name: 'check:s1', scheduledTime: 0 },
        { name: 'other', scheduledTime: 0 },
        { name: 'check:s2', scheduledTime: 0 },
      ] as any);

      await clearAllCheckAlarms();

      expect(chrome.alarms.clear).toHaveBeenCalledTimes(2);
      expect(chrome.alarms.clear).toHaveBeenCalledWith('check:s1');
      expect(chrome.alarms.clear).toHaveBeenCalledWith('check:s2');
    });
  });
});
