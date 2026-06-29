/**
 * Alerts - 告警中心
 * SG-044: 告警中心 UI
 */

import { useEffect, useState, useCallback } from 'react';
import { getDB, acknowledgeAlert, deleteAlert } from '../../storage/db';
import type { AlertRecord } from '../../storage/schemas';
import type { AlertLevel } from '../../storage/schemas';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { Empty } from '../../components/ui/empty';
import { useScriptsStore } from '../../store';

const AUTO_REFRESH_INTERVAL = 30_000;

const severityConfig: Record<AlertLevel, { label: string; className: string }> = {
  critical: {
    label: '严重',
    className: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  high: {
    label: '高',
    className:
      'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  medium: {
    label: '中',
    className:
      'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  low: {
    label: '低',
    className: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
};

export function AlertsTab() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'acknowledged'>('unacknowledged');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);

  const getScript = useScriptsStore((s) => s.getScript);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDB();
      const query = db.alerts.orderBy('timestamp').reverse();

      if (filter === 'unacknowledged') {
        const all = await query.toArray();
        setAlerts(all.filter((a) => !a.acknowledged));
        return;
      }
      if (filter === 'acknowledged') {
        const all = await query.toArray();
        setAlerts(all.filter((a) => a.acknowledged));
        return;
      }

      const all = await query.toArray();
      setAlerts(all);
    } catch (err) {
      console.error('[SG Alerts] Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const interval = setInterval(loadAlerts, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handleAcknowledge = async (id: number) => {
    await acknowledgeAlert(id);
    loadAlerts();
  };

  const handleDelete = async (id: number) => {
    await deleteAlert(id);
    loadAlerts();
  };

  const filteredAlerts =
    levelFilter === 'all' ? alerts : alerts.filter((a) => a.level === levelFilter);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="unacknowledged">未确认</SelectItem>
            <SelectItem value="acknowledged">已确认</SelectItem>
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="所有级别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有级别</SelectItem>
            <SelectItem value="critical">严重</SelectItem>
            <SelectItem value="high">高</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="low">低</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={loadAlerts}>
          刷新
        </Button>
      </div>

      {loading && filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">加载中...</div>
      ) : filteredAlerts.length === 0 ? (
        <Empty
          title="暂无告警"
          description={filter === 'unacknowledged' ? '没有未确认的告警' : '没有告警记录'}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">级别</TableHead>
              <TableHead className="w-[140px]">脚本</TableHead>
              <TableHead>消息</TableHead>
              <TableHead className="w-[120px]">时间</TableHead>
              <TableHead className="w-[100px]">状态</TableHead>
              <TableHead className="w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow
                key={alert.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedAlert(alert)}
              >
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${severityConfig[alert.level]?.className}`}
                  >
                    {severityConfig[alert.level]?.label}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs truncate max-w-[140px]">
                  {getScript(alert.scriptId)?.name ?? alert.scriptId.slice(0, 8)}
                </TableCell>
                <TableCell className="text-xs truncate max-w-[250px]">{alert.message}</TableCell>
                <TableCell className="text-xs">{formatDate(alert.timestamp)}</TableCell>
                <TableCell>
                  <Badge variant={alert.acknowledged ? 'muted' : 'warning'}>
                    {alert.acknowledged ? '已确认' : '未确认'}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    {!alert.acknowledged && alert.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id!)}
                      >
                        确认
                      </Button>
                    )}
                    {alert.id && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(alert.id!)}>
                        删除
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDetailDialog
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        getScript={getScript}
        formatDate={formatDate}
      />
    </div>
  );
}

function AlertDetailDialog({
  alert,
  onClose,
  getScript,
  formatDate,
}: {
  alert: AlertRecord | null;
  onClose: () => void;
  getScript: (id: string) => import('../../storage/schemas').Script | undefined;
  formatDate: (d: Date) => string;
}) {
  if (!alert) return null;

  const script = getScript(alert.scriptId);

  return (
    <Dialog open={!!alert} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>告警详情</DialogTitle>
          <DialogDescription>{formatDate(alert.timestamp)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground">级别</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${severityConfig[alert.level]?.className}`}
                >
                  {severityConfig[alert.level]?.label}
                </span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">状态</span>
              <div className="mt-1">
                <Badge variant={alert.acknowledged ? 'muted' : 'warning'}>
                  {alert.acknowledged ? '已确认' : '未确认'}
                </Badge>
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">脚本</span>
              <div className="mt-1 font-medium">{script?.name ?? '未知脚本'}</div>
              <div className="mt-0.5 font-mono text-xs text-muted-foreground">{alert.scriptId}</div>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground">错误信息</span>
            <div className="mt-1 p-3 rounded bg-muted text-xs whitespace-pre-wrap font-mono">
              {alert.message}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
