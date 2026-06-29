import { describe, it, expect } from 'vitest';
import { matchUrl, type MatchRule } from '../../background/router';

describe('URL matching', () => {
  describe('matchUrl', () => {
    it('returns false for empty rules', () => {
      expect(matchUrl('https://example.com', [])).toBe(false);
    });

    it('matches exact rule', () => {
      const rules: MatchRule[] = [{ type: 'exact', pattern: 'https://example.com' }];
      expect(matchUrl('https://example.com', rules)).toBe(true);
      expect(matchUrl('https://example.com/other', rules)).toBe(false);
    });

    it('matches glob rule', () => {
      const rules: MatchRule[] = [{ type: 'glob', pattern: 'https://example.com/*' }];
      expect(matchUrl('https://example.com/page', rules)).toBe(true);
      expect(matchUrl('https://example.com/', rules)).toBe(true);
      expect(matchUrl('https://other.com/page', rules)).toBe(false);
    });

    it('matches regex rule', () => {
      const rules: MatchRule[] = [{ type: 'regex', pattern: 'https?://example\\.com.*' }];
      expect(matchUrl('https://example.com', rules)).toBe(true);
      expect(matchUrl('http://example.com', rules)).toBe(true);
      expect(matchUrl('https://other.com', rules)).toBe(false);
    });

    it('handles invalid regex gracefully', () => {
      const rules: MatchRule[] = [{ type: 'regex', pattern: '[invalid' }];
      expect(matchUrl('https://example.com', rules)).toBe(false);
    });

    it('matches if any rule matches (OR logic)', () => {
      const rules: MatchRule[] = [
        { type: 'exact', pattern: 'https://a.com' },
        { type: 'exact', pattern: 'https://b.com' },
      ];
      expect(matchUrl('https://a.com', rules)).toBe(true);
      expect(matchUrl('https://b.com', rules)).toBe(true);
      expect(matchUrl('https://c.com', rules)).toBe(false);
    });

    it('matches multiple glob patterns', () => {
      const rules: MatchRule[] = [{ type: 'glob', pattern: 'https://*.example.com/*' }];
      expect(matchUrl('https://www.example.com/page', rules)).toBe(true);
      expect(matchUrl('https://api.example.com/v1', rules)).toBe(true);
      expect(matchUrl('https://other.com/page', rules)).toBe(false);
    });
  });
});
