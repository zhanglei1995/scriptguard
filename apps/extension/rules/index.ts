/**
 * Rules Module
 *
 * SG-016: Rule Executor Interface and Base Class
 *
 * @example
 * ```typescript
 * import { RuleEngine, registry } from '@scriptguard/extension/rules'
 *
 * // Register executors
 * import { SelectorExistsExecutor } from './rules/executors/selector-exists'
 * registry.register('selector_exists', new SelectorExistsExecutor())
 *
 * // Execute rules
 * const engine = new RuleEngine()
 * const result = await engine.executeAll(rules, ctx)
 * ```
 */

// Types
export type {
  CheckRule,
  RuleType,
  RuleExecutor,
  ExecutionContext,
  RuleResult,
  PageContextProxy,
  ErrorCapture,
  NetworkRequest,
  ExecutionOptions,
} from './types'

// Base executor
export { BaseExecutor } from './base'

// Registry
export { registry } from './registry'

// Engine
export { RuleEngine } from './engine'
export type { AggregateResult } from './engine'

// Executors
export { SelectorExistsExecutor } from './executors/selector-exists'
export { SelectorVisibleExecutor } from './executors/selector-visible'
export { TextContentExecutor } from './executors/text-content'
export { UrlMatchExecutor } from './executors/url-match'

// Default context factory
export { createDefaultExecutionContext } from './context'
