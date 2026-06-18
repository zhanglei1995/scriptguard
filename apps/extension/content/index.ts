/**
 * ScriptGuard Content Script
 * 注入到所有页面，捕获错误和执行健康检查
 *
 * 关联: TDD §3.1.2 + §9.4 + §5.1
 */

import type { PlasmoCSConfig } from 'plasmo'
import { capturePageError, startCheck, type CheckReport, type HealthStatus } from '~lib/checks'
import { injectScript, DEFAULT_TIMEOUT } from '~content/injector'
import { isPageError } from '~content/error-capture'

// ====== Plasmo Content Script 配置 ======
export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  run_at: 'document_start',
  world: 'ISOLATED',
}

// ====== 错误捕获（最早时机） ======
const pageErrors: Array<{ type: string; message: string; time: number }> = []

capturePageError(window, (err: { type: string; message: string; reason?: string }) => {
  pageErrors.push({
    type: err.type,
    message: err.type === 'error' ? err.message : err.reason ?? '',
    time: Date.now(),
  })
})

// ====== 启动 ======
async function bootstrap() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SCRIPTS_FOR_URL',
      payload: { url: location.href },
    })

    if (response?.type === 'SCRIPTS_RESULT' && Array.isArray(response.scripts)) {
      for (const script of response.scripts) {
        await injectAndRun(script)
      }
    }
  } catch (err: unknown) {
    console.debug('[ScriptGuard] Background not available:', err)
  }
}

async function injectAndRun(script: {
  id: string
  name: string
  code: string
  timeout?: number
}) {
  const startedAt = Date.now()
  const errorsBefore = pageErrors.length

  try {
    const result = await injectScript(script.id, script.code, {
      timeout: script.timeout ?? DEFAULT_TIMEOUT,
    })

    const endedAt = Date.now()
    const duration = endedAt - startedAt
    const newErrors = pageErrors.slice(errorsBefore)

    let status: HealthStatus = 'healthy'
    const failedRules: string[] = []

    if (result.status === 'timeout') {
      status = 'failed'
      failedRules.push('timeout')
    } else if (result.status === 'error') {
      status = 'failed'
      failedRules.push('runtime_error')
    } else if (newErrors.length > 0) {
      status = 'degraded'
      for (const e of newErrors) {
        failedRules.push(`page_error:${e.type}`)
      }
    }

    const report: CheckReport = {
      scriptId: script.id,
      url: location.href,
      status,
      startedAt,
      endedAt,
      duration,
      failedRules,
      errorMessage: result.error,
    }

    await startCheck(report)
  } catch (err) {
    const endedAt = Date.now()
    const report: CheckReport = {
      scriptId: script.id,
      url: location.href,
      status: 'failed',
      startedAt,
      endedAt,
      duration: endedAt - startedAt,
      failedRules: ['injection_error'],
      errorMessage: err instanceof Error ? err.message : String(err),
    }
    await startCheck(report)
  }
}

bootstrap()

export {}
