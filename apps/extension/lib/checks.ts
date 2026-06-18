/**
 * 健康检查执行入口
 */
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
 * 捕获页面错误（最早时机注入）
 */
export function capturePageError(_win: Window) {
  // 错误监听
  _win.addEventListener('error', (e) => {
    console.debug('[SG] page error:', e.error)
  })
  _win.addEventListener('unhandledrejection', (e) => {
    console.debug('[SG] unhandled rejection:', e.reason)
  })
}

/**
 * 启动一次健康检查
 */
export async function startCheck(report: CheckReport) {
  // TODO(SG-017): 真实规则执行
  // 现在先 stub
  await new Promise((r) => setTimeout(r, 10))
  console.debug('[SG] Check completed:', report.scriptId, report.status)
}
