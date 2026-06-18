/**
 * Duration Executor
 *
 * SG-017: 6 MVP Rule Executors
 * Checks that page load time does not exceed a threshold
 */

import { BaseExecutor } from '../base'
import type { CheckRule, ExecutionContext } from '../types'

interface DurationConfig {
  /** Maximum allowed page load duration in milliseconds */
  maxDuration?: number
}

export class DurationExecutor extends BaseExecutor {
  readonly type = 'duration'

  protected async evaluate(
    rule: CheckRule,
    ctx: ExecutionContext
  ): Promise<boolean> {
    const config = rule.config as DurationConfig
    const maxDuration = config.maxDuration

    if (maxDuration === undefined || maxDuration < 0) {
      return false
    }

    const perf = ctx.window.performance
    if (!perf) {
      return false
    }

    const navEntries = perf.getEntriesByType('navigation')
    if (navEntries.length === 0) {
      return false
    }

    const nav = navEntries[0] as PerformanceNavigationTiming
    const duration = nav.loadEventEnd - nav.startTime

    return duration <= maxDuration
  }
}
