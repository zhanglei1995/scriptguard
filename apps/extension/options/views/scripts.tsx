import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Empty } from '../../components/ui/empty'
import { useScriptsStore } from '../../store'
import { getChecksByScript } from '../../storage/db'
import type { CheckRecord } from '../../storage/schemas'
import { Search, Pencil, Play, Trash2, ArrowLeft, Plus, CheckSquare, Square } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

type HealthFilter = 'all' | 'healthy' | 'degraded' | 'failed'

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'default' }> = {
  healthy: { label: '正常', variant: 'success' },
  degraded: { label: '降级', variant: 'warning' },
  failed: { label: '失败', variant: 'destructive' },
  unknown: { label: '未知', variant: 'default' },
}

function getStatus(enabled: boolean): 'healthy' | 'failed' {
  return enabled ? 'healthy' : 'failed'
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts))
}

function formatCheckDate(d: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

export function ScriptsTab() {
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const getFilteredScripts = useScriptsStore((s) => s.getFilteredScripts)
  const deleteScript = useScriptsStore((s) => s.deleteScript)
  const enableScript = useScriptsStore((s) => s.enableScript)
  const disableScript = useScriptsStore((s) => s.disableScript)
  const storeScripts = useScriptsStore((s) => s.scripts) // eslint-disable-line @typescript-eslint/no-unused-vars

  const filteredScripts = (() => {
    let result = getFilteredScripts()
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((s) => s.name.toLowerCase().includes(q))
    }
    if (healthFilter !== 'all') {
      result = result.filter((s) => getStatus(s.enabled) === healthFilter)
    }
    return result
  })()

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredScripts.length && filteredScripts.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredScripts.map((s) => s.id)))
    }
  }, [filteredScripts, selectedIds.size])

  const handleBulkEnable = useCallback(() => {
    selectedIds.forEach((id) => enableScript(id))
    setSelectedIds(new Set())
  }, [selectedIds, enableScript])

  const handleBulkDisable = useCallback(() => {
    selectedIds.forEach((id) => disableScript(id))
    setSelectedIds(new Set())
  }, [selectedIds, disableScript])

  const handleBulkDelete = useCallback(() => {
    selectedIds.forEach((id) => deleteScript(id))
    setSelectedIds(new Set())
  }, [selectedIds, deleteScript])

  const handleDelete = useCallback(
    (id: string) => {
      deleteScript(id)
      if (selectedScriptId === id) setSelectedScriptId(null)
    },
    [deleteScript, selectedScriptId]
  )

  const handleTest = useCallback((_id: string) => {
  }, [])

  if (selectedScriptId) {
    return (
      <ScriptDetail
        scriptId={selectedScriptId}
        onBack={() => setSelectedScriptId(null)}
        onEdit={(_id) => {}}
        onTest={handleTest}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索脚本..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={healthFilter} onValueChange={(v) => setHealthFilter(v as HealthFilter)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="healthy">正常</SelectItem>
            <SelectItem value="degraded">降级</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">已选 {selectedIds.size} 项</span>
            <Button variant="outline" size="sm" onClick={handleBulkEnable}>启用</Button>
            <Button variant="outline" size="sm" onClick={handleBulkDisable}>禁用</Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>删除</Button>
          </div>
        )}

        <Button variant="outline" size="sm">
          <Plus className="mr-1 h-4 w-4" />
          新建
        </Button>
      </div>

      {filteredScripts.length === 0 ? (
        <Empty
          title="暂无脚本"
          description={searchQuery || healthFilter !== 'all' ? '没有匹配的脚本' : '点击上方按钮添加你的第一个监控脚本'}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground">
            <div className="w-8 flex justify-center">
              {selectedIds.size === filteredScripts.length && filteredScripts.length > 0 ? (
                <CheckSquare className="h-4 w-4 cursor-pointer" onClick={toggleSelectAll} />
              ) : (
                <Square className="h-4 w-4 cursor-pointer" onClick={toggleSelectAll} />
              )}
            </div>
            <div className="flex-1">名称</div>
            <div className="w-[80px]">版本</div>
            <div className="w-[120px]">最近检查</div>
            <div className="w-[80px]">状态</div>
            <div className="w-[100px] text-right">操作</div>
          </div>

          {filteredScripts.map((script) => {
            const st = getStatus(script.enabled)
            const cfg = statusMap[st] ?? { label: st, variant: 'default' as const }
            return (
              <Card
                key={script.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedScriptId(script.id)}
              >
                <CardContent className="flex items-center gap-3 py-3 px-3">
                  <div className="w-8 flex justify-center" onClick={(e) => e.stopPropagation()}>
                    {selectedIds.has(script.id) ? (
                      <CheckSquare className="h-4 w-4 cursor-pointer" onClick={() => toggleSelect(script.id)} />
                    ) : (
                      <Square className="h-4 w-4 cursor-pointer" onClick={() => toggleSelect(script.id)} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{script.name}</div>
                  </div>

                  <div className="w-[80px] text-xs text-muted-foreground">{script.version}</div>

                  <div className="w-[120px] text-xs text-muted-foreground">{formatDate(script.updatedAt)}</div>

                  <div className="w-[80px]">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>

                  <div className="w-[100px] flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedScriptId(script.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTest(script.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(script.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ScriptDetail({
  scriptId,
  onBack,
  onEdit,
  onTest,
  onDelete,
}: {
  scriptId: string
  onBack: () => void
  onEdit: (id: string) => void
  onTest: (id: string) => void
  onDelete: (id: string) => void
}) {
  const getScript = useScriptsStore((s) => s.getScript)
  const script = getScript(scriptId)

  const [checks, setChecks] = useState<CheckRecord[]>([])

  useEffect(() => {
    if (!scriptId) return
    getChecksByScript(scriptId).then(setChecks)
  }, [scriptId])

  const healthData = useMemo(() => {
    const bars: ('green' | 'yellow' | 'red' | 'gray')[] = []
    const now = Date.now()
    for (let i = 29; i >= 0; i--) {
      const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000
      const dayEnd = now - i * 24 * 60 * 60 * 1000
      const dayChecks = checks.filter(
        (c) => c.timestamp.getTime() >= dayStart && c.timestamp.getTime() < dayEnd
      )
      if (dayChecks.length === 0) {
        bars.push('gray')
      } else if (dayChecks.every((c) => c.status === 'healthy')) {
        bars.push('green')
      } else if (dayChecks.some((c) => c.status === 'failed')) {
        bars.push('red')
      } else {
        bars.push('yellow')
      }
    }
    return bars
  }, [checks])

  if (!script) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回列表
        </Button>
        <Empty title="脚本不存在" description="找不到该脚本信息" />
      </div>
    )
  }

  const st = getStatus(script.enabled)
  const cfg = statusMap[st] ?? { label: st, variant: 'default' as const }

  const barColors: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-muted',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Button>
        <h2 className="text-lg font-semibold flex-1">{script.name}</h2>
        <Button variant="outline" size="sm" onClick={() => onEdit(script.id)}>
          <Pencil className="mr-1 h-4 w-4" />
          编辑
        </Button>
        <Button variant="outline" size="sm" onClick={() => onTest(script.id)}>
          <Play className="mr-1 h-4 w-4" />
          立即测试
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(script.id)}>
          <Trash2 className="mr-1 h-4 w-4" />
          删除
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground">名称</span>
              <div className="mt-1 font-medium">{script.name}</div>
            </div>
            <div>
              <span className="text-muted-foreground">版本</span>
              <div className="mt-1 font-mono">{script.version}</div>
            </div>
            <div>
              <span className="text-muted-foreground">状态</span>
              <div className="mt-1">
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">运行时机</span>
              <div className="mt-1 font-mono">{script.runAt}</div>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">URL 匹配规则</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {script.matchRules.length === 0 ? (
                  <span className="text-muted-foreground text-xs">无</span>
                ) : (
                  script.matchRules.map((rule) => (
                    <Badge key={rule} variant="secondary" className="font-mono text-xs">
                      {rule}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">30 天健康趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-12">
            {healthData.map((color, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${barColors[color]} min-w-[4px]`}
                style={{ height: color === 'gray' ? '4px' : '100%' }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>30天前</span>
            <span>今天</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">规则摘要</CardTitle>
        </CardHeader>
        <CardContent>
          {script.matchRules.length === 0 ? (
            <p className="text-xs text-muted-foreground">无匹配规则</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {script.matchRules.map((rule) => (
                <li key={rule} className="font-mono text-xs p-2 rounded bg-muted">
                  {rule}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">最近测试记录</CardTitle>
        </CardHeader>
        <CardContent>
          {checks.length === 0 ? (
            <p className="text-xs text-muted-foreground">暂无测试记录</p>
          ) : (
            <div className="space-y-2">
              {checks.slice(0, 20).map((check) => (
                <div key={check.id} className="flex items-center gap-3 text-xs py-2 border-b last:border-b-0">
                  <Badge variant={check.status === 'healthy' ? 'success' : check.status === 'failed' ? 'destructive' : 'warning'}>
                    {check.status}
                  </Badge>
                  <span className="text-muted-foreground truncate max-w-[200px]">{check.url}</span>
                  <span className="text-muted-foreground ml-auto">{check.duration}ms</span>
                  <span className="text-muted-foreground">{formatCheckDate(check.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
