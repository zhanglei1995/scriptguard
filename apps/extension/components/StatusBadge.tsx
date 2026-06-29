import type { FC } from 'react';

export type Status = 'healthy' | 'degraded' | 'failed' | 'unknown';

const config: Record<Status, { label: string; icon: string; className: string }> = {
  healthy: { label: '正常', icon: '✅', className: 'badge badge-success' },
  degraded: { label: '降级', icon: '⚠️', className: 'badge badge-warning' },
  failed: { label: '失效', icon: '❌', className: 'badge badge-destructive' },
  unknown: { label: '未检测', icon: '🔘', className: 'badge badge-muted' },
};

export const StatusBadge: FC<{ status: Status; showLabel?: boolean }> = ({
  status,
  showLabel = true,
}) => {
  const c = config[status];
  return (
    <span className={c.className}>
      <span className="mr-1">{c.icon}</span>
      {showLabel && c.label}
    </span>
  );
};
