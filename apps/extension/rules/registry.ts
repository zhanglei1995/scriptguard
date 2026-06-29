/**
 * Rule Executor Registry
 *
 * SG-016: Rule Executor Interface and Base Class
 * Maintains mapping from rule type to executor instance
 */

import type { RuleExecutor } from './types';

/**
 * Registry for rule executors
 *
 * Provides methods to register, retrieve, and list executors.
 * Used by RuleEngine to dispatch rules to the correct executor.
 *
 * @example
 * ```typescript
 * import { registry } from './registry'
 * import { SelectorExistsExecutor } from './executors/selector-exists'
 *
 * registry.register('selector_exists', new SelectorExistsExecutor())
 * const executor = registry.get('selector_exists')
 * ```
 */
class ExecutorRegistry {
  private executors = new Map<string, RuleExecutor>();

  /**
   * Register an executor for a rule type
   *
   * @param type - The rule type this executor handles
   * @param executor - The executor instance
   * @throws Error if an executor is already registered for this type
   */
  register(type: string, executor: RuleExecutor): void {
    if (this.executors.has(type)) {
      throw new Error(`Executor already registered for type: ${type}`);
    }
    this.executors.set(type, executor);
  }

  /**
   * Get the executor for a rule type
   *
   * @param type - The rule type
   * @returns The executor instance, or undefined if not registered
   */
  get(type: string): RuleExecutor | undefined {
    return this.executors.get(type);
  }

  /**
   * Get the executor for a rule type, throwing if not found
   *
   * @param type - The rule type
   * @returns The executor instance
   * @throws Error if no executor is registered for this type
   */
  getOrThrow(type: string): RuleExecutor {
    const executor = this.executors.get(type);
    if (!executor) {
      throw new Error(`No executor registered for type: ${type}`);
    }
    return executor;
  }

  /**
   * Check if an executor is registered for a rule type
   *
   * @param type - The rule type
   * @returns True if an executor is registered
   */
  has(type: string): boolean {
    return this.executors.has(type);
  }

  /**
   * Get all registered rule types
   *
   * @returns Array of registered rule type strings
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.executors.keys());
  }

  /**
   * Clear all registered executors
   * Useful for testing
   */
  clear(): void {
    this.executors.clear();
  }
}

/**
 * Singleton registry instance
 */
export const registry = new ExecutorRegistry();
