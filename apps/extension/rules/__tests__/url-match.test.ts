/**
 * URL Match Executor Tests
 *
 * SG-016: Rule Executor Interface and Base Class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UrlMatchExecutor } from '../executors/url-match';
import type { CheckRule, ExecutionContext } from '../types';

describe('UrlMatchExecutor', () => {
  let executor: UrlMatchExecutor;
  let doc: Document;
  let ctx: ExecutionContext;

  beforeEach(() => {
    executor = new UrlMatchExecutor();
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

  it('has correct type', () => {
    expect(executor.type).toBe('url_match');
  });

  describe('glob pattern', () => {
    it('passes with matching glob pattern', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: 'https://example.com/*' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('fails when URL does not match', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: 'https://other.com/*' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });

    it('passes with exact match', async () => {
      ctx.url = 'https://example.com/exact';
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: 'https://example.com/exact' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('supports ? wildcard', async () => {
      ctx.url = 'https://example.com/page';
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: 'https://example.com/pag?' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });
  });

  describe('regex pattern', () => {
    it('passes with matching regex', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: '/example\\.com/' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('passes with regex flags', async () => {
      ctx.url = 'HTTPS://EXAMPLE.COM/page';
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: '/example\\.com/i' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('fails when regex does not match', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: '/other\\.com/' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });

    it('returns false for invalid regex', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: '[invalid' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });
  });

  describe('edge cases', () => {
    it('fails when pattern is missing', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: {},
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });

    it('fails when pattern is empty string', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'url',
        type: 'url_match',
        config: { pattern: '' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });
  });
});
