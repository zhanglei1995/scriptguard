import { describe, it, expect } from 'vitest';
import {
  setPageCheckState,
  getPageCheckState,
  clearPageCheckState,
  setCommToken,
  getCommToken,
  clearCommToken,
  setTabCheckStatus,
  getTabCheckStatus,
  clearTabCheckStatus,
  cleanupSessionForTab,
} from '../session';

describe('Session Storage', () => {
  describe('Page Check State', () => {
    it('sets and gets page check state', async () => {
      const state = {
        url: 'https://example.com',
        scriptId: 's1',
        status: 'running' as const,
        startedAt: Date.now(),
      };
      await setPageCheckState(1, state);
      const result = await getPageCheckState(1);
      expect(result).toEqual(state);
    });

    it('clears page check state', async () => {
      await setPageCheckState(1, {
        url: 'https://example.com',
        scriptId: 's1',
        status: 'pending',
        startedAt: Date.now(),
      });
      await clearPageCheckState(1);
      const result = await getPageCheckState(1);
      expect(result).toBeUndefined();
    });
  });

  describe('Communication Tokens', () => {
    it('sets and gets comm token', async () => {
      await setCommToken(1, 'token-abc', 60000);
      const result = await getCommToken(1);
      expect(result).toBe('token-abc');
    });

    it('returns null for expired token', async () => {
      await setCommToken(1, 'token-expired', -1); // Already expired
      const result = await getCommToken(1);
      expect(result).toBeNull();
    });

    it('clears comm token', async () => {
      await setCommToken(1, 'token-xyz');
      await clearCommToken(1);
      const result = await getCommToken(1);
      expect(result).toBeNull();
    });
  });

  describe('Tab Check Status', () => {
    it('sets and gets tab check status', async () => {
      const status = {
        tabId: 1,
        isChecking: true,
        scriptIds: ['s1', 's2'],
        startedAt: Date.now(),
      };
      await setTabCheckStatus(status);
      const result = await getTabCheckStatus(1);
      expect(result).toEqual(status);
    });

    it('clears tab check status', async () => {
      await setTabCheckStatus({ tabId: 1, isChecking: true, scriptIds: [] });
      await clearTabCheckStatus(1);
      const result = await getTabCheckStatus(1);
      expect(result).toBeUndefined();
    });
  });

  describe('Cleanup', () => {
    it('cleans up all session data for tab', async () => {
      await setPageCheckState(1, {
        url: 'https://example.com',
        scriptId: 's1',
        status: 'running',
        startedAt: Date.now(),
      });
      await setCommToken(1, 'token-123');
      await setTabCheckStatus({ tabId: 1, isChecking: true, scriptIds: ['s1'] });

      await cleanupSessionForTab(1);

      expect(await getPageCheckState(1)).toBeUndefined();
      expect(await getCommToken(1)).toBeNull();
      expect(await getTabCheckStatus(1)).toBeUndefined();
    });
  });
});
