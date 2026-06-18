/**
 * ScriptGuard Background Service Worker
 * 入口点 - 生命周期、消息路由、Tab 管理、定时任务
 *
 * 关联: TDD §3.1.1 + §6.2
 */

import { routeMessage } from './router'
import { tabRegistry } from './registry'
import { parseAlarmScriptId } from './alarms'

// ====== 生命周期 ======
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[BG] Installed:', details.reason)
  await tabRegistry.init()
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage?.()
  }
})

chrome.runtime.onStartup.addListener(async () => {
  console.log('[BG] Starting up...')
  await tabRegistry.init()
})

// ====== 消息路由 ======
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  routeMessage(message, sender)
    .then(sendResponse)
    .catch((err) => {
      console.error('[BG] Message error:', err)
      sendResponse({ ok: false, error: String(err) })
    })
  return true
})

// ====== Tab 管理 ======
chrome.tabs.onRemoved.addListener((tabId) => {
  tabRegistry.cleanup(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabRegistry.reset(tabId)
  }
})

// ====== 定时任务 ======
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const scriptId = parseAlarmScriptId(alarm.name)
  if (scriptId) {
    console.log('[BG] Alarm triggered for script:', scriptId)
    // TODO(SG-023): 执行本地检查
  }
})

// ====== 通知点击 ======
chrome.notifications?.onClicked.addListener((notificationId) => {
  console.log('[BG] Notification clicked:', notificationId)
  chrome.runtime.openOptionsPage()
})

console.log('[BG] Background service worker loaded')

export default function Background() {
  // Plasmo requires default export
}
