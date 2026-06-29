/**
 * LogsTab - 运行日志列表
 * SG-022: 本地运行日志
 */

import { useEffect, useState, useCallback } from 'react';
import { getLogStore, type LogFilters } from '../lib/log-store';
import { StatusBadge, type Status } from '../components/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Empty } from '../components/ui/empty';
import type { CheckRecord } from '../storage/schemas';

// ====== Component ======
export function LogsTab() {
  const [logs, setLogs] = useState<CheckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LogFilters>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const store = getLogStore();
      const results = await store.getChecks(filters);
      setLogs(results);
    } catch (err) {
      console.error('[SG Logs] Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExportCSV = () => {
    const store = getLogStore();
    store.exportCSV(filters);
  };

  const handleFilterChange = (key: keyof LogFilters, value: string | Date | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.scriptId || ''}
          onValueChange={(v) => handleFilterChange('scriptId', v || undefined)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有脚本" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有脚本</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || ''}
          onValueChange={(v) => handleFilterChange('status', v || undefined)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="所有状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="healthy">正常</SelectItem>
            <SelectItem value="degraded">降级</SelectItem>
            <SelectItem value="failed">失效</SelectItem>
            <SelectItem value="unknown">未检测</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[160px]"
          value={filters.startTime ? filters.startTime.toISOString().slice(0, 10) : ''}
          onChange={(e) =>
            handleFilterChange('startTime', e.target.value ? new Date(e.target.value) : undefined)
          }
        />

        <Input
          type="date"
          className="w-[160px]"
          value={filters.endTime ? filters.endTime.toISOString().slice(0, 10) : ''}
          onChange={(e) =>
            handleFilterChange('endTime', e.target.value ? new Date(e.target.value) : undefined)
          }
        />

        <Button variant="ghost" size="sm" onClick={clearFilters}>
          清除筛选
        </Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          导出 CSV
        </Button>
      </div>

      {/* Log List */}
      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">加载中...</div>
      ) : logs.length === 0 ? (
        <Empty title="暂无日志" description="运行脚本检查后，日志将显示在这里" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">时间</TableHead>
              <TableHead className="w-[140px]">脚本ID</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-[80px]">耗时</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <LogRow
                key={log.id}
                log={log}
                expanded={expandedId === log.id}
                onToggle={() => log.id && toggleExpand(log.id)}
                formatDate={formatDate}
                formatDuration={formatDuration}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ====== LogRow ======
function LogRow({
  log,
  expanded,
  onToggle,
  formatDate,
  formatDuration,
}: {
  log: CheckRecord;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (d: Date) => string;
  formatDuration: (ms: number) => string;
}) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="font-mono text-xs">{formatDate(log.timestamp)}</TableCell>
        <TableCell className="font-mono text-xs truncate max-w-[140px]">{log.scriptId}</TableCell>
        <TableCell>
          <StatusBadge status={log.status as Status} />
        </TableCell>
        <TableCell className="font-mono text-xs truncate max-w-[300px]">{log.url}</TableCell>
        <TableCell className="text-xs">{formatDuration(log.duration)}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30">
            <div className="space-y-2 text-sm">
              {log.failedRules.length > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground">失败规则：</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {log.failedRules.map((rule, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs"
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {log.errorMessage && (
                <div>
                  <span className="font-medium text-muted-foreground">错误信息：</span>
                  <pre className="mt-1 text-xs text-destructive whitespace-pre-wrap font-mono">
                    {log.errorMessage}
                  </pre>
                </div>
              )}
              {!log.errorMessage && log.failedRules.length === 0 && (
                <div className="text-muted-foreground">无详细错误信息</div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
