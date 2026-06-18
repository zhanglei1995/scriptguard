import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckRunner } from '../check-runner'

describe('background/check-runner', () => {
  let runner: CheckRunner

  beforeEach(() => {
    vi.clearAllMocks()
    runner = new CheckRunner()
  })

  it('returns error when no active tab', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([])
    const result = await runner.runManualCheck()
    expect(result.ok).toBe(false)
    expect(result.error).toContain('No active tab')
  })

  it('returns error when tab has no url', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([{ id: 1, url: undefined } as any])
    const result = await runner.runManualCheck()
    expect(result.ok).toBe(false)
    expect(result.error).toContain('No active tab')
  })

  it('returns error when no matched scripts', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 1, url: 'https://example.com' } as any,
    ])
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue({
      type: 'SCRIPTS_RESULT',
      scripts: [],
    })
    const result = await runner.runManualCheck()
    expect(result.ok).toBe(false)
    expect(result.error).toContain('No matched scripts')
  })

  it('returns error when content script unreachable', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 1, url: 'https://example.com' } as any,
    ])
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue({
      type: 'SCRIPTS_RESULT',
      scripts: [{ id: 's1', name: 'Test', code: '', matchRules: [] }],
    })
    vi.mocked(chrome.tabs.sendMessage).mockRejectedValue(new Error('No tab'))
    vi.mocked(chrome.scripting.executeScript).mockRejectedValue(new Error('No tab'))
    const result = await runner.runManualCheck()
    expect(result.ok).toBe(false)
    expect(result.error).toContain('Cannot reach content script')
  })

  it('successfully runs check and returns results', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 1, url: 'https://example.com' } as any,
    ])
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue({
      type: 'SCRIPTS_RESULT',
      scripts: [{ id: 's1', name: 'Test Script', code: '', matchRules: [] }],
    })
    vi.mocked(chrome.tabs.sendMessage).mockResolvedValue({
      ok: true,
      results: [
        {
          scriptId: 's1',
          scriptName: 'Test Script',
          status: 'healthy',
          url: 'https://example.com',
          duration: 50,
          failedRules: [],
        },
      ],
    })
    const result = await runner.runManualCheck()
    expect(result.ok).toBe(true)
    expect(result.results).toHaveLength(1)
    expect(result.results![0].status).toBe('healthy')
  })
})
