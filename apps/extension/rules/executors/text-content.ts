/**
 * Text Content Executor
 *
 * SG-016: Rule Executor Interface and Base Class
 * Checks if element's text content matches expected string
 */

import { BaseExecutor } from '../base'
import type { CheckRule, ExecutionContext } from '../types'

/**
 * Configuration for text_content rule
 */
interface TextContentConfig {
  /** CSS selector to check */
  selector?: string
  /** Expected text content */
  expected?: string
  /** Comparison operator (default: contains) */
  operator?: 'equals' | 'contains' | 'matches'
}

/**
 * Executor for text_content rules
 *
 * Supports three operators:
 * - equals: exact match (after trim)
 * - contains: substring match (default)
 * - matches: regex pattern match
 *
 * @example
 * ```json
 * {
 *   "type": "text_content",
 *   "config": {
 *     "selector": "#status",
 *     "expected": "Active",
 *     "operator": "contains"
 *   }
 * }
 * ```
 */
export class TextContentExecutor extends BaseExecutor {
  readonly type = 'text_content'

  protected async evaluate(
    rule: CheckRule,
    ctx: ExecutionContext
  ): Promise<boolean> {
    const config = rule.config as TextContentConfig
    const selector = config.selector
    const expected = config.expected
    const operator = config.operator ?? 'contains'

    if (!selector || expected === undefined) {
      return false
    }

    const element = ctx.document.querySelector(selector)
    if (!element) {
      return false
    }

    const text = element.textContent ?? ''

    switch (operator) {
      case 'equals':
        return text.trim() === expected

      case 'contains':
        return text.includes(expected)

      case 'matches':
        try {
          return new RegExp(expected).test(text)
        } catch {
          return false
        }

      default:
        return false
    }
  }
}
