/**
 * Rule Engine
 *
 * SG-016: Rule Executor Interface and Base Class
 * Orchestrates rule execution using the executor registry
 */

import { registry } from './registry'
import type {
  CheckRule,
  ExecutionContext,
  ExecutionOptions,
  RuleResult,
} from './types'

/**
 * Aggregate result from executing multiple rules
 */
export interface AggregateResult {
  /** Overall status based on required rule failures */
  status: 'healthy' | 'degraded' | 'failed'
  /** IDs of rules that failed */
  failedRules: string[]
  /** Total execution duration in milliseconds */
  duration: number
  /** Individual rule results */
  results: RuleResult[]
}

/**
 * Default execution options
 */
const DEFAULT_OPTIONS: Required<ExecutionOptions> = {
  timeout: 5_000,
  continueOnError: true,
}

/**
 * RuleEngine orchestrates rule execution
 *
 * @example
 * ```typescript
 * import { RuleEngine } from './engine'
 *
 * const engine = new RuleEngine()
 * const result = await engine.executeAll(rules, executionContext)
 * console.log(result.status) // 'healthy' | 'degraded' | 'failed'
 * ```
 */
export class RuleEngine {
  /**
   * Execute all rules against the given context
   *
   * @param rules - Array of rules to execute
   * @param ctx - Execution context (url, document, etc.)
   * @param options - Execution options
   * @returns Aggregate result with status and individual results
   */
  async executeAll(
    rules: CheckRule[],
    ctx: ExecutionContext,
    options: ExecutionOptions = {}
  ): Promise<AggregateResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const startTime = Date.now()
    const results: RuleResult[] = []
    const failedRules: string[] = []

    for (const rule of rules) {
      // Check timeout
      const elapsed = Date.now() - startTime
      if (elapsed >= opts.timeout) {
        results.push({
          ruleId: rule.id,
          status: 'timeout',
          duration: 0,
          errorMessage: 'Overall timeout exceeded',
        })
        failedRules.push(rule.id)
        continue
      }

      // Get executor
      const executor = registry.get(rule.type)
      if (!executor) {
        results.push({
          ruleId: rule.id,
          status: 'failed',
          duration: 0,
          errorMessage: `No executor registered for type: ${rule.type}`,
        })
        failedRules.push(rule.id)

        if (!opts.continueOnError) {
          break
        }
        continue
      }

      // Execute rule
      const result = await executor.execute(rule, ctx)
      results.push(result)

      if (result.status !== 'passed' && result.status !== 'skipped') {
        failedRules.push(rule.id)
      }

      // Stop on failure if not continuing
      if (!opts.continueOnError && result.status === 'failed') {
        break
      }
    }

    const duration = Date.now() - startTime
    const status = this.determineStatus(rules, results)

    return {
      status,
      failedRules,
      duration,
      results,
    }
  }

  /**
   * Determine aggregate status based on rule results
   *
   * - healthy: all rules passed
   * - degraded: some optional rules failed
   * - failed: at least one required rule failed
   */
  private determineStatus(
    rules: CheckRule[],
    results: RuleResult[]
  ): 'healthy' | 'degraded' | 'failed' {
    if (results.length === 0) {
      return 'healthy'
    }

    const hasRequiredFailure = results.some((result) => {
      if (result.status === 'passed' || result.status === 'skipped') {
        return false
      }
      const rule = rules.find((r) => r.id === result.ruleId)
      return rule?.required === true
    })

    if (hasRequiredFailure) {
      return 'failed'
    }

    const hasAnyFailure = results.some(
      (r) => r.status !== 'passed' && r.status !== 'skipped'
    )

    return hasAnyFailure ? 'degraded' : 'healthy'
  }
}
