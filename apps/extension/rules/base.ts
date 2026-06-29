/**
 * Base Rule Executor
 *
 * SG-016: Rule Executor Interface and Base Class
 * Provides common functionality for all rule executors:
 * - Duration measurement
 * - Timeout detection
 * - Error wrapping
 *
 * Subclasses only need to implement the evaluate() method
 */

import type { CheckRule, ExecutionContext, RuleExecutor, RuleResult } from './types';

/**
 * Abstract base class for rule executors
 *
 * @example
 * ```typescript
 * class MyExecutor extends BaseExecutor {
 *   readonly type = 'my_rule'
 *
 *   protected async evaluate(rule: CheckRule, ctx: ExecutionContext): Promise<boolean> {
 *     // Rule evaluation logic
 *     return true
 *   }
 * }
 * ```
 */
export abstract class BaseExecutor implements RuleExecutor {
  /**
   * The rule type this executor handles
   */
  abstract readonly type: string;

  /**
   * Execute a rule with timing, timeout detection, and error handling
   *
   * @param rule - The rule to execute
   * @param ctx - Execution context
   * @returns Promise resolving to rule result
   */
  async execute(rule: CheckRule, ctx: ExecutionContext): Promise<RuleResult> {
    const startTime = Date.now();
    const ruleTimeout = ctx.timeout;

    try {
      // Check if already aborted
      if (ctx.signal.aborted) {
        return {
          ruleId: rule.id,
          status: 'skipped',
          duration: 0,
          errorMessage: 'Execution aborted',
        };
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Rule execution timeout'));
        }, ruleTimeout);

        // Clean up timer if signal aborts
        ctx.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(new Error('Execution aborted'));
          },
          { once: true },
        );
      });

      // Execute with timeout race
      const result = await Promise.race([this.evaluate(rule, ctx), timeoutPromise]);

      const duration = Date.now() - startTime;

      return {
        ruleId: rule.id,
        status: result ? 'passed' : 'failed',
        duration,
        context: {
          ruleType: rule.type,
          config: rule.config,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Handle timeout
      if (error instanceof Error && error.message === 'Rule execution timeout') {
        return {
          ruleId: rule.id,
          status: 'timeout',
          duration,
          errorMessage: 'Rule execution timeout',
        };
      }

      // Handle abort
      if (error instanceof Error && error.message === 'Execution aborted') {
        return {
          ruleId: rule.id,
          status: 'skipped',
          duration,
          errorMessage: 'Execution aborted',
        };
      }

      // Handle other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      return {
        ruleId: rule.id,
        status: 'failed',
        duration,
        errorMessage,
        errorStack,
      };
    }
  }

  /**
   * Evaluate the rule condition
   *
   * Subclasses must implement this method to perform the actual rule check.
   *
   * @param rule - The rule to evaluate
   * @param ctx - Execution context
   * @returns Promise resolving to true if rule passes, false if it fails
   */
  protected abstract evaluate(rule: CheckRule, ctx: ExecutionContext): Promise<boolean>;
}
