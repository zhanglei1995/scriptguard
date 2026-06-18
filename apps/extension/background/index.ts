/**
 * ScriptGuard Background Service Worker
 * 入口点 - 消息路由、Tab 注册表、调度、通知
 *
 * 关联: TDD §3.1.1 + §6.2
 */

import { tabRegistry } from '~lib/registry'
import { scheduler } from '~lib/scheduler'

// ====== 生命周期 ======
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[ScriptGuard] Installed:', details.reason)
  await tabRegistry.init()
  await scheduler.init()
  if (details.reason === 'install') {
    await chrome.runtime.openOptionsPage?.()
  }
})

chrome.runtime.onStartup.addListener(async () => {
  console.log('[ScriptGuard] Starting up...')
  await tabRegistry.init()
  await scheduler.init()
})

// ====== 消息路由 ======
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 异步处理
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => {
      console.error('[ScriptGuard] Message error:', err)
      sendResponse({ ok: false, error: String(err) })
    })
  return true // 保持 sendResponse 有效
})

async function handleMessage(
  message: { type: string; payload?: unknown },
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    case 'GET_SCRIPTS_FOR_URL': {
      const url = message.payload as { url: string }
      // TODO(SG-014): 接入真实脚本注册表
      return { type: 'SCRIPTS_RESULT', scripts: [] }
    }
    case 'REPORT_CHECK': {
      const report = message.payload as { scriptId: string; status: string }
      console.log('[ScriptGuard] Check report:', report)
      // TODO(SG-022): 写入 IndexedDB
      return { ok: true }
    }
    case 'PING': {
      return { type: 'PONG', timestamp: Date.now() }
    }
    default:
      console.warn('[ScriptGuard] Unknown message type:', message.type)
      return { ok: false, error: 'Unknown message type' }
  }
}

// ====== Tab 状态管理 ======
chrome.tabs.onRemoved.addListener((tabId) => {
  tabRegistry.cleanup(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabRegistry.reset(tabId)
  }
})

// ====== 定时任务 (alarms) ======
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('check:')) {
    const scriptId = alarm.name.slice(6)
    await scheduler.runLocalCheck(scriptId)
  }
})

// ====== 通知点击 ======
chrome.notifications?.onClicked.addListener((notificationId) => {
  // TODO(SG-020): 跳转到对应 issue
  console.log('[ScriptGuard] Notification clicked:', notificationId)
})

// Plasmo 要求的 default export（占位函数）
export default function Background() {
  console.log('[ScriptGuard] Background service worker loaded')
}

console.log('[ScriptGuard] Background service worker loaded')
