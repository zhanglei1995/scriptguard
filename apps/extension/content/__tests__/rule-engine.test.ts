import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeRules, type CheckRule } from '../rule-engine';

describe('rule-engine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('selector_exists', () => {
    it('passes when element exists', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<div id="target">Hello</div>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#target' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('healthy');
      expect(result.failedRules).toEqual([]);
    });

    it('fails when element does not exist', () => {
      const doc = document.implementation.createHTMLDocument('test');

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'exists',
          type: 'selector_exists',
          config: { selector: '#missing' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('failed');
      expect(result.failedRules).toContain('r1');
    });

    it('fails when selector is missing from config', () => {
      const doc = document.implementation.createHTMLDocument('test');

      const rules: CheckRule[] = [
        { id: 'r1', name: 'exists', type: 'selector_exists', config: {}, required: true },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('failed');
      expect(result.failedRules).toContain('r1');
    });
  });

  describe('selector_visible', () => {
    it('passes when element has dimensions', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<div id="box">Box</div>';

      // Override offsetWidth/offsetHeight via prototype
      const el = doc.querySelector('#box') as HTMLElement;
      Object.defineProperty(el, 'offsetWidth', { value: 100, configurable: true });
      Object.defineProperty(el, 'offsetHeight', { value: 100, configurable: true });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'visible',
          type: 'selector_visible',
          config: { selector: '#box' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('healthy');
    });

    it('fails when element does not exist', () => {
      const doc = document.implementation.createHTMLDocument('test');

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'visible',
          type: 'selector_visible',
          config: { selector: '#missing' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('failed');
    });

    it('passes when getComputedStyle shows visible', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<div id="box">Box</div>';

      // Mock defaultView and getComputedStyle
      const mockGetComputedStyle = vi.fn(() => ({
        display: 'block',
        visibility: 'visible',
      }));
      Object.defineProperty(doc, 'defaultView', {
        value: { getComputedStyle: mockGetComputedStyle },
        configurable: true,
      });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'visible',
          type: 'selector_visible',
          config: { selector: '#box' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('healthy');
      expect(mockGetComputedStyle).toHaveBeenCalled();
    });

    it('fails when getComputedStyle shows display none', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<div id="box">Box</div>';

      Object.defineProperty(doc, 'defaultView', {
        value: {
          getComputedStyle: vi.fn(() => ({
            display: 'none',
            visibility: 'visible',
          })),
        },
        configurable: true,
      });

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'visible',
          type: 'selector_visible',
          config: { selector: '#box' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('failed');
    });
  });

  describe('text_content', () => {
    it('passes when text contains expected', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<p id="desc">This is a description</p>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'text',
          type: 'text_content',
          config: { selector: '#desc', expected: 'description', operator: 'contains' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('healthy');
    });

    it('fails when text does not match', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<p id="desc">Something else</p>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'text',
          type: 'text_content',
          config: { selector: '#desc', expected: 'description', operator: 'contains' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('failed');
    });

    it('passes with equals operator', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<p id="val">42</p>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'text',
          type: 'text_content',
          config: { selector: '#val', expected: '42', operator: 'equals' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('healthy');
    });

    it('passes with matches operator (regex)', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<p id="email">user@example.com</p>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'text',
          type: 'text_content',
          config: { selector: '#email', expected: '\\w+@\\w+\\.\\w+', operator: 'matches' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('healthy');
    });

    it('returns false for invalid regex in matches', () => {
      const doc = document.implementation.createHTMLDocument('test');
      doc.body.innerHTML = '<p id="text">hello</p>';

      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'text',
          type: 'text_content',
          config: { selector: '#text', expected: '[invalid', operator: 'matches' },
          required: true,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com');
      expect(result.status).toBe('failed');
    });
  });

  describe('url_match', () => {
    it('passes with glob pattern', () => {
      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'url',
          type: 'url_match',
          config: { pattern: 'https://example.com/*' },
          required: true,
        },
      ];

      const result = executeRules(rules, document, 'https://example.com/page');
      expect(result.status).toBe('healthy');
    });

    it('fails when URL does not match', () => {
      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'url',
          type: 'url_match',
          config: { pattern: 'https://other.com/*' },
          required: true,
        },
      ];

      const result = executeRules(rules, document, 'https://example.com/page');
      expect(result.status).toBe('failed');
    });

    it('passes with regex pattern', () => {
      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'url',
          type: 'url_match',
          config: { pattern: '/example\\.com/' },
          required: true,
        },
      ];

      const result = executeRules(rules, document, 'https://example.com/page');
      expect(result.status).toBe('healthy');
    });

    it('returns false for invalid regex', () => {
      const rules: CheckRule[] = [
        {
          id: 'r1',
          name: 'url',
          type: 'url_match',
          config: { pattern: '[invalid' },
          required: true,
        },
      ];

      const result = executeRules(rules, document, 'https://example.com/page');
      expect(result.status).toBe('failed');
    });

    it('fails when pattern is missing', () => {
      const rules: CheckRule[] = [
        { id: 'r1', name: 'url', type: 'url_match', config: {}, required: true },
      ];

      const result = executeRules(rules, document, 'https://example.com');
      expect(result.status).toBe('failed');
    });
  });

  describe('multi-rule combinations', () => {
    it('healthy when all rules pass', () => {
      const doc = document.implementation.createHTMLDocument('test');
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

      const result = executeRules(rules, doc, 'https://example.com/page');
      expect(result.status).toBe('healthy');
      expect(result.failedRules).toEqual([]);
    });

    it('failed when required rule fails', () => {
      const doc = document.implementation.createHTMLDocument('test');

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

      const result = executeRules(rules, doc, 'https://example.com/page');
      expect(result.status).toBe('failed');
      expect(result.failedRules).toContain('r1');
    });

    it('degraded when optional rule fails', () => {
      const doc = document.implementation.createHTMLDocument('test');
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
          name: 'missing-opt',
          type: 'selector_exists',
          config: { selector: '#optional' },
          required: false,
        },
      ];

      const result = executeRules(rules, doc, 'https://example.com/page');
      expect(result.status).toBe('degraded');
      expect(result.failedRules).toContain('r2');
      expect(result.failedRules).not.toContain('r1');
    });

    it('returns empty rules as healthy', () => {
      const result = executeRules([], document, 'https://example.com');
      expect(result.status).toBe('healthy');
      expect(result.failedRules).toEqual([]);
    });
  });

  describe('unknown rule type', () => {
    it('fails for unknown rule type', () => {
      const rules: CheckRule[] = [
        { id: 'r1', name: 'unknown', type: 'unknown_type' as any, config: {}, required: true },
      ];

      const result = executeRules(rules, document, 'https://example.com');
      expect(result.status).toBe('failed');
      expect(result.failedRules).toContain('r1');
    });
  });
});
