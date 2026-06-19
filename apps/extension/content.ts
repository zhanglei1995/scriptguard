/**
 * ScriptGuard Content Script
 * 注入到所有页面，捕获错误 + 执行手动检查
 * 关联: TDD §3.1.2 + §9.4
 * SG-021: 手动测试功能
 * SG-048: Performance marks
 */

performance.mark('content-script-start')

import { executeRules, type CheckRule, type ExecuteResult } from './content/rule-engine'

// 错误捕获（最早时机）
window.addEventListener('error', (e) => {
  console.debug('[SG] page error:', e.error)
}, true)
window.addEventListener('unhandledrejection', (e) => {
  console.debug('[SG] unhandled rejection:', e.reason)
}, true)

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true })
} else {
  bootstrap()
}

async function bootstrap() {
  performance.mark('content-script-bootstrap-start')
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SCRIPTS_FOR_URL',
      payload: { url: location.href },
    })
    if (response?.type === 'SCRIPTS_RESULT' && Array.isArray(response.scripts)) {
      console.debug('[SG] matched scripts:', response.scripts.length)
    }
  } catch {
    // Background 未响应时静默失败
  }
  performance.mark('content-script-bootstrap-end')
  performance.measure('content-script-bootstrap', 'content-script-bootstrap-start', 'content-script-bootstrap-end')
}

// ====== RUN_CHECK handler ======
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RUN_CHECK') {
    handleRunCheck(message.payload?.scripts ?? [])
      .then(sendResponse)
      .catch((err) => {
        sendResponse({ ok: false, error: String(err) })
      })
    return true // async response
  }
})

interface ScriptPayload {
  id: string
  name: string
  code: string
  rules?: CheckRule[]
  timeout?: number
}

async function handleRunCheck(scripts: ScriptPayload[]) {
  const results = []
  const url = location.href

  for (const script of scripts) {
    const startedAt = Date.now()
    let status: 'healthy' | 'degraded' | 'failed' = 'healthy'
    let failedRules: string[] = []
    let errorMessage: string | undefined

    try {
      if (script.rules && script.rules.length > 0) {
        const ruleResult: ExecuteResult = executeRules(script.rules, document, url)
        status = ruleResult.status
        failedRules = ruleResult.failedRules
      }
    } catch (err) {
      status = 'failed'
      errorMessage = err instanceof Error ? err.message : String(err)
      failedRules = ['execution_error']
    }

    results.push({
      scriptId: script.id,
      scriptName: script.name,
      status,
      url,
      duration: Date.now() - startedAt,
      failedRules,
      errorMessage,
    })
  }

  return { ok: true, results }
}

export {}

performance.mark('content-script-end')
performance.measure('content-script-total', 'content-script-start', 'content-script-end')
