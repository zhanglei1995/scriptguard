/**
 * JS Assertion Executor
 *
 * SG-017: 6 MVP Rule Executors
 * Evaluates a JavaScript expression in the page context
 * Returns truthy/falsy result
 */

import { BaseExecutor } from '../base'
import type { CheckRule, ExecutionContext } from '../types'

interface JsAssertionConfig {
  /** JavaScript expression to evaluate (must return truthy/falsy) */
  expression?: string
}

export class JsAssertionExecutor extends BaseExecutor {
  readonly type = 'js_assertion'

  protected async evaluate(
    rule: CheckRule,
    ctx: ExecutionContext
  ): Promise<boolean> {
    const config = rule.config as JsAssertionConfig
    const expression = config.expression

    if (!expression) {
      return false
    }

    try {
      const fn = new Function(
        'document',
        'window',
        `return (${expression});`
      )
      const result = fn(ctx.document, ctx.window)
      return !!result
    } catch {
      return false
    }
  }
}
