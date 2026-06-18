/**
 * Console Clean Executor
 *
 * SG-017: 6 MVP Rule Executors
 * Checks that no console.error messages were captured after script injection
 */

import { BaseExecutor } from '../base'
import type { CheckRule, ExecutionContext } from '../types'

interface ConsoleCleanConfig {
  /** Patterns to ignore in error messages */
  ignorePatterns?: string[]
}

export class ConsoleCleanExecutor extends BaseExecutor {
  readonly type = 'console_clean'

  protected async evaluate(
    rule: CheckRule,
    ctx: ExecutionContext
  ): Promise<boolean> {
    const config = rule.config as ConsoleCleanConfig
    const ignorePatterns = config.ignorePatterns ?? []

    const errors = ctx.capturedErrors.filter(
      (e) => e.type === 'error'
    )

    if (errors.length === 0) {
      return true
    }

    const isIgnored = (message: string): boolean => {
      return ignorePatterns.some((pattern) => message.includes(pattern))
    }

    return errors.every((e) => isIgnored(e.message))
  }
}
