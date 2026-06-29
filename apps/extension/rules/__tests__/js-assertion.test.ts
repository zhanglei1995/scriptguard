/**
 * JS Assertion Executor Tests
 *
 * SG-017: 6 MVP Rule Executors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JsAssertionExecutor } from '../executors/js-assertion';
import type { CheckRule, ExecutionContext } from '../types';

describe('JsAssertionExecutor', () => {
  let executor: JsAssertionExecutor;
  let doc: Document;
  let ctx: ExecutionContext;

  beforeEach(() => {
    executor = new JsAssertionExecutor();
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
    expect(executor.type).toBe('js_assertion');
  });

  it('passes for truthy expression', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: { expression: '1 === 1' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails for falsy expression', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: { expression: '1 === 2' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('passes when expression accesses document', async () => {
    doc.body.innerHTML = '<div id="app">App</div>';

    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: { expression: 'document.querySelector("#app") !== null' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails when expression accesses missing element', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: { expression: 'document.querySelector("#missing") !== null' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('fails for invalid expression', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: { expression: 'this is not valid {{{' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('fails when expression is missing', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: {},
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('handles expression that throws', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: { expression: 'JSON.parse("{invalid")' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('passes for truthy non-boolean values', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: { expression: '"hello".length' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails for zero', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'js',
      type: 'js_assertion',
      config: { expression: '0' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });
});
