/**
 * LogStore - 本地运行日志存储
 * SG-022: 本地运行日志
 */

import { getDB, addCheck as dbAddCheck, cleanupOldRecords } from '../storage/db';
import type { CheckRecord, HealthStatus } from '../storage/schemas';

// ====== Types ======
export interface LogFilters {
  scriptId?: string;
  status?: HealthStatus;
  startTime?: Date;
  endTime?: Date;
}

// ====== LogStore ======
export class LogStore {
  /**
   * 写入检查记录
   */
  async addCheck(record: Omit<CheckRecord, 'id'>): Promise<number> {
    return dbAddCheck(record);
  }

  /**
   * 按条件查询检查记录
   */
  async getChecks(filters?: LogFilters): Promise<CheckRecord[]> {
    const db = getDB();
    let collection = db.checks.toCollection();

    if (filters) {
      if (filters.scriptId) {
        collection = db.checks.where('scriptId').equals(filters.scriptId);
      } else if (filters.status) {
        collection = db.checks.where('status').equals(filters.status);
      }
    }

    let results = await collection.toArray();

    // Apply additional filters in memory
    if (filters) {
      if (filters.status && filters.scriptId) {
        results = results.filter((r) => r.status === filters.status);
      }
      if (filters.startTime) {
        results = results.filter((r) => r.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        results = results.filter((r) => r.timestamp <= filters.endTime!);
      }
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return results;
  }

  /**
   * 获取单条记录
   */
  async getCheckById(id: number): Promise<CheckRecord | undefined> {
    const db = getDB();
    return db.checks.get(id);
  }

  /**
   * 清理 30 天前数据
   */
  async deleteOldRecords(): Promise<{ checks: number; snapshots: number; alerts: number }> {
    return cleanupOldRecords();
  }

  /**
   * 导出 CSV
   */
  exportCSV(filters?: LogFilters): void {
    const db = getDB();
    db.checks.toArray().then((records) => {
      let filtered = records;

      if (filters) {
        if (filters.scriptId) {
          filtered = filtered.filter((r) => r.scriptId === filters.scriptId);
        }
        if (filters.status) {
          filtered = filtered.filter((r) => r.status === filters.status);
        }
        if (filters.startTime) {
          filtered = filtered.filter((r) => r.timestamp >= filters.startTime!);
        }
        if (filters.endTime) {
          filtered = filtered.filter((r) => r.timestamp <= filters.endTime!);
        }
      }

      // Sort by timestamp descending
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Build CSV
      const headers = ['ID', '脚本ID', '时间', '状态', 'URL', '耗时(ms)', '失败规则', '错误信息'];
      const rows = filtered.map((r) => [
        r.id?.toString() ?? '',
        r.scriptId,
        r.timestamp.toISOString(),
        r.status,
        r.url,
        r.duration.toString(),
        r.failedRules.join('; '),
        r.errorMessage ?? '',
      ]);

      const csvContent = [
        '\uFEFF' + headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scriptguard-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}

// ====== Singleton ======
let instance: LogStore | null = null;

export function getLogStore(): LogStore {
  if (!instance) {
    instance = new LogStore();
  }
  return instance;
}
