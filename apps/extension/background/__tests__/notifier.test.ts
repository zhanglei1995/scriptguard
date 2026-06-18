import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Notifier } from '../notifier'

describe('background/notifier', () => {
  let notifier: Notifier

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.storage.local.get).mockResolvedValue({
      preferences: {
        theme: 'system',
        language: 'zh-CN',
        notificationsEnabled: true,
        autoCheck: true,
        defaultIntervalMinutes: 30,
      },
    })
    notifier = new Notifier()
  })

  describe('notifyFailure', () => {
    it('creates failure notification with correct params', async () => {
      await notifier.notifyFailure('Test Script', 'Selector not found', 's1')
      expect(chrome.notifications.create).toHaveBeenCalledWith('failure:s1', {
        type: 'basic',
        iconUrl: 'assets/icon.png',
        title: '脚本检查失败: Test Script',
        message: 'Selector not found',
        priority: 2,
      })
    })

    it('does not send when notifications disabled', async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        preferences: {
          theme: 'system',
          language: 'zh-CN',
          notificationsEnabled: false,
          autoCheck: true,
          defaultIntervalMinutes: 30,
        },
      })
      await notifier.notifyFailure('Test Script', 'reason', 's1')
      expect(chrome.notifications.create).not.toHaveBeenCalled()
    })
  })

  describe('notifyRecovered', () => {
    it('creates recovery notification with correct params', async () => {
      await notifier.notifyRecovered('Test Script', 's1')
      expect(chrome.notifications.create).toHaveBeenCalledWith('recovered:s1', {
        type: 'basic',
        iconUrl: 'assets/icon.png',
        title: '脚本已恢复: Test Script',
        message: '之前检测到的问题已解决。',
        priority: 1,
      })
    })

    it('does not send when notifications disabled', async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        preferences: {
          theme: 'system',
          language: 'zh-CN',
          notificationsEnabled: false,
          autoCheck: true,
          defaultIntervalMinutes: 30,
        },
      })
      await notifier.notifyRecovered('Test Script', 's1')
      expect(chrome.notifications.create).not.toHaveBeenCalled()
    })
  })

  describe('isEnabled', () => {
    it('defaults to true when preferences not set', async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({})
      await notifier.notifyFailure('Test', 'reason', 's1')
      expect(chrome.notifications.create).toHaveBeenCalled()
    })
  })
})
