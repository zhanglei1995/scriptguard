import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeMessage, registerHandler } from '../router';

describe('background/router', () => {
  const mockSender = {} as chrome.runtime.MessageSender;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes PING message', async () => {
    const result = await routeMessage({ type: 'PING' }, mockSender);
    expect(result).toHaveProperty('type', 'PONG');
    expect(result).toHaveProperty('timestamp');
    expect(typeof (result as any).timestamp).toBe('number');
  });

  it('routes GET_SCRIPTS_FOR_URL message', async () => {
    const result = await routeMessage(
      { type: 'GET_SCRIPTS_FOR_URL', payload: { url: 'https://example.com' } },
      mockSender,
    );
    expect(result).toHaveProperty('type', 'SCRIPTS_RESULT');
    expect((result as any).scripts).toEqual([]);
  });

  it('routes REPORT_CHECK message', async () => {
    const result = await routeMessage(
      {
        type: 'REPORT_CHECK',
        payload: { scriptId: 's1', status: 'healthy', url: 'https://example.com' },
      },
      mockSender,
    );
    expect(result).toEqual({ ok: true });
  });

  it('returns error for unknown message type', async () => {
    const result = await routeMessage({ type: 'UNKNOWN_TYPE' } as any, mockSender);
    expect(result).toHaveProperty('ok', false);
    expect((result as any).error).toContain('Unknown message type');
  });

  it('registers and calls custom handler', async () => {
    registerHandler('CUSTOM', async () => ({ ok: true }) as any);
    const result = await routeMessage({ type: 'CUSTOM' } as any, mockSender);
    expect(result).toEqual({ ok: true });
  });
});
