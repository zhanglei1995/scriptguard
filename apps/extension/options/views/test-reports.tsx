/**
 * TestReports - 测试报告列表
 * SG-038: 测试报告 UI
 */

import { useEffect, useState, useCallback } from 'react'
import { getDB } from '../../storage/db'
import type { CheckRecord, HealthStatus } from '../../storage/schemas'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog'
import { Empty } from '../../components/ui/empty'

const PAGE_SIZE = 20

const statusConfig: Record<HealthStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'muted' }> = {
  healthy: { label: '通过', variant: 'success' },
  degraded: { label: '降级', variant: 'warning' },
  failed: { label: '失败', variant: 'destructive' },
  unknown: { label: '未知', variant: 'muted' },
}

export function TestReportsTab() {
  const [runs, setRuns] = useState<CheckRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cursor, setCursor] = useState<number>(0)
  const [hasMore, setHasMore] = useState(true)
  const [selectedRun, setSelectedRun] = useState<CheckRecord | null>(null)

  const loadRuns = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const db = getDB()
      const offset = reset ? 0 : cursor
      let query = db.checks.orderBy('timestamp').reverse()

      if (statusFilter !== 'all') {
        query = db.checks.where('status').equals(statusFilter).reverse() as typeof query
      }

      const results = await query.offset(offset).limit(PAGE_SIZE).toArray()
      if (reset) {
        setRuns(results)
        setCursor(PAGE_SIZE)
      } else {
        setRuns((prev) => [...prev, ...results])
        setCursor((prev) => prev + PAGE_SIZE)
      }
      setHasMore(results.length === PAGE_SIZE)
    } catch (err) {
      console.error('[SG TestReports] Failed to load runs:', err)
    } finally {
      setLoading(false)
    }
  }, [cursor, statusFilter])

  useEffect(() => {
    loadRuns(true)
  }, [statusFilter])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="所有状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="healthy">通过</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
            <SelectItem value="degraded">降级</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={() => loadRuns(true)}>
          刷新
        </Button>
      </div>

      {loading && runs.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">加载中...</div>
      ) : runs.length === 0 ? (
        <Empty
          title="暂无测试报告"
          description="运行脚本检查后，测试报告将显示在这里"
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">状态</TableHead>
                <TableHead className="w-[140px]">脚本ID</TableHead>
                <TableHead className="w-[140px]">时间</TableHead>
                <TableHead className="w-[80px]">耗时</TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRun(run)}
                >
                  <TableCell>
                    <Badge variant={statusConfig[run.status]?.variant ?? 'secondary'}>
                      {statusConfig[run.status]?.label ?? run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[140px]">
                    {run.scriptId}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(run.timestamp)}</TableCell>
                  <TableCell className="text-xs">{formatDuration(run.duration)}</TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[250px]">
                    {run.url}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => loadRuns(false)}>
                加载更多
              </Button>
            </div>
          )}
        </>
      )}

      <RunDetailDialog run={selectedRun} onClose={() => setSelectedRun(null)} />
    </div>
  )
}

function RunDetailDialog({
  run,
  onClose,
}: {
  run: CheckRecord | null
  onClose: () => void
}) {
  if (!run) return null

  return (
    <Dialog open={!!run} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>测试报告详情</DialogTitle>
          <DialogDescription>
            {new Intl.DateTimeFormat('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(run.timestamp)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground">状态</span>
              <div className="mt-1">
                <Badge variant={statusConfig[run.status]?.variant ?? 'secondary'}>
                  {statusConfig[run.status]?.label ?? run.status}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">耗时</span>
              <div className="mt-1 font-mono">{run.duration}ms</div>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">脚本ID</span>
              <div className="mt-1 font-mono text-xs break-all">{run.scriptId}</div>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">URL</span>
              <div className="mt-1 font-mono text-xs break-all">{run.url}</div>
            </div>
          </div>

          {run.failedRules.length > 0 && (
            <div>
              <span className="text-muted-foreground">失败规则</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {run.failedRules.map((rule, i) => (
                  <Badge key={i} variant="destructive">
                    {rule}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {run.errorMessage && (
            <div>
              <span className="text-muted-foreground">错误信息</span>
              <pre className="mt-1 text-xs text-destructive whitespace-pre-wrap font-mono bg-muted rounded p-3">
                {run.errorMessage}
              </pre>
            </div>
          )}

          {!run.errorMessage && run.failedRules.length === 0 && (
            <div className="text-muted-foreground text-center py-4">无错误信息</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
