import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { INJECT_RESULT_SOURCE, DEFAULT_TIMEOUT } from '../injector'

let capturedHandler: ((e: MessageEvent) => void) | null = null

beforeEach(() => {
  vi.useFakeTimers()
  capturedHandler = null
  vi.spyOn(window, 'addEventListener').mockImplementation(
    (type: string, fn: EventListenerOrEventListenerObject) => {
      if (type === 'message') {
        capturedHandler = fn as (e: MessageEvent) => void
      }
    }
  )
  vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  capturedHandler = null
})

function firePostMessage(data: unknown) {
  capturedHandler?.(new MessageEvent('message', { data }))
}

describe('injector', () => {
  it('INJECT_RESULT_SOURCE is correct', () => {
    expect(INJECT_RESULT_SOURCE).toBe('scriptguard-inject-result')
  })

  it('DEFAULT_TIMEOUT is 10s', () => {
    expect(DEFAULT_TIMEOUT).toBe(10_000)
  })

  it('returns success on matching postMessage', async () => {
    const { injectScript } = await import('../injector')
    const doc = document.implementation.createHTMLDocument('test')

    const promise = injectScript('s1', 'var x=1', { doc, timeout: 5000 })
    firePostMessage({ source: INJECT_RESULT_SOURCE, scriptId: 's1', status: 'success' })

    const result = await promise
    expect(result.status).toBe('success')
  })

  it('returns error on error postMessage', async () => {
    const { injectScript } = await import('../injector')
    const doc = document.implementation.createHTMLDocument('test')

    const promise = injectScript('s2', 'var x=1', { doc, timeout: 5000 })
    firePostMessage({
      source: INJECT_RESULT_SOURCE,
      scriptId: 's2',
      status: 'error',
      error: 'fail',
    })

    const result = await promise
    expect(result.status).toBe('error')
    expect(result.error).toBe('fail')
  })

  it('returns timeout when no message arrives', async () => {
    const { injectScript } = await import('../injector')
    const doc = document.implementation.createHTMLDocument('test')

    const promise = injectScript('s3', 'var x=1', { doc, timeout: 20 })
    vi.advanceTimersByTime(25)

    const result = await promise
    expect(result.status).toBe('timeout')
    expect(result.error).toContain('timed out')
  })

  it('ignores messages for other script IDs', async () => {
    const { injectScript } = await import('../injector')
    const doc = document.implementation.createHTMLDocument('test')

    const promise = injectScript('s4', 'var x=1', { doc, timeout: 50 })
    firePostMessage({ source: INJECT_RESULT_SOURCE, scriptId: 'wrong', status: 'success' })
    vi.advanceTimersByTime(55)

    const result = await promise
    expect(result.status).toBe('timeout')
  })

  it('creates script element with wrapped code', async () => {
    const { injectScript } = await import('../injector')
    const doc = document.implementation.createHTMLDocument('test')
    const appendSpy = vi.spyOn(doc.documentElement, 'appendChild')

    const promise = injectScript('s5', 'var y=2', { doc, timeout: 5000 })
    firePostMessage({ source: INJECT_RESULT_SOURCE, scriptId: 's5', status: 'success' })
    await promise

    expect(appendSpy).toHaveBeenCalledTimes(1)
    const script = appendSpy.mock.calls[0]![0] as HTMLScriptElement
    expect(script.tagName).toBe('SCRIPT')
    expect(script.textContent).toContain('var y=2')
    expect(script.textContent).toContain(INJECT_RESULT_SOURCE)
  })
})
