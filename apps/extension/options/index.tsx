/**
 * Options Page - 扩展选项页
 * SG-022: 本地运行日志
 * SG-048: React.lazy code splitting
 * SG-026: 脚本编辑器 MVP
 * SG-027: 健康检查规则配置 UI
 */

import { lazy, Suspense, useState } from 'react'
import type { PlasmoGetStyle } from 'plasmo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Plus } from 'lucide-react'

const LogsTab = lazy(() =>
  import('./logs').then((mod) => {
    performance.mark('logs-tab-loaded')
    return { default: mod.LogsTab }
  })
)

const ImportTab = lazy(() =>
  import('./import-tab').then((mod) => ({ default: mod.ImportTab }))
)

const EditorView = lazy(() =>
  import('./views/editor').then((mod) => ({ default: mod.EditorView }))
)

const RulesView = lazy(() =>
  import('./views/rules').then((mod) => ({ default: mod.RulesView }))
)

const AlertsTab = lazy(() =>
  import('./views/alerts').then((mod) => ({ default: mod.AlertsTab }))
)

const SettingsTab = lazy(() =>
  import('./views/settings').then((mod) => ({ default: mod.SettingsTab }))
)

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement('style')
  style.textContent = `
    body { width: 800px; min-height: 600px; margin: 0; }
  `
  return style
}

function TabLoadingFallback() {
  return (
    <div className="text-sm text-muted-foreground py-8 text-center">加载中...</div>
  )
}

type SubView = { type: 'editor'; scriptId?: string } | { type: 'rules'; scriptId?: string } | null

function OptionsPage() {
  performance.mark('options-page-render')
  const [subView, setSubView] = useState<SubView>(null)

  if (subView?.type === 'editor') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Suspense fallback={<TabLoadingFallback />}>
          <EditorView scriptId={subView.scriptId} />
        </Suspense>
      </div>
    )
  }

  if (subView?.type === 'rules') {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSubView(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        </div>
        <Suspense fallback={<TabLoadingFallback />}>
          <RulesView scriptId={subView.scriptId} />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🛡️</span>
          <h1 className="text-xl font-semibold">ScriptGuard 设置</h1>
        </div>
        <p className="text-sm text-muted-foreground">管理脚本、查看日志、配置通知</p>
      </header>

      <Tabs defaultValue="scripts">
        <TabsList>
          <TabsTrigger value="scripts">脚本管理</TabsTrigger>
          <TabsTrigger value="tests">测试报告</TabsTrigger>
          <TabsTrigger value="import">导入</TabsTrigger>
          <TabsTrigger value="logs">运行日志</TabsTrigger>
          <TabsTrigger value="alerts">告警中心</TabsTrigger>
          <TabsTrigger value="general">通用设置</TabsTrigger>
        </TabsList>

        <TabsContent value="scripts">
          <Suspense fallback={<TabLoadingFallback />}>
            <ScriptsTab onEditScript={(id) => setSubView({ type: 'editor', scriptId: id })} onOpenRules={(id) => setSubView({ type: 'rules', scriptId: id })} />
          </Suspense>
        </TabsContent>

        <TabsContent value="tests">
          <Suspense fallback={<TabLoadingFallback />}>
            <TestReportsView />
          </Suspense>
        </TabsContent>

        <TabsContent value="import">
          <Suspense fallback={<TabLoadingFallback />}>
            <ImportTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="logs">
          <Suspense fallback={<TabLoadingFallback />}>
            <LogsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="alerts">
          <Suspense fallback={<TabLoadingFallback />}>
            <AlertsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="general">
          <Suspense fallback={<TabLoadingFallback />}>
            <SettingsTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ScriptsTab({
  onEditScript,
  onOpenRules,
}: {
  onEditScript: (id: string) => void
  onOpenRules: (id: string) => void
}) {
  const [scripts, setScripts] = useState<Array<{ id: string; name: string; version: string; enabled: boolean; runAt: string }>>([])
  const [loading, setLoading] = useState(true)

  // Load scripts on mount
  import('../storage/chrome').then(({ scriptsStore }) => {
    scriptsStore.get().then((data) => {
      setScripts(data ?? [])
      setLoading(false)
    })
  })

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">加载中...</div>
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">脚本列表</div>
          <div className="text-xs text-muted-foreground">管理已导入的用户脚本</div>
        </div>
        <Button size="sm" onClick={() => onEditScript('')}>
          <Plus className="h-4 w-4 mr-1" />
          新建脚本
        </Button>
      </div>

      {scripts.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          暂无脚本，请先导入或新建脚本
        </div>
      ) : (
        <div className="space-y-2">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <Badge variant={script.enabled ? 'success' : 'muted'}>
                  {script.enabled ? '已启用' : '已禁用'}
                </Badge>
                <div>
                  <div className="text-sm font-medium">{script.name}</div>
                  <div className="text-xs text-muted-foreground">
                    v{script.version} · {script.runAt}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => onOpenRules(script.id)}>
                  规则
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEditScript(script.id)}>
                  编辑
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OptionsPage
