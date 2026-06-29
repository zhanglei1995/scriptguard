/**
 * Console Clean Executor Tests
 *
 * SG-017: 6 MVP Rule Executors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConsoleCleanExecutor } from '../executors/console-clean';
import type { CheckRule, ExecutionContext } from '../types';

describe('ConsoleCleanExecutor', () => {
  let executor: ConsoleCleanExecutor;
  let doc: Document;
  let ctx: ExecutionContext;

  beforeEach(() => {
    executor = new ConsoleCleanExecutor();
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
    expect(executor.type).toBe('console_clean');
  });

  it('passes when no errors captured', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'console',
      type: 'console_clean',
      config: {},
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails when errors are captured', async () => {
    ctx.capturedErrors = [
      {
        source: 'window',
        type: 'error',
        message: 'Script failed to load',
        timestamp: Date.now(),
      },
    ];

    const rule: CheckRule = {
      id: 'r1',
      name: 'console',
      type: 'console_clean',
      config: {},
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('passes when only non-error types captured', async () => {
    ctx.capturedErrors = [
      {
        source: 'window',
        type: 'unhandledrejection',
        message: 'Promise rejected',
        timestamp: Date.now(),
      },
    ];

    const rule: CheckRule = {
      id: 'r1',
      name: 'console',
      type: 'console_clean',
      config: {},
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('passes when errors match ignore patterns', async () => {
    ctx.capturedErrors = [
      {
        source: 'window',
        type: 'error',
        message: 'Third-party script error',
        timestamp: Date.now(),
      },
    ];

    const rule: CheckRule = {
      id: 'r1',
      name: 'console',
      type: 'console_clean',
      config: { ignorePatterns: ['Third-party'] },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails when errors do not match all ignore patterns', async () => {
    ctx.capturedErrors = [
      {
        source: 'window',
        type: 'error',
        message: 'Critical app error',
        timestamp: Date.now(),
      },
    ];

    const rule: CheckRule = {
      id: 'r1',
      name: 'console',
      type: 'console_clean',
      config: { ignorePatterns: ['Third-party'] },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('handles multiple errors with mixed ignore status', async () => {
    ctx.capturedErrors = [
      {
        source: 'window',
        type: 'error',
        message: 'Third-party script error',
        timestamp: Date.now(),
      },
      {
        source: 'window',
        type: 'error',
        message: 'App runtime error',
        timestamp: Date.now(),
      },
    ];

    const rule: CheckRule = {
      id: 'r1',
      name: 'console',
      type: 'console_clean',
      config: { ignorePatterns: ['Third-party'] },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('passes when all errors match ignore patterns', async () => {
    ctx.capturedErrors = [
      {
        source: 'window',
        type: 'error',
        message: 'Third-party script error',
        timestamp: Date.now(),
      },
      {
        source: 'window',
        type: 'error',
        message: 'Third-party analytics error',
        timestamp: Date.now(),
      },
    ];

    const rule: CheckRule = {
      id: 'r1',
      name: 'console',
      type: 'console_clean',
      config: { ignorePatterns: ['Third-party'] },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails when ignorePatterns is empty and errors exist', async () => {
    ctx.capturedErrors = [
      {
        source: 'window',
        type: 'error',
        message: 'Some error',
        timestamp: Date.now(),
      },
    ];

    const rule: CheckRule = {
      id: 'r1',
      name: 'console',
      type: 'console_clean',
      config: { ignorePatterns: [] },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });
});
