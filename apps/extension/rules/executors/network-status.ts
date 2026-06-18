/**
 * Network Status Executor
 *
 * SG-054: 4 类补充规则执行器
 * Checks if specific network requests succeeded based on URL pattern and status code
 */

import { BaseExecutor } from '../base'
import type { CheckRule, ExecutionContext } from '../types'

interface NetworkStatusConfig {
  /** URL pattern to match against captured requests */
  urlPattern?: string
  /** Expected HTTP status code (default: 200-299 range) */
  expectedStatus?: number
  /** If true, request must exist; if false, request must NOT exist */
  mustExist?: boolean
}

export class NetworkStatusExecutor extends BaseExecutor {
  readonly type = 'network_status'

  protected async evaluate(
    rule: CheckRule,
    ctx: ExecutionContext
  ): Promise<boolean> {
    const config = rule.config as NetworkStatusConfig
    const urlPattern = config.urlPattern
    const expectedStatus = config.expectedStatus
    const mustExist = config.mustExist ?? true

    if (!urlPattern) {
      return false
    }

    let pattern: RegExp
    try {
      const regexBody = urlPattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      pattern = new RegExp(`^${regexBody}$`, 'i')
    } catch {
      return false
    }

    const matched = ctx.capturedRequests.filter((req) => pattern.test(req.url))

    if (!mustExist) {
      return matched.length === 0
    }

    if (matched.length === 0) {
      return false
    }

    if (expectedStatus !== undefined) {
      return matched.some((req) => req.status === expectedStatus)
    }

    return matched.some((req) => req.status !== undefined && req.status >= 200 && req.status < 400)
  }
}
