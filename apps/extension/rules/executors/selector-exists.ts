/**
 * Selector Exists Executor
 *
 * SG-016: Rule Executor Interface and Base Class
 * Checks if a CSS selector matches at least one element in the DOM
 */

import { BaseExecutor } from '../base'
import type { CheckRule, ExecutionContext } from '../types'

/**
 * Configuration for selector_exists rule
 */
interface SelectorExistsConfig {
  /** CSS selector to check */
  selector?: string
}

/**
 * Executor for selector_exists rules
 *
 * Passes if the selector matches at least one element.
 * Fails if selector is missing or no elements match.
 *
 * @example
 * ```json
 * {
 *   "type": "selector_exists",
 *   "config": { "selector": "#app" }
 * }
 * ```
 */
export class SelectorExistsExecutor extends BaseExecutor {
  readonly type = 'selector_exists'

  protected async evaluate(
    rule: CheckRule,
    ctx: ExecutionContext
  ): Promise<boolean> {
    const config = rule.config as SelectorExistsConfig
    const selector = config.selector

    if (!selector) {
      return false
    }

    const element = ctx.document.querySelector(selector)
    return element !== null
  }
}
