/**
 * CheckRunner - 手动测试执行器
 * SG-021: 手动测试功能
 */

import { addCheck } from '../storage/db'
import type { HealthStatus } from '../storage/schemas'

// ====== Types ======
export interface CheckResult {
  scriptId: string
  scriptName: string
  status: HealthStatus
  url: string
  duration: number
  failedRules: string[]
  errorMessage?: string
}

export interface ManualCheckResponse {
  ok: boolean
  results?: CheckResult[]
  error?: string
}

// ====== CheckRunner ======
export class CheckRunner {
  /**
   * Run manual check on the current active tab
   * Sends RUN_CHECK message to content script, collects results, writes to IndexedDB
   */
  async runManualCheck(): Promise<ManualCheckResponse> {
    try {
      // 1. Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id || !tab?.url) {
        return { ok: false, error: 'No active tab found' }
      }

      // 2. Get matched scripts for this URL
      const scriptsResponse = await chrome.runtime.sendMessage({
        type: 'GET_SCRIPTS_FOR_URL',
        payload: { url: tab.url },
      })

      if (!scriptsResponse?.type === 'SCRIPTS_RESULT' || !Array.isArray(scriptsResponse.scripts)) {
        return { ok: false, error: 'Failed to get matched scripts' }
      }

      const scripts = scriptsResponse.scripts
      if (scripts.length === 0) {
        return { ok: false, error: 'No matched scripts for this URL' }
      }

      // 3. Send RUN_CHECK to content script
      let contentResponse
      try {
        contentResponse = await chrome.tabs.sendMessage(tab.id, {
          type: 'RUN_CHECK',
          payload: { scripts },
        })
      } catch {
        // Content script may not be injected yet; inject and retry
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          })
          contentResponse = await chrome.tabs.sendMessage(tab.id, {
            type: 'RUN_CHECK',
            payload: { scripts },
          })
        } catch {
          return { ok: false, error: 'Cannot reach content script. Try refreshing the page.' }
        }
      }

      if (!contentResponse?.ok) {
        return { ok: false, error: contentResponse?.error || 'Content script check failed' }
      }

      // 4. Process results and write to IndexedDB
      const results: CheckResult[] = contentResponse.results || []
      for (const result of results) {
        await addCheck({
          scriptId: result.scriptId,
          timestamp: new Date(),
          status: result.status,
          url: result.url,
          duration: result.duration,
          failedRules: result.failedRules,
          errorMessage: result.errorMessage,
        })
      }

      return { ok: true, results }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}

export const checkRunner = new CheckRunner()
