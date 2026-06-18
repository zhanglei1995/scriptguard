import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runScript, type ScriptContext } from '../script-runner'
import type { InjectResult } from '../injector'
import type { CheckRule } from '../rule-engine'

function makeScript(overrides: Partial<ScriptContext> = {}): ScriptContext {
  return {
    id: 'test-script',
    name: 'Test Script',
    code: 'var x = 1',
    runAt: 'document_start',
    ...overrides,
  }
}

function createMockInjectFn(result: InjectResult = { status: 'success' }) {
  return vi.fn(async () => result)
}

function createDocWithReadyState(readyState: string) {
  const doc = document.implementation.createHTMLDocument('test')
  Object.defineProperty(doc, 'readyState', { value: readyState, writable: true })
  return doc
}

describe('script-runner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('runAt: document_start', () => {
    it('injects immediately', async () => {
      const doc = createDocWithReadyState('loading')
      const injectFn = createMockInjectFn()
      const script = makeScript({ runAt: 'document_start' })

      const record = await runScript(script, doc, injectFn)

      expect(injectFn).toHaveBeenCalledTimes(1)
      expect(record.result?.status).toBe('success')
    })
  })

  describe('runAt: document_idle', () => {
    it('resolves immediately when readyState is complete', async () => {
      const doc = createDocWithReadyState('complete')
      const injectFn = createMockInjectFn()
      const script = makeScript({ runAt: 'document_idle' })

      const record = await runScript(script, doc, injectFn)
      expect(record.result?.status).toBe('success')
    })

    it('resolves immediately when readyState is interactive', async () => {
      const doc = createDocWithReadyState('interactive')
      const injectFn = createMockInjectFn()
      const script = makeScript({ runAt: 'document_idle' })

      const record = await runScript(script, doc, injectFn)
      expect(record.result?.status).toBe('success')
    })
  })

  describe('runAt: document_end', () => {
    it('resolves immediately when readyState is complete', async () => {
      const doc = createDocWithReadyState('complete')
      const injectFn = createMockInjectFn()
      const script = makeScript({ runAt: 'document_end' })

      const record = await runScript(script, doc, injectFn)
      expect(record.result?.status).toBe('success')
    })
  })

  describe('runAt: manual', () => {
    it('does not auto-inject', async () => {
      const doc = document.implementation.createHTMLDocument('test')
      const injectFn = createMockInjectFn()
      const script = makeScript({ runAt: 'manual' })

      const record = await runScript(script, doc, injectFn)

      expect(injectFn).not.toHaveBeenCalled()
      expect(record.error).toBe('manual_scripts_not_auto_injected')
    })
  })

  describe('timeout protection', () => {
    it('records timeout error', async () => {
      const doc = document.implementation.createHTMLDocument('test')
      const injectFn = createMockInjectFn({ status: 'timeout', error: 'timed out' })
      const script = makeScript({ runAt: 'document_start', timeout: 100 })

      const record = await runScript(script, doc, injectFn)

      expect(record.result?.status).toBe('timeout')
      expect(record.error).toBeUndefined()
    })
  })

  describe('error recording', () => {
    it('logs injection errors to chrome.storage.local', async () => {
      const doc = document.implementation.createHTMLDocument('test')
      const injectFn = createMockInjectFn({ status: 'error', error: 'Syntax error' })
      const script = makeScript({ runAt: 'document_start' })

      await runScript(script, doc, injectFn)

      const setCalls = (chrome.storage.local.set as ReturnType<typeof vi.fn>).mock.calls
      const errorCall = setCalls.find(
        (call: Record<string, unknown>[]) => call[0]?.injectionErrors !== undefined
      )
      expect(errorCall).toBeDefined()
    })

    it('records thrown errors', async () => {
      const doc = document.implementation.createHTMLDocument('test')
      const injectFn = createMockInjectFn()
      injectFn.mockRejectedValue(new Error('Network error'))
      const script = makeScript({ runAt: 'document_start' })

      const record = await runScript(script, doc, injectFn)

      expect(record.error).toBe('Network error')
      expect(record.endedAt).toBeDefined()
    })
  })

  describe('rule execution', () => {
    it('runs rules after successful injection', async () => {
      const doc = document.implementation.createHTMLDocument('test')
      doc.body.innerHTML = '<div id="app">App</div>'
      const injectFn = createMockInjectFn()
      const rules: CheckRule[] = [
        { id: 'r1', name: 'exists', type: 'selector_exists', config: { selector: '#app' }, required: true },
      ]
      const script = makeScript({ runAt: 'document_start', rules })

      const record = await runScript(script, doc, injectFn)

      expect(record.ruleResult).toBeDefined()
      expect(record.ruleResult?.status).toBe('healthy')
      expect(record.ruleResult?.failedRules).toEqual([])
    })

    it('records failed rules', async () => {
      const doc = document.implementation.createHTMLDocument('test')
      const injectFn = createMockInjectFn()
      const rules: CheckRule[] = [
        { id: 'r1', name: 'missing', type: 'selector_exists', config: { selector: '#missing' }, required: true },
      ]
      const script = makeScript({ runAt: 'document_start', rules })

      const record = await runScript(script, doc, injectFn)

      expect(record.ruleResult?.status).toBe('failed')
      expect(record.ruleResult?.failedRules).toContain('r1')
    })

    it('does not run rules when none provided', async () => {
      const doc = document.implementation.createHTMLDocument('test')
      const injectFn = createMockInjectFn()
      const script = makeScript({ runAt: 'document_start' })

      const record = await runScript(script, doc, injectFn)

      expect(record.ruleResult).toBeUndefined()
    })
  })
})
