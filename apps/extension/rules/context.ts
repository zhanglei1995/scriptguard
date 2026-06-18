/**
 * Default Execution Context Factory
 *
 * SG-016: Rule Executor Interface and Base Class
 * Creates a default ExecutionContext from current browser environment
 */

import type { ExecutionContext, PageContextProxy } from './types'

/**
 * Create a minimal PageContextProxy from current window
 */
function createPageContextProxy(doc: Document): PageContextProxy {
  return {
    getTitle: () => doc.title,
    getMeta: (name: string) => {
      const meta = doc.querySelector(`meta[name="${name}"]`)
      return meta?.getAttribute('content') ?? null
    },
    getElementCount: (selector: string) => {
      return doc.querySelectorAll(selector).length
    },
  }
}

/**
 * Create a default ExecutionContext from current browser environment
 *
 * @param options - Optional overrides
 * @returns ExecutionContext for current page
 */
export function createDefaultExecutionContext(
  options: Partial<Pick<ExecutionContext, 'timeout' | 'signal'>> = {}
): ExecutionContext {
  const doc = document
  const win = window

  return {
    url: location.href,
    document: doc,
    window: win,
    pageContext: createPageContextProxy(doc),
    timeout: options.timeout ?? 5_000,
    signal: options.signal ?? new AbortController().signal,
    capturedErrors: [],
    capturedRequests: [],
  }
}
