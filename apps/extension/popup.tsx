import { useState } from 'react'
import { Button } from '~components/ui/button'
import { Badge } from '~components/ui/badge'
import { Card } from '~components/ui/card'
import {
  useCurrentTab,
  useMatchedScripts,
  useTestRunner,
  formatRelativeTime,
  type TestResult,
  type ScriptCheckResult,
} from './popup/hooks'
import type { Script } from '~storage/schemas'

const statusConfig: Record<
  string,
  { label: string; icon: string; variant: 'success' | 'warning' | 'destructive' | 'muted' }
> = {
  healthy: { label: '通过', icon: '✅', variant: 'success' },
  degraded: { label: '降级', icon: '⚠️', variant: 'warning' },
  failed: { label: '失效', icon: '❌', variant: 'destructive' },
  unknown: { label: '未检测', icon: '🔘', variant: 'muted' },
}

function ScriptCard({
  script,
  lastStatus,
  lastCheckTime,
}: {
  script: Script
  lastStatus: string
  lastCheckTime: number | null
}) {
  const cfg = statusConfig[lastStatus] ?? statusConfig.unknown

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-1">
        <Badge variant={cfg.variant} className="text-xs">
          {cfg.icon} {cfg.label}
        </Badge>
        <span className="text-xs text-muted-foreground">v{script.version}</span>
      </div>
      <div className="font-medium text-sm mt-1">{script.name}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">
          上次检测：{lastCheckTime ? formatRelativeTime(lastCheckTime) : '未检测'}
        </span>
      </div>
    </Card>
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

function TestResultSummary({ result }: { result: TestResult }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground mb-2">测试结果</div>
      <div className="flex items-center gap-3 mb-2">
        <Badge variant="success" className="text-xs">✅ {result.passed} 通过</Badge>
        {result.failed > 0 && <Badge variant="destructive" className="text-xs">❌ {result.failed} 失败</Badge>}
        {result.degraded > 0 && <Badge variant="warning" className="text-xs">⚠️ {result.degraded} 降级</Badge>}
      </div>
      <div className="space-y-1">
        {result.details.map((d) => (
          <ResultDetail key={d.scriptId} detail={d} />
        ))}
      </div>
    </Card>
  )
}

function ResultDetail({ detail }: { detail: ScriptCheckResult }) {
  const cfg = statusConfig[detail.status] ?? statusConfig.unknown

  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
      <span className="truncate max-w-[200px]">{detail.scriptName}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-muted-foreground">{detail.duration}ms</span>
        <Badge variant={cfg.variant} className="text-[10px] px-1">
          {cfg.icon} {cfg.label}
        </Badge>
      </div>
    </div>
  )
}

function ErrorOverlay({ error, onClose }: { error: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="mx-4 p-4 max-w-[320px]">
        <div className="text-sm font-medium mb-2">测试失败</div>
        <div className="text-xs text-muted-foreground mb-3">{error}</div>
        <Button size="sm" className="w-full" onClick={onClose}>
          关闭
        </Button>
      </Card>
    </div>
  )
}

function PopupApp() {
  const { tab, loading, displayUrl } = useCurrentTab()
  const matchedScripts = useMatchedScripts(tab?.url ?? null)
  const { status, result, runTest, reset } = useTestRunner()
  const [showError, setShowError] = useState(false)

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  const handleCopyUrl = () => {
    if (tab?.url) navigator.clipboard.writeText(tab.url)
  }

  const handleRunTest = async () => {
    setShowError(false)
    await runTest()
  }

  if (loading) {
    return (
      <div className="w-[380px] h-[500px] flex items-center justify-center text-sm text-muted-foreground">
        加载中...
      </div>
    )
  }

  const isRunning = status === 'running'
  const hasResult = status === 'completed' && result
  const hasFailed = status === 'failed'

  return (
    <div className="w-[380px] h-[500px] flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-11 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <span className="font-semibold text-sm">ScriptGuard</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <button
            className="hover:text-foreground transition-colors"
            title="设置"
            onClick={handleOpenOptions}
          >
            ⚙
          </button>
          <button className="hover:text-foreground transition-colors" title="新建脚本">
            ＋
          </button>
          <button className="hover:text-foreground transition-colors" title="更多">
            ⋯
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Current page */}
        <section>
          <div className="text-xs text-muted-foreground mb-1">当前页面</div>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-sm font-mono truncate min-w-0">
              <span className="shrink-0">🌐</span>
              <span className="truncate">{displayUrl || '未知页面'}</span>
            </div>
            <button
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title="复制链接"
              onClick={handleCopyUrl}
            >
              📋
            </button>
          </div>
        </section>

        <hr className="border-border" />

        {/* Test result summary */}
        {hasResult && <TestResultSummary result={result} />}

        {/* Matched scripts */}
        {!hasResult && (
          <section>
            <div className="text-xs text-muted-foreground mb-2">
              匹配脚本 ({matchedScripts.length})
            </div>
            {matchedScripts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {matchedScripts.map((script) => (
                  <ScriptCard
                    key={script.id}
                    script={script}
                    lastStatus="unknown"
                    lastCheckTime={script.updatedAt}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer actions */}
      <footer className="border-t p-3 flex gap-2 shrink-0">
        <Button
          className="flex-1"
          size="sm"
          onClick={hasResult ? reset : handleRunTest}
          disabled={isRunning || matchedScripts.length === 0}
        >
          {isRunning ? '⏳ 测试中...' : hasResult ? '🔄 重新测试' : '🧪 立即测试'}
        </Button>
        <Button variant="outline" className="flex-1" size="sm" disabled>
          📋 查看日志
        </Button>
        <Button variant="outline" className="flex-1" size="sm" onClick={handleOpenOptions}>
          ⚙ 打开后台
        </Button>
      </footer>

      {/* Bottom tab bar */}
      <nav className="border-t px-4 h-9 flex items-center justify-between text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-3">
          <button className="hover:text-foreground transition-colors">通知</button>
          <button className="hover:text-foreground transition-colors">报告</button>
          <button className="hover:text-foreground transition-colors">设置</button>
        </div>
        <span className="text-[10px]">⌘K 搜索</span>
      </nav>

      {/* Error overlay */}
      {hasFailed && showError && (
        <ErrorOverlay error="测试执行失败，请稍后重试" onClose={() => setShowError(false)} />
      )}
    </div>
  )
}

export default PopupApp
