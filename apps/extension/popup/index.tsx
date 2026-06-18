/**
 * ScriptGuard Popup 页面 (W1)
 * 380×500 轻量总览
 *
 * 关联: Wireframes §W1
 */

import { useEffect, useState } from 'react'
import type { PlasmoGetStyle } from 'plasmo'
import { StatusBadge } from '~components/StatusBadge'
import { getCurrentTabInfo } from '~lib/tab'

// ====== Plasmo 样式注入 ======
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement('style')
  style.textContent = `
    body { width: 380px; height: 500px; margin: 0; }
  `
  return style
}

// ====== 类型 ======
interface TabInfo {
  url: string
  hostname: string
  path: string
  matchedScripts: Array<{
    id: string
    name: string
    version: string
    status: 'healthy' | 'degraded' | 'failed' | 'unknown'
    lastChecked: string
  }>
}

// ====== 组件 ======
function PopupApp() {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentTabInfo()
      .then(setTabInfo)
      .catch((err) => console.error('[SG Popup] error:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        加载中...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-11 border-b">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <span className="font-semibold">ScriptGuard</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <button className="hover:text-foreground" title="设置">⚙</button>
          <button className="hover:text-foreground" title="新建脚本">＋</button>
          <button className="hover:text-foreground" title="更多">⋯</button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 当前页面 */}
        <section>
          <div className="text-xs text-muted-foreground mb-1">当前页面</div>
          <div className="flex items-center gap-1 text-sm font-mono truncate">
            <span>🌐</span>
            <span className="truncate">{tabInfo?.hostname}{tabInfo?.path}</span>
          </div>
        </section>

        <hr className="border-border" />

        {/* 匹配脚本 */}
        <section>
          <div className="text-xs text-muted-foreground mb-2">
            匹配脚本 ({tabInfo?.matchedScripts.length ?? 0})
          </div>
          {tabInfo?.matchedScripts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {tabInfo?.matchedScripts.map((s) => (
                <ScriptCard key={s.id} script={s} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer Actions */}
      <footer className="border-t p-3 flex gap-2">
        <button className="flex-1 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
          🧪 立即测试
        </button>
        <button className="flex-1 px-3 py-2 text-sm rounded-md border hover:bg-muted">
          📋 查看日志
        </button>
        <button className="flex-1 px-3 py-2 text-sm rounded-md border hover:bg-muted">
          ⚙ 打开后台
        </button>
      </footer>
    </div>
  )
}

function ScriptCard({ script }: { script: NonNullable<TabInfo['matchedScripts']>[0] }) {
  return (
    <div className="rounded-md border p-3 hover:shadow-sg-sm transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <StatusBadge status={script.status} />
        <span className="text-xs text-muted-foreground">v{script.version}</span>
      </div>
      <div className="font-medium text-sm">{script.name}</div>
      <div className="text-xs text-muted-foreground mt-1">上次检测：{script.lastChecked}</div>
      <div className="mt-2 flex gap-2">
        <button className="text-xs px-2 py-1 rounded-md border hover:bg-muted">详情</button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-8 text-sm text-muted-foreground">
      <div className="text-4xl mb-2">📭</div>
      <div>当前页面没有匹配的脚本</div>
      <div className="mt-1 text-xs">点击右上角 [＋] 为此页面创建脚本</div>
    </div>
  )
}

export default PopupApp
