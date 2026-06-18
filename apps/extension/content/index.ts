/**
 * ScriptGuard Content Script
 * 注入到所有页面，捕获错误和执行健康检查
 *
 * 关联: TDD §3.1.2 + §9.4
 */

import { capturePageError, startCheck, type CheckReport } from '~lib/checks'
import type { PlasmoCSConfig } from 'plasmo'

// ====== Plasmo Content Script 配置 ======
export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  run_at: 'document_start',
  world: 'ISOLATED',
}

// ====== 错误捕获（最早时机） ======
capturePageError(window)

// ====== 启动 ======
async function bootstrap() {
  // 等待 DOM 就绪后开始
  if (document.readyState === 'loading') {
    await new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true })
    })
  }

  try {
    // 从 Background 拉取匹配当前 URL 的脚本
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SCRIPTS_FOR_URL',
      payload: { url: location.href },
    })

    if (response?.type === 'SCRIPTS_RESULT' && Array.isArray(response.scripts)) {
      for (const script of response.scripts) {
        await injectAndRun(script)
      }
    }
  } catch (err) {
    // Background 未响应时静默失败（不影响页面）
    console.debug('[ScriptGuard] Background not available:', err)
  }
}

async function injectAndRun(script: { id: string; name: string; runAt: string; code: string }) {
  try {
    // TODO(SG-015): 真实的脚本注入 + 规则执行
    const report: CheckReport = {
      scriptId: script.id,
      url: location.href,
      status: 'healthy',
      startedAt: Date.now(),
      endedAt: Date.now(),
      duration: 0,
      failedRules: [],
    }
    await startCheck(report)
  } catch (err) {
    console.debug(`[ScriptGuard] Script ${script.name} failed:`, err)
  }
}

bootstrap()
