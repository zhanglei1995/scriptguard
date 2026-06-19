import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { useScriptsStore } from '../../store'
import { getRecentChecks, getUnacknowledgedAlerts } from '../../storage/db'
import type { CheckRecord } from '../../storage/schemas'
import { Activity, AlertTriangle, CheckCircle, FileCode, Plus, Bell, Play } from 'lucide-react'

const fmt = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function statusBadge(status: string) {
  switch (status) {
    case 'healthy':
      return <Badge variant="success">正常</Badge>
    case 'degraded':
      return <Badge variant="warning">降级</Badge>
    case 'failed':
      return <Badge variant="destructive">失败</Badge>
    default:
      return <Badge variant="muted">未知</Badge>
  }
}

export function DashboardTab() {
  const { scripts, getScript } = useScriptsStore()
  const [recentChecks, setRecentChecks] = useState<CheckRecord[]>([])
  const [alertCount, setAlertCount] = useState(0)

  const load = useCallback(async () => {
    const [checks, alerts] = await Promise.all([
      getRecentChecks(10),
      getUnacknowledgedAlerts(),
    ])
    setRecentChecks(checks)
    setAlertCount(alerts.length)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const healthy = scripts.filter((s) => s.enabled).length
  const failed = scripts.filter((s) => !s.enabled).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总脚本数</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scripts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">健康</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{healthy}</div>
              <span className="h-2 w-2 rounded-full bg-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{failed}</div>
              <span className="h-2 w-2 rounded-full bg-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理告警</CardTitle>
            <Bell className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            最近活动
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentChecks.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无活动记录</p>
          ) : (
            <div className="space-y-3">
              {recentChecks.map((check) => {
                const script = getScript(check.scriptId)
                return (
                  <div
                    key={check.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {script?.name ?? check.scriptId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmt.format(check.timestamp)}
                      </span>
                    </div>
                    {statusBadge(check.status)}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => alert('添加脚本功能即将上线')}
        >
          <Plus className="mr-2 h-4 w-4" />
          添加脚本
        </Button>
        <Button
          variant="outline"
          onClick={() => alert('查看告警功能即将上线')}
        >
          <Bell className="mr-2 h-4 w-4" />
          查看告警
        </Button>
        <Button
          variant="outline"
          onClick={() => alert('运行全部测试功能即将上线')}
        >
          <Play className="mr-2 h-4 w-4" />
          运行全部测试
        </Button>
      </div>
    </div>
  )
}
