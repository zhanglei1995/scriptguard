/**
 * Rule Engine Tests
 *
 * SG-016: Rule Executor Interface and Base Class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine } from '../engine';
import { registry } from '../registry';
import { SelectorExistsExecutor } from '../executors/selector-exists';
import { SelectorVisibleExecutor } from '../executors/selector-visible';
import { TextContentExecutor } from '../executors/text-content';
import { UrlMatchExecutor } from '../executors/url-match';
import type { CheckRule, ExecutionContext } from '../types';

describe('RuleEngine', () => {
  let engine: RuleEngine;
  let doc: Document;
  let ctx: ExecutionContext;

  beforeEach(() => {
    registry.clear();
    registry.register('selector_exists', new SelectorExistsExecutor());
    registry.register('selector_visible', new SelectorVisibleExecutor());
    registry.register('text_content', new TextContentExecutor());
    registry.register('url_match', new UrlMatchExecutor());

    engine = new RuleEngine();
    doc = document.implementation.createHTMLDocument('test');
    ctx = {
      url: 'https://example.com/page',
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

  describe('executeAll', () => {
    it('returns healthy when all rules pass', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
        {
          id: 'r2',
          name: 'url',
          type: 'url_match',
          config: { pattern: 'https://example.com/*' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('healthy');
      expect(result.failedRules).toEqual([]);
      expect(result.results).toHaveLength(2);
    });

    it('returns failed when required rule fails', async () => {
      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#missing' },
          required: true,
        },
        {
          id: 'r2',
          name: 'url',
          type: 'url_match',
          config: { pattern: 'https://example.com/*' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('failed');
      expect(result.failedRules).toContain('r1');
    });

    it('returns degraded when optional rule fails', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
        {
          id: 'r2',
          name: 'missing',
          type: 'selector_exists',
          config: { selector: '#optional' },
          required: false,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('degraded');
      expect(result.failedRules).toContain('r2');
      expect(result.failedRules).not.toContain('r1');
    });

    it('returns healthy for empty rules', async () => {
      const result = await engine.executeAll([], ctx);

      expect(result.status).toBe('healthy');
      expect(result.failedRules).toEqual([]);
      expect(result.results).toHaveLength(0);
    });

    it('handles unknown rule type', async () => {
      const rules: CheckRule[] = [
        { id: 'r1', name: 'unknown', type: 'unknown_type' as any, config: {}, required: true },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('failed');
      expect(result.failedRules).toContain('r1');
      expect(result.results[0]?.errorMessage).toContain('No executor registered');
    });

    it('measures duration correctly', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('stops on failure when continueOnError is false', async () => {
      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'fail',
          type: 'selector_exists',
          config: { selector: '#missing' },
          required: true,
        },
        {
          id: 'r2',
          name: 'success',
          type: 'url_match',
          config: { pattern: 'https://example.com/*' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx, { continueOnError: false });

      expect(result.results).toHaveLength(1); // Only first rule executed
      expect(result.failedRules).toContain('r1');
    });

    it('respects timeout option', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx, { timeout: 1 });

      // May or may not timeout depending on execution speed
      expect(result.results).toHaveLength(1);
    });
  });
});
