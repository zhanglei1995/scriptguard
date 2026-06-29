/**
 * Selector Visible Executor Tests
 *
 * SG-016: Rule Executor Interface and Base Class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectorVisibleExecutor } from '../executors/selector-visible';
import type { CheckRule, ExecutionContext } from '../types';

describe('SelectorVisibleExecutor', () => {
  let executor: SelectorVisibleExecutor;
  let doc: Document;
  let ctx: ExecutionContext;

  beforeEach(() => {
    executor = new SelectorVisibleExecutor();
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
    expect(executor.type).toBe('selector_visible');
  });

  it('passes when element has dimensions', async () => {
    doc.body.innerHTML = '<div id="box">Box</div>';

    const el = doc.querySelector('#box') as HTMLElement;
    Object.defineProperty(el, 'offsetWidth', { value: 100, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: 100, configurable: true });

    const rule: CheckRule = {
      id: 'r1',
      name: 'visible',
      type: 'selector_visible',
      config: { selector: '#box' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('passed');
  });

  it('fails when element does not exist', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'visible',
      type: 'selector_visible',
      config: { selector: '#missing' },
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });

  it('passes when getComputedStyle shows visible', async () => {
    doc.body.innerHTML = '<div id="box">Box</div>';

    const mockGetComputedStyle = vi.fn(() => ({
      display: 'block',
      visibility: 'visible',
    }));

    // Mock ctx.window.getComputedStyle
    const mockWindow = {
      getComputedStyle: mockGetComputedStyle,
    } as unknown as Window;

    const rule: CheckRule = {
      id: 'r1',
      name: 'visible',
      type: 'selector_visible',
      config: { selector: '#box' },
      required: true,
    };

    const result = await executor.execute(rule, { ...ctx, window: mockWindow });
    expect(result.status).toBe('passed');
  });

  it('fails when getComputedStyle shows display none', async () => {
    doc.body.innerHTML = '<div id="box">Box</div>';

    const mockGetComputedStyle = vi.fn(() => ({
      display: 'none',
      visibility: 'visible',
    }));

    const mockWindow = {
      getComputedStyle: mockGetComputedStyle,
    } as unknown as Window;

    const rule: CheckRule = {
      id: 'r1',
      name: 'visible',
      type: 'selector_visible',
      config: { selector: '#box' },
      required: true,
    };

    const result = await executor.execute(rule, { ...ctx, window: mockWindow });
    expect(result.status).toBe('failed');
  });

  it('fails when selector is missing', async () => {
    const rule: CheckRule = {
      id: 'r1',
      name: 'visible',
      type: 'selector_visible',
      config: {},
      required: true,
    };

    const result = await executor.execute(rule, ctx);
    expect(result.status).toBe('failed');
  });
});
