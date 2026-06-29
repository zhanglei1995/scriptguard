/**
 * Text Content Executor Tests
 *
 * SG-016: Rule Executor Interface and Base Class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TextContentExecutor } from '../executors/text-content';
import type { CheckRule, ExecutionContext } from '../types';

describe('TextContentExecutor', () => {
  let executor: TextContentExecutor;
  let doc: Document;
  let ctx: ExecutionContext;

  beforeEach(() => {
    executor = new TextContentExecutor();
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
    expect(executor.type).toBe('text_content');
  });

  describe('contains operator', () => {
    it('passes when text contains expected', async () => {
      doc.body.innerHTML = '<p id="desc">This is a description</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#desc', expected: 'description', operator: 'contains' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('fails when text does not contain expected', async () => {
      doc.body.innerHTML = '<p id="desc">Something else</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#desc', expected: 'description', operator: 'contains' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });
  });

  describe('equals operator', () => {
    it('passes when text equals expected', async () => {
      doc.body.innerHTML = '<p id="val">42</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#val', expected: '42', operator: 'equals' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('passes when trimmed text equals expected', async () => {
      doc.body.innerHTML = '<p id="val">  42  </p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#val', expected: '42', operator: 'equals' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('fails when text does not equal expected', async () => {
      doc.body.innerHTML = '<p id="val">43</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#val', expected: '42', operator: 'equals' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });
  });

  describe('matches operator', () => {
    it('passes when regex matches', async () => {
      doc.body.innerHTML = '<p id="email">user@example.com</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#email', expected: '\\w+@\\w+\\.\\w+', operator: 'matches' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('fails when regex does not match', async () => {
      doc.body.innerHTML = '<p id="email">invalid-email</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#email', expected: '\\w+@\\w+\\.\\w+', operator: 'matches' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });

    it('fails for invalid regex', async () => {
      doc.body.innerHTML = '<p id="text">hello</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#text', expected: '[invalid', operator: 'matches' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });
  });

  describe('edge cases', () => {
    it('fails when selector is missing', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { expected: 'test' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });

    it('fails when expected is missing', async () => {
      doc.body.innerHTML = '<p id="text">hello</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#text' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });

    it('uses contains as default operator', async () => {
      doc.body.innerHTML = '<p id="text">hello world</p>';

      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#text', expected: 'hello' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('passed');
    });

    it('fails when element does not exist', async () => {
      const rule: CheckRule = {
        id: 'r1',
        name: 'text',
        type: 'text_content',
        config: { selector: '#missing', expected: 'test' },
        required: true,
      };

      const result = await executor.execute(rule, ctx);
      expect(result.status).toBe('failed');
    });
  });
});
