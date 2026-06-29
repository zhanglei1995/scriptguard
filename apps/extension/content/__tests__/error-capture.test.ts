import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ERROR_CAPTURE_SOURCE,
  ERROR_CAPTURE_SCRIPT,
  isPageError,
  injectErrorCapture,
} from '../error-capture';

describe('error-capture', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ERROR_CAPTURE_SCRIPT', () => {
    it('is under 1KB', () => {
      expect(new Blob([ERROR_CAPTURE_SCRIPT]).size).toBeLessThan(1024);
    });

    it('contains source identifier', () => {
      expect(ERROR_CAPTURE_SCRIPT).toContain(ERROR_CAPTURE_SOURCE);
    });

    it('listens for error event', () => {
      expect(ERROR_CAPTURE_SCRIPT).toContain('addEventListener("error"');
    });

    it('listens for unhandledrejection event', () => {
      expect(ERROR_CAPTURE_SCRIPT).toContain('addEventListener("unhandledrejection"');
    });

    it('uses postMessage for communication', () => {
      expect(ERROR_CAPTURE_SCRIPT).toContain('postMessage');
    });
  });

  describe('isPageError', () => {
    it('returns true for valid page error', () => {
      expect(
        isPageError({
          source: ERROR_CAPTURE_SOURCE,
          type: 'error',
          message: 'test error',
        }),
      ).toBe(true);
    });

    it('returns true for unhandledrejection', () => {
      expect(
        isPageError({
          source: ERROR_CAPTURE_SOURCE,
          type: 'unhandledrejection',
          reason: 'unhandled',
        }),
      ).toBe(true);
    });

    it('returns false for unrelated messages', () => {
      expect(isPageError({ source: 'other', type: 'error' })).toBe(false);
      expect(isPageError(null)).toBe(false);
      expect(isPageError(undefined)).toBe(false);
      expect(isPageError('string')).toBe(false);
    });

    it('returns false for missing source', () => {
      expect(isPageError({ type: 'error', message: 'test' })).toBe(false);
    });
  });

  describe('injectErrorCapture', () => {
    it('appends script element to document and removes it', () => {
      const doc = document.implementation.createHTMLDocument('test');
      const appendSpy = vi.spyOn(doc.documentElement, 'appendChild');

      injectErrorCapture(doc);

      expect(appendSpy).toHaveBeenCalledTimes(1);
      const script = appendSpy.mock.calls[0]![0] as HTMLScriptElement;
      expect(script.tagName).toBe('SCRIPT');
      expect(script.textContent).toBe(ERROR_CAPTURE_SCRIPT);
    });
  });
});
