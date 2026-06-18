/**
 * URL Match Executor
 *
 * SG-016: Rule Executor Interface and Base Class
 * Checks if current URL matches a pattern (glob/regex/exact)
 */

import { BaseExecutor } from '../base'
import type { CheckRule, ExecutionContext } from '../types'

/**
 * Configuration for url_match rule
 */
interface UrlMatchConfig {
  /** URL pattern to match against */
  pattern?: string
}

/**
 * Executor for url_match rules
 *
 * Supports three pattern formats:
 * - Regex: /pattern/flags (e.g., /example\\.com/i)
 * - Glob: with * and ? wildcards (e.g., https://example.com/*)
 * - Exact: literal URL string
 *
 * @example
 * ```json
 * {
 *   "type": "url_match",
 *   "config": { "pattern": "https://example.com/*" }
 * }
 * ```
 */
export class UrlMatchExecutor extends BaseExecutor {
  readonly type = 'url_match'

  protected async evaluate(
    rule: CheckRule,
    ctx: ExecutionContext
  ): Promise<boolean> {
    const config = rule.config as UrlMatchConfig
    const pattern = config.pattern

    if (!pattern) {
      return false
    }

    const url = ctx.url

    // Check for regex pattern: /pattern/flags
    if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
      const lastSlash = pattern.lastIndexOf('/')
      const body = pattern.slice(1, lastSlash)
      const flags = pattern.slice(lastSlash + 1)

      try {
        return new RegExp(body, flags).test(url)
      } catch {
        return false
      }
    }

    // Convert glob pattern to regex
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')

    try {
      return new RegExp(`^${regexStr}$`, 'i').test(url)
    } catch {
      return false
    }
  }
}
