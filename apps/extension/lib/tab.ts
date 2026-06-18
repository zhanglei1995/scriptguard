/**
 * 获取当前 Tab 信息
 */
import type { TabInfo } from '~types/tab'

export async function getCurrentTabInfo(): Promise<TabInfo> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url) {
    return {
      url: '',
      hostname: 'unknown',
      path: '',
      matchedScripts: [],
    }
  }
  const url = new URL(tab.url)
  return {
    url: tab.url,
    hostname: url.hostname,
    path: url.pathname,
    // TODO(SG-014): 从 store 读取真实匹配脚本
    matchedScripts: [],
  }
}
