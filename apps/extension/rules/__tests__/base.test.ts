/**
 * Base Executor Tests
 *
 * SG-016: Rule Executor Interface and Base Class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseExecutor } from '../base'
import type { CheckRule, ExecutionContext, RuleType } from '../types'

// Concrete implementation for testing
class TestExecutor extends BaseExecutor {
  readonly type = 'test_rule'

  private shouldPass: boolean
  private delayMs: number

  constructor(options: { shouldPass?: boolean; delayMs?: number } = {}) {
    super()
    this.shouldPass = options.shouldPass ?? true
    this.delayMs = options.delayMs ?? 0
  }

  protected async evaluate(
    _rule: CheckRule,
    _ctx: ExecutionContext
  ): Promise<boolean> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs))
    }
    return this.shouldPass
  }
}

// Executor that throws
class ThrowingExecutor extends BaseExecutor {
  readonly type = 'throwing_rule'

  protected async evaluate(): Promise<boolean> {
    throw new Error('Test error')
  }
}

// Helper to create a rule with mock type
function createMockRule(type: string, overrides?: Partial<CheckRule>): CheckRule {
  return {
    id: 'r1',
    name: 'test',
    type: type as RuleType,
    config: {},
    required: true,
    ...overrides,
  }
}

describe('BaseExecutor', () => {
  let mockCtx: ExecutionContext

  beforeEach(() => {
    const doc = document.implementation.createHTMLDocument('test')
    mockCtx = {
      url: 'https://example.com',
      document: doc,
      window: doc.defaultView!,
      pageContext: {
        getTitle: () => doc.title,
        getMeta: () => null,
        getElementCount: () => 0,
      },
      timeout: 5000,
      signal: new AbortController().signal,
      capturedErrors: [],
      capturedRequests: [],
    }
  })

  describe('execute', () => {
    it('returns passed when evaluate returns true', async () => {
      const executor = new TestExecutor({ shouldPass: true })
      const rule = createMockRule('test_rule')

      const result = await executor.execute(rule, mockCtx)

      expect(result.status).toBe('passed')
      expect(result.ruleId).toBe('r1')
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('returns failed when evaluate returns false', async () => {
      const executor = new TestExecutor({ shouldPass: false })
      const rule = createMockRule('test_rule')

      const result = await executor.execute(rule, mockCtx)

      expect(result.status).toBe('failed')
      expect(result.ruleId).toBe('r1')
    })

    it('returns failed with error when evaluate throws', async () => {
      const executor = new ThrowingExecutor()
      const rule = createMockRule('throwing_rule')

      const result = await executor.execute(rule, mockCtx)

      expect(result.status).toBe('failed')
      expect(result.errorMessage).toBe('Test error')
      expect(result.errorStack).toBeDefined()
    })

    it('returns timeout when execution exceeds timeout', async () => {
      const executor = new TestExecutor({ delayMs: 100 })
      const rule = createMockRule('test_rule')

      const ctxWithLowTimeout = {
        ...mockCtx,
        timeout: 10, // Very low timeout
      }

      const result = await executor.execute(rule, ctxWithLowTimeout)

      expect(result.status).toBe('timeout')
      expect(result.errorMessage).toBe('Rule execution timeout')
    })

    it('returns skipped when signal is aborted', async () => {
      const executor = new TestExecutor({ delayMs: 100 })
      const rule = createMockRule('test_rule')

      const abortController = new AbortController()
      abortController.abort()

      const ctxWithAbortedSignal = {
        ...mockCtx,
        signal: abortController.signal,
      }

      const result = await executor.execute(rule, ctxWithAbortedSignal)

      expect(result.status).toBe('skipped')
      expect(result.errorMessage).toBe('Execution aborted')
    })

    it('includes context in result', async () => {
      const executor = new TestExecutor()
      const rule = createMockRule('test_rule', { config: { key: 'value' } })

      const result = await executor.execute(rule, mockCtx)

      expect(result.context).toEqual({
        ruleType: 'test_rule',
        config: { key: 'value' },
      })
    })

    it('measures duration correctly', async () => {
      const executor = new TestExecutor({ delayMs: 50 })
      const rule = createMockRule('test_rule')

      const result = await executor.execute(rule, mockCtx)

      expect(result.duration).toBeGreaterThanOrEqual(40) // Allow some timing variance
    })
  })

  describe('type property', () => {
    it('exposes readonly type', () => {
      const executor = new TestExecutor()
      expect(executor.type).toBe('test_rule')
    })
  })
})
