/**
 * 健康检查执行入口
 * 关联: TDD §5.1 消息协议 + §9.4 错误隔离
 */

import { injectErrorCapture, type PageError } from '~content/error-capture'

export type HealthStatus = 'healthy' | 'degraded' | 'failed' | 'unknown'

export interface CheckReport {
  scriptId: string
  url: string
  status: HealthStatus
  startedAt: number
  endedAt: number
  duration: number
  failedRules: string[]
  errorMessage?: string
}

/**
 * 捕获页面错误
 * 在 ISOLATED world 中注入 MAIN world 错误捕获脚本
 * 并监听 MAIN world 发来的错误消息
 */
export function capturePageError(
  win: Window,
  onError?: (error: PageError) => void
): void {
  injectErrorCapture()

  win.addEventListener('message', (e: MessageEvent) => {
    if (
      typeof e.data === 'object' &&
      e.data !== null &&
      e.data.source === 'scriptguard-error-capture'
    ) {
      console.debug('[SG] page error from MAIN world:', e.data)
      onError?.(e.data as PageError)
    }
  })
}

/**
 * 向 Background 上报健康检查结果
 */
export async function startCheck(report: CheckReport): Promise<void> {
  await chrome.runtime.sendMessage({
    type: 'REPORT_CHECK',
    payload: {
      scriptId: report.scriptId,
      status: report.status,
      url: report.url,
      duration: report.duration,
      failedRules: report.failedRules,
      error: report.errorMessage,
    },
  })
}
