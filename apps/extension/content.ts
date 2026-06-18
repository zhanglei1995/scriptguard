/**
 * ScriptGuard Content Script
 * 注入到所有页面，捕获错误
 * 关联: TDD §3.1.2 + §9.4
 */

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
}

export {}
