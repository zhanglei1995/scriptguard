/**
 * Options Page - 扩展选项页
 * SG-022: 本地运行日志
 */

import type { PlasmoGetStyle } from 'plasmo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { LogsTab } from './logs'

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement('style')
  style.textContent = `
    body { width: 800px; min-height: 600px; margin: 0; }
  `
  return style
}

function OptionsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🛡️</span>
          <h1 className="text-xl font-semibold">ScriptGuard 设置</h1>
        </div>
        <p className="text-sm text-muted-foreground">管理脚本、查看日志、配置通知</p>
      </header>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="scripts">脚本管理</TabsTrigger>
          <TabsTrigger value="logs">运行日志</TabsTrigger>
          <TabsTrigger value="alerts">告警设置</TabsTrigger>
          <TabsTrigger value="general">通用设置</TabsTrigger>
        </TabsList>

        <TabsContent value="scripts">
          <div className="text-sm text-muted-foreground py-8 text-center">
            脚本管理功能开发中...
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <LogsTab />
        </TabsContent>

        <TabsContent value="alerts">
          <div className="text-sm text-muted-foreground py-8 text-center">
            告警设置功能开发中...
          </div>
        </TabsContent>

        <TabsContent value="general">
          <div className="text-sm text-muted-foreground py-8 text-center">
            通用设置功能开发中...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OptionsPage
