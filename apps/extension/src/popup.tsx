/**
 * ScriptGuard Popup 页面 (W1)
 * 关联: Wireframes §W1
 */
import { useEffect, useState } from 'react'

type HealthStatus = 'healthy' | 'degraded' | 'failed' | 'unknown'

interface MatchedScript {
  id: string
  name: string
  version: string
  status: HealthStatus
}

const statusLabel: Record<HealthStatus, string> = {
  healthy: '✅ 正常',
  degraded: '⚠️ 降级',
  failed: '❌ 失效',
  unknown: '🔘 未检测',
}

function PopupApp() {
  const [hostname, setHostname] = useState('加载中...')
  const [scripts, setScripts] = useState<MatchedScript[]>([])

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        try {
          setHostname(new URL(tab.url).hostname)
        } catch {
          setHostname(tab.url)
        }
      }
    })
  }, [])

  return (
    <div style={{ width: 380, minHeight: 500, fontFamily: 'system-ui, sans-serif', fontSize: 14 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 600 }}>🛡️ ScriptGuard</div>
        <div style={{ color: '#64748b', fontSize: 12 }}>v0.1.0</div>
      </header>
      <main style={{ padding: 16 }}>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>当前页面</div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, marginBottom: 16 }}>🌐 {hostname}</div>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>匹配脚本 ({scripts.length})</div>
        {scripts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
            <div style={{ fontSize: 36 }}>📭</div>
            <div style={{ marginTop: 8 }}>当前页面没有匹配的脚本</div>
          </div>
        ) : (
          scripts.map((s) => (
            <div key={s.id} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{statusLabel[s.status]}</span>
                <span style={{ color: '#64748b', fontSize: 12 }}>v{s.version}</span>
              </div>
              <div style={{ marginTop: 4, fontWeight: 500 }}>{s.name}</div>
            </div>
          ))
        )}
      </main>
      <footer style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
        <button style={{ flex: 1, padding: 8, background: '#3B82F6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>🧪 立即测试</button>
        <button style={{ flex: 1, padding: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>📋 日志</button>
        <button style={{ flex: 1, padding: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>⚙ 后台</button>
      </footer>
    </div>
  )
}

export default PopupApp
