import { describe, it, expect } from 'vitest';
import { matchScript, filterMatchingScripts } from '../index';

describe('matcher/index', () => {
  describe('matchScript', () => {
    it('matches exact URL', () => {
      expect(matchScript('https://example.com/page', ['https://example.com/page'])).toBe(true);
    });

    it('does not match different URL', () => {
      expect(matchScript('https://other.com/page', ['https://example.com/page'])).toBe(false);
    });

    it('matches wildcard *', () => {
      expect(matchScript('https://example.com/anything', ['https://example.com/*'])).toBe(true);
    });

    it('matches wildcard ?', () => {
      expect(matchScript('https://example.com/page1', ['https://example.com/page?'])).toBe(true);
      expect(matchScript('https://example.com/page12', ['https://example.com/page?'])).toBe(false);
    });

    it('matches domain only', () => {
      expect(matchScript('https://example.com/page', ['example.com'])).toBe(true);
      expect(matchScript('https://sub.example.com/page', ['example.com'])).toBe(true);
      expect(matchScript('https://other.com/page', ['example.com'])).toBe(false);
    });

    it('matches regex pattern', () => {
      expect(matchScript('https://example.com/orders/123', ['/example\.com\/orders\/\\d+/'])).toBe(
        true,
      );
      expect(matchScript('https://example.com/orders/abc', ['/example\.com\/orders\/\\d+/'])).toBe(
        false,
      );
    });

    it('matches Tampermonkey @match style', () => {
      expect(matchScript('https://example.com/page', ['*://example.com/*'])).toBe(true);
      expect(matchScript('http://example.com/page', ['*://example.com/*'])).toBe(true);
    });

    it('handles empty rules', () => {
      expect(matchScript('https://example.com/page', [])).toBe(false);
    });

    it('handles empty rule string', () => {
      expect(matchScript('https://example.com/page', [''])).toBe(false);
    });

    it('is case insensitive for domain', () => {
      expect(matchScript('https://EXAMPLE.COM/page', ['example.com'])).toBe(true);
    });

    it('matches multiple rules (first match wins)', () => {
      expect(matchScript('https://example.com/page', ['other.com', 'example.com'])).toBe(true);
    });
  });

  describe('filterMatchingScripts', () => {
    it('filters scripts by URL match', () => {
      const scripts = [
        { id: '1', matchRules: ['example.com'] },
        { id: '2', matchRules: ['other.com'] },
        { id: '3', matchRules: ['example.com/*'] },
      ];
      const result = filterMatchingScripts('https://example.com/page', scripts);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual(['1', '3']);
    });

    it('returns empty array when no match', () => {
      const scripts = [{ id: '1', matchRules: ['other.com'] }];
      const result = filterMatchingScripts('https://example.com/page', scripts);
      expect(result).toHaveLength(0);
    });
  });
});
