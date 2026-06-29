/**
 * Selector Exists Executor Tests
 *
 * SG-016: Rule Executor Interface and Base Class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SelectorExistsExecutor } from '../executors/selector-exists';
import type { CheckRule, ExecutionContext } from '../types';

describe('SelectorExistsExecutor', () => {
  let executor: SelectorExistsExecutor;
  let doc: Document;
  let ctx: ExecutionContext;

  beforeEach(() => {
    executor = new SelectorExistsExecutor();
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
    expect(executor.type).toBe('selector_exists');
  });

  it('passes when element exists', async () => {
    doc.body.innerHTML = '<div id="target">Hello</div>';

    const rule: CheckRule = {
      id: 'r1',
      name: 'exists',
      type: 'selector_exists',
      config: { selector: '#target' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails when element does not exist', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'exists',
      type: 'selector_exists',
      config: { selector: '#missing' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('fails when selector is missing from config', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'exists',
      type: 'selector_exists',
      config: {},
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('passes with complex selector', async () => {
    doc.body.innerHTML = '<div class="container"><span data-role="status">Active</span></div>';

    const rule: CheckRule = {
      id: 'r1',
      name: 'exists',
      type: 'selector_exists',
      config: { selector: '.container > [data-role="status"]' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('passes when multiple elements match', async () => {
    doc.body.innerHTML = '<div class="item">1</div><div class="item">2</div>';

    const rule: CheckRule = {
      id: 'r1',
      name: 'exists',
      type: 'selector_exists',
      config: { selector: '.item' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });
});
