import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tabRegistry } from '../registry'

describe('background/registry', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset the registry by cleaning all tabs
    for (const [tabId] of tabRegistry.getAll()) {
      tabRegistry.cleanup(tabId)
    }
  })

  it('stores and retrieves tab state', () => {
    tabRegistry.set(1, { url: 'https://example.com' })
    const state = tabRegistry.get(1)
    expect(state).toBeDefined()
    expect(state?.url).toBe('https://example.com')
    expect(state?.updatedAt).toBeTypeOf('number')
  })

  it('returns undefined for unknown tab', () => {
    expect(tabRegistry.get(999)).toBeUndefined()
  })

  it('resets tab state', () => {
    tabRegistry.set(1, { url: 'https://example.com' })
    tabRegistry.reset(1)
    expect(tabRegistry.get(1)).toBeUndefined()
  })

  it('marks scripts as loaded', () => {
    tabRegistry.set(1, { url: 'https://example.com' })
    tabRegistry.markScriptsLoaded(1)
    const state = tabRegistry.get(1)
    expect(state?.scriptsLoaded).toBe(true)
  })

  it('tracks size', () => {
    expect(tabRegistry.size()).toBe(0)
    tabRegistry.set(1, { url: 'https://a.com' })
    tabRegistry.set(2, { url: 'https://b.com' })
    expect(tabRegistry.size()).toBe(2)
    tabRegistry.cleanup(1)
    expect(tabRegistry.size()).toBe(1)
  })
})
