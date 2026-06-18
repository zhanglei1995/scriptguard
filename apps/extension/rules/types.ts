/**
 * Rule Executor Type Definitions
 *
 * SG-016: Rule Executor Interface and Base Class
 * TDD §3.2.1
 */

// ====== Rule Types ======

/**
 * Supported rule types for script health checks
 */
export type RuleType =
  | 'selector_exists'
  | 'selector_visible'
  | 'text_content'
  | 'url_match'
  | 'js_assertion'
  | 'console_clean'
  | 'duration'

// ====== Check Rule ======

/**
 * A single health check rule for a script
 * Compatible with storage/schemas.ts CheckRule
 */
export interface CheckRule {
  /** Unique rule identifier */
  id: string
  /** Human-readable rule name */
  name: string
  /** Rule type determining which executor to use */
  type: RuleType
  /** Rule-specific configuration */
  config: Record<string, unknown>
  /** Whether failure of this rule causes script to be marked as failed */
  required: boolean
}

// ====== Page Context ======

/**
 * Proxy for accessing page-level context information
 * MVP: minimal interface for future expansion
 */
export interface PageContextProxy {
  /** Get page title */
  getTitle(): string
  /** Get meta tag content by name */
  getMeta(name: string): string | null
  /** Get element count matching selector */
  getElementCount(selector: string): number
}

// ====== Execution Context ======

/**
 * Context provided to rule executors during execution
 */
export interface ExecutionContext {
  /** Current page URL */
  url: string
  /** DOM document for querying elements */
  document: Document
  /** Window object for computed styles */
  window: Window
  /** Page context proxy */
  pageContext: PageContextProxy
  /** Timeout in milliseconds for rule execution */
  timeout: number
  /** Abort signal for cancellation */
  signal: AbortSignal
  /** Captured page errors */
  capturedErrors: ErrorCapture[]
  /** Captured network requests */
  capturedRequests: NetworkRequest[]
}

// ====== Error Capture ======

/**
 * A captured page error from error-capture.ts
 */
export interface ErrorCapture {
  source: string
  type: 'error' | 'unhandledrejection'
  message: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: number
}

// ====== Network Request ======

/**
 * A captured network request
 */
export interface NetworkRequest {
  url: string
  method: string
  status?: number
  timestamp: number
}

// ====== Rule Result ======

/**
 * Result of executing a single rule
 */
export interface RuleResult {
  /** Rule identifier */
  ruleId: string
  /** Execution status */
  status: 'passed' | 'failed' | 'skipped' | 'timeout'
  /** Execution duration in milliseconds */
  duration: number
  /** Error message if failed */
  errorMessage?: string
  /** Error stack trace if failed */
  errorStack?: string
  /** Additional context data */
  context?: Record<string, unknown>
}

// ====== Rule Executor Interface ======

/**
 * Interface for rule executors
 * Each rule type has a corresponding executor implementation
 */
export interface RuleExecutor {
  /** The rule type this executor handles */
  readonly type: string

  /**
   * Execute a rule against the given context
   * @param rule - The rule to execute
   * @param ctx - Execution context
   * @returns Promise resolving to rule result
   */
  execute(rule: CheckRule, ctx: ExecutionContext): Promise<RuleResult>
}

// ====== Execution Options ======

/**
 * Options for rule execution
 */
export interface ExecutionOptions {
  /** Timeout per rule in milliseconds (default: 5000) */
  timeout?: number
  /** Whether to skip failed rules (default: false) */
  continueOnError?: boolean
}
