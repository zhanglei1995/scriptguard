import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Scheduler } from '../scheduler'

const mockCreatedTab = { id: 42 }

function makeScript(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    name: 'Test',
    enabled: true,
    config: {},
    matchRules: ['https://example.com'],
    code: '',
    version: '1.0.0',
    alertLevel: 'medium',
    description: '',
    runAt: 'document_idle',
    tags: [],
    groupId: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

function mockScriptStore(scripts: unknown[]) {
  vi.mocked(chrome.storage.local.get).mockResolvedValue({
    'sg-scripts': { state: { scripts } },
  })
}

function mockTabLoadComplete() {
  vi.mocked(chrome.tabs.onUpdated.addListener).mockImplementation((listener: any) => {
    listener(42, { status: 'complete' })
  })
  vi.mocked(chrome.tabs.onUpdated.removeListener).mockImplementation(() => {})
}

describe('background/scheduler', () => {
  let scheduler: Scheduler

  beforeEach(() => {
    vi.clearAllMocks()
    scheduler = new Scheduler()
    vi.mocked(chrome.storage.local.get).mockResolvedValue({})
    vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)
    vi.mocked(chrome.alarms.create).mockResolvedValue(undefined as any)
    vi.mocked(chrome.alarms.clear).mockResolvedValue(true)
    vi.mocked(chrome.alarms.clearAll).mockResolvedValue(true)
    vi.mocked(chrome.alarms.getAll).mockResolvedValue([])
    vi.mocked(chrome.tabs.create).mockResolvedValue(mockCreatedTab as any)
    vi.mocked(chrome.tabs.remove).mockResolvedValue(undefined)
    vi.mocked(chrome.tabs.sendMessage).mockResolvedValue({
      ok: true,
      results: [
        {
          scriptId: 's1',
          scriptName: 'Test',
          status: 'healthy',
          url: 'https://example.com',
          duration: 100,
          failedRules: [],
        },
      ],
    })
    vi.mocked(chrome.scripting.executeScript).mockResolvedValue(undefined as any)
    vi.mocked(chrome.tabs.onUpdated.addListener).mockImplementation(() => {})
  })

  describe('init', () => {
    it('registers alarms for all enabled scripts', async () => {
      mockScriptStore([
        { id: 's1', enabled: true, config: { checkInterval: 300 }, matchRules: ['https://a.com'] },
        { id: 's2', enabled: false, config: {}, matchRules: ['https://b.com'] },
        { id: 's3', enabled: true, config: {}, matchRules: ['https://c.com'] },
      ])

      await scheduler.init()

      expect(chrome.alarms.create).toHaveBeenCalledTimes(2)
      expect(chrome.alarms.create).toHaveBeenCalledWith('check:s1', {
        delayInMinutes: 5,
        periodInMinutes: 5,
      })
      expect(chrome.alarms.create).toHaveBeenCalledWith('check:s3', {
        delayInMinutes: 30,
        periodInMinutes: 30,
      })
    })

    it('does nothing when no scripts exist', async () => {
      await scheduler.init()
      expect(chrome.alarms.create).not.toHaveBeenCalled()
    })
  })

  describe('scheduleScript', () => {
    it('creates alarm with correct interval', async () => {
      await scheduler.scheduleScript('s1', 600)
      expect(chrome.alarms.create).toHaveBeenCalledWith('check:s1', {
        delayInMinutes: 10,
        periodInMinutes: 10,
      })
    })

    it('clamps interval to minimum 60 seconds', async () => {
      await scheduler.scheduleScript('s1', 10)
      expect(chrome.alarms.create).toHaveBeenCalledWith('check:s1', {
        delayInMinutes: 1,
        periodInMinutes: 1,
      })
    })
  })

  describe('unscheduleScript', () => {
    it('clears the alarm', async () => {
      await scheduler.unscheduleScript('s1')
      expect(chrome.alarms.clear).toHaveBeenCalledWith('check:s1')
    })
  })

  describe('rescheduleAll', () => {
    it('clears all check alarms then reinitializes', async () => {
      vi.mocked(chrome.alarms.getAll).mockResolvedValue([
        { name: 'check:s1', scheduledTime: 0 },
        { name: 'other', scheduledTime: 0 },
      ] as any)
      mockScriptStore([
        { id: 's1', enabled: true, config: {}, matchRules: ['https://a.com'] },
      ])

      await scheduler.rescheduleAll()

      expect(chrome.alarms.getAll).toHaveBeenCalled()
      expect(chrome.alarms.clear).toHaveBeenCalledWith('check:s1')
      expect(chrome.alarms.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleAlarm', () => {
    it('opens background tab and sends RUN_CHECK', async () => {
      mockScriptStore([makeScript()])
      mockTabLoadComplete()

      await scheduler.handleAlarm('s1')

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        active: false,
      })
      expect(chrome.scripting.executeScript).toHaveBeenCalled()
      expect(chrome.tabs.sendMessage).toHaveBeenCalled()
      expect(chrome.tabs.remove).toHaveBeenCalledWith(42)
    })

    it('closes tab even on error', async () => {
      mockScriptStore([makeScript()])
      mockTabLoadComplete()
      vi.mocked(chrome.tabs.sendMessage).mockRejectedValue(new Error('Connection lost'))

      await scheduler.handleAlarm('s1')

      expect(chrome.tabs.remove).toHaveBeenCalledWith(42)
    })

    it('skips if script not found', async () => {
      await scheduler.handleAlarm('nonexistent')
      expect(chrome.tabs.create).not.toHaveBeenCalled()
    })

    it('skips if no match rules', async () => {
      mockScriptStore([makeScript({ matchRules: [] })])
      await scheduler.handleAlarm('s1')
      expect(chrome.tabs.create).not.toHaveBeenCalled()
    })
  })
})
