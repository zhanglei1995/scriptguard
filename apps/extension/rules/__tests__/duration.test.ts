/**
 * Duration Executor Tests
 *
 * SG-017: 6 MVP Rule Executors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DurationExecutor } from '../executors/duration';
import type { CheckRule, ExecutionContext } from '../types';

describe('DurationExecutor', () => {
  let executor: DurationExecutor;
  let doc: Document;
  let ctx: ExecutionContext;

  function createCtxWithPerf(loadEnd: number, startTime: number = 0): ExecutionContext {
    const perfEntries = [
      {
        loadEventEnd: loadEnd,
        startTime,
        entryType: 'navigation',
      },
    ];

    const mockPerf = {
      getEntriesByType: vi.fn(() => perfEntries),
    };

    const mockWindow = {
      performance: mockPerf,
    } as unknown as Window;

    return {
      url: 'https://example.com',
      document: doc,
      window: mockWindow,
      pageContext: {
        getTitle: () => doc.title,
        getMeta: () => null,
        getElementCount: () => 0,
      },
      timeout: 5000,
      signal: new AbortController().signal,
      capturedErrors: [],
      capturedRequests: [],
    };
  }

  beforeEach(() => {
    executor = new DurationExecutor();
    doc = document.implementation.createHTMLDocument('test');
    ctx = {
      url: 'https://example.com',
      document: doc,
      window: doc.defaultView!,
      pageContext: {
        getTitle: () => doc.title,
        getMeta: () => null,
        getElementCount: () => 0,
      },
      timeout: 5000,
      signal: new AbortController().signal,
      capturedErrors: [],
      capturedRequests: [],
    };
  });

  it('has correct type', () => {
    expect(executor.type).toBe('duration');
  });

  it('passes when load time is within threshold', async () => {
    ctx = createCtxWithPerf(1500, 0);

    const rule: CheckRule = {
      id: 'r1',
      name: 'duration',
      type: 'duration',
      config: { maxDuration: 2000 },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails when load time exceeds threshold', async () => {
    ctx = createCtxWithPerf(5000, 0);

    const rule: CheckRule = {
      id: 'r1',
      name: 'duration',
      type: 'duration',
      config: { maxDuration: 3000 },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('passes when load time exactly equals threshold', async () => {
    ctx = createCtxWithPerf(2000, 0);

    const rule: CheckRule = {
      id: 'r1',
      name: 'duration',
      type: 'duration',
      config: { maxDuration: 2000 },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails when maxDuration is missing', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'duration',
      type: 'duration',
      config: {},
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('fails when maxDuration is negative', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'duration',
      type: 'duration',
      config: { maxDuration: -100 },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('fails when performance API is unavailable', async () => {
    const mockWindow = {
      performance: undefined,
    } as unknown as Window;

    const customCtx: ExecutionContext = {
      ...ctx,
      window: mockWindow,
    };

    const rule: CheckRule = {
      id: 'r1',
      name: 'duration',
      type: 'duration',
      config: { maxDuration: 5000 },
      required: true,
    };

    const result = await executor.execute(rule, customCtx);
    expect(result.status).toBe('failed');
  });

  it('fails when no navigation entries exist', async () => {
    const mockPerf = {
      getEntriesByType: vi.fn(() => []),
    };

    const mockWindow = {
      performance: mockPerf,
    } as unknown as Window;

    const customCtx: ExecutionContext = {
      ...ctx,
      window: mockWindow,
    };

    const rule: CheckRule = {
      id: 'r1',
      name: 'duration',
      type: 'duration',
      config: { maxDuration: 5000 },
      required: true,
    };

    const result = await executor.execute(rule, customCtx);
    expect(result.status).toBe('failed');
  });

  it('calculates duration from startTime to loadEventEnd', async () => {
    ctx = createCtxWithPerf(3000, 1000);

    const rule: CheckRule = {
      id: 'r1',
      name: 'duration',
      type: 'duration',
      config: { maxDuration: 2001 },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });
});
