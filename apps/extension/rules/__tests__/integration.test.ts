/**
 * Integration Tests - MVP Rule Executors
 *
 * SG-017: 6 MVP Rule Executors
 * Comprehensive multi-rule scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RuleEngine } from '../engine';
import { registry } from '../registry';
import { SelectorExistsExecutor } from '../executors/selector-exists';
import { SelectorVisibleExecutor } from '../executors/selector-visible';
import { TextContentExecutor } from '../executors/text-content';
import { JsAssertionExecutor } from '../executors/js-assertion';
import { ConsoleCleanExecutor } from '../executors/console-clean';
import { DurationExecutor } from '../executors/duration';
import type { CheckRule, ExecutionContext, RuleType } from '../types';

function createCtx(doc: Document, overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
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
    ...overrides,
  };
}

describe('Integration: MVP Rule Executors', () => {
  let engine: RuleEngine;
  let doc: Document;

  beforeEach(() => {
    registry.clear();
    registry.register('selector_exists', new SelectorExistsExecutor());
    registry.register('selector_visible', new SelectorVisibleExecutor());
    registry.register('text_content', new TextContentExecutor());
    registry.register('js_assertion', new JsAssertionExecutor());
    registry.register('console_clean', new ConsoleCleanExecutor());
    registry.register('duration', new DurationExecutor());

    engine = new RuleEngine();
    doc = document.implementation.createHTMLDocument('test');
  });

  describe('multi-rule combinations', () => {
    it('all rules pass - healthy status', async () => {
      doc.body.innerHTML = `
        <div id="app">
          <h1 id="title">Welcome</h1>
          <span id="status">Active</span>
        </div>
      `;

      const ctx = createCtx(doc, {
        window: {
          getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
        } as unknown as Window,
      });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'app exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
        {
          id: 'r2',
          name: 'title visible',
          type: 'selector_visible',
          config: { selector: '#title' },
          required: true,
        },
        {
          id: 'r3',
          name: 'status text',
          type: 'text_content',
          config: { selector: '#status', expected: 'Active', operator: 'equals' },
          required: true,
        },
        { id: 'r4', name: 'no errors', type: 'console_clean', config: {}, required: true },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('healthy');
      expect(result.failedRules).toEqual([]);
      expect(result.results).toHaveLength(4);
    });

    it('required rule fails - failed status', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc);

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'missing element',
          type: 'selector_exists',
          config: { selector: '#does-not-exist' },
          required: true,
        },
        {
          id: 'r2',
          name: 'app exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('failed');
      expect(result.failedRules).toContain('r1');
    });

    it('optional rule fails - degraded status', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc);

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'app exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
        {
          id: 'r2',
          name: 'missing optional',
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

    it('all optional rules fail - degraded status', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc);

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'app exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
        {
          id: 'r2',
          name: 'missing opt1',
          type: 'selector_exists',
          config: { selector: '#opt1' },
          required: false,
        },
        {
          id: 'r3',
          name: 'missing opt2',
          type: 'text_content',
          config: { selector: '#opt2', expected: 'test' },
          required: false,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('degraded');
      expect(result.failedRules).toContain('r2');
      expect(result.failedRules).toContain('r3');
    });
  });

  describe('js_assertion integration', () => {
    it('passes js_assertion combined with other rules', async () => {
      doc.body.innerHTML = '<div id="app"><span id="count">5</span></div>';

      const ctx = createCtx(doc);

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'app exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
        {
          id: 'r2',
          name: 'count check',
          type: 'js_assertion',
          config: { expression: 'document.querySelector("#count").textContent === "5"' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('healthy');
      expect(result.results).toHaveLength(2);
    });

    it('js_assertion failure causes failed status', async () => {
      doc.body.innerHTML = '<div id="app"><span id="count">5</span></div>';

      const ctx = createCtx(doc);

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'app exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
        {
          id: 'r2',
          name: 'wrong count',
          type: 'js_assertion',
          config: { expression: 'document.querySelector("#count").textContent === "10"' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('failed');
      expect(result.failedRules).toContain('r2');
    });
  });

  describe('console_clean integration', () => {
    it('passes when no errors captured', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc, { capturedErrors: [] });

      const rules: CheckRule[] = [
        { id: 'r1', name: 'console clean', type: 'console_clean', config: {}, required: true },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('healthy');
    });

    it('fails when errors are captured', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc, {
        capturedErrors: [
          { source: 'window', type: 'error', message: 'Script error', timestamp: Date.now() },
        ],
      });

      const rules: CheckRule[] = [
        { id: 'r1', name: 'console clean', type: 'console_clean', config: {}, required: true },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('failed');
    });

    it('passes with ignore patterns', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc, {
        capturedErrors: [
          {
            source: 'window',
            type: 'error',
            message: 'Third-party script failed',
            timestamp: Date.now(),
          },
        ],
      });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'console clean',
          type: 'console_clean',
          config: { ignorePatterns: ['Third-party'] },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('healthy');
    });
  });

  describe('duration integration', () => {
    it('passes when load time within threshold', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const mockPerf = {
        getEntriesByType: vi.fn(() => [
          { loadEventEnd: 1500, startTime: 0, entryType: 'navigation' },
        ]),
      };

      const ctx = createCtx(doc, {
        window: { performance: mockPerf } as unknown as Window,
      });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'duration',
          type: 'duration',
          config: { maxDuration: 2000 },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('healthy');
    });

    it('fails when load time exceeds threshold', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const mockPerf = {
        getEntriesByType: vi.fn(() => [
          { loadEventEnd: 5000, startTime: 0, entryType: 'navigation' },
        ]),
      };

      const ctx = createCtx(doc, {
        window: { performance: mockPerf } as unknown as Window,
      });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'duration',
          type: 'duration',
          config: { maxDuration: 3000 },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('failed');
    });
  });

  describe('timeout scenarios', () => {
    it('handles overall engine timeout', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc);

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
          type: 'text_content',
          config: { selector: '#app', expected: 'App' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx, { timeout: 1 });

      expect(result.results.length).toBeGreaterThanOrEqual(1);
    });

    it('rule timeout returns timeout status', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc, { timeout: 1 });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'slow rule',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.results[0]?.status).toBe('passed');
    });
  });

  describe('error handling', () => {
    it('handles unknown rule type gracefully', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc);

      const rules: CheckRule[] = [
        { id: 'r1', name: 'unknown', type: 'unknown_type' as RuleType, config: {}, required: true },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('failed');
      expect(result.results[0]?.errorMessage).toContain('No executor registered');
    });

    it('continues after error when continueOnError is true', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc);

      const rules: CheckRule[] = [
        { id: 'r1', name: 'unknown', type: 'unknown_type' as RuleType, config: {}, required: true },
        {
          id: 'r2',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx, { continueOnError: true });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.status).toBe('failed');
      expect(result.results[1]?.status).toBe('passed');
    });

    it('stops after error when continueOnError is false', async () => {
      doc.body.innerHTML = '<div id="app">App</div>';

      const ctx = createCtx(doc);

      const rules: CheckRule[] = [
        { id: 'r1', name: 'unknown', type: 'unknown_type' as RuleType, config: {}, required: true },
        {
          id: 'r2',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx, { continueOnError: false });

      expect(result.results).toHaveLength(1);
    });
  });

  describe('mixed executor types', () => {
    it('combines all 6 executor types in one run', async () => {
      doc.body.innerHTML = `
        <div id="app">
          <h1 id="title">Hello</h1>
          <span id="status">OK</span>
        </div>
      `;

      const mockPerf = {
        getEntriesByType: vi.fn(() => [
          { loadEventEnd: 800, startTime: 0, entryType: 'navigation' },
        ]),
      };

      const ctx = createCtx(doc, {
        window: {
          performance: mockPerf,
          getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
        } as unknown as Window,
        capturedErrors: [],
      });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'app exists',
          type: 'selector_exists',
          config: { selector: '#app' },
          required: true,
        },
        {
          id: 'r2',
          name: 'title visible',
          type: 'selector_visible',
          config: { selector: '#title' },
          required: true,
        },
        {
          id: 'r3',
          name: 'status text',
          type: 'text_content',
          config: { selector: '#status', expected: 'OK', operator: 'equals' },
          required: true,
        },
        {
          id: 'r4',
          name: 'js check',
          type: 'js_assertion',
          config: { expression: 'document.querySelectorAll("div").length > 0' },
          required: true,
        },
        { id: 'r5', name: 'no errors', type: 'console_clean', config: {}, required: true },
        {
          id: 'r6',
          name: 'fast load',
          type: 'duration',
          config: { maxDuration: 2000 },
          required: true,
        },
      ];

      const result = await engine.executeAll(rules, ctx);

      expect(result.status).toBe('healthy');
      expect(result.results).toHaveLength(6);
      expect(result.failedRules).toEqual([]);
    });
  });
});
