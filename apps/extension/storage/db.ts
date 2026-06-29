import Dexie, { type Table } from 'dexie';
import { CheckRecord, DomSnapshot, AlertRecord } from './schemas';
import type { HealthStatus } from './schemas';

// ====== Database Class ======
export class ScriptGuardDB extends Dexie {
  checks!: Table<CheckRecord, number>;
  snapshots!: Table<DomSnapshot, number>;
  alerts!: Table<AlertRecord, number>;

  constructor() {
    super('ScriptGuardDB');
    this.version(1).stores({
      checks: '++id, scriptId, timestamp, status',
      snapshots: '++id, scriptId, url, timestamp',
      alerts: '++id, scriptId, timestamp, acknowledged',
    });
  }
}

// ====== Database Instance ======
let dbInstance: ScriptGuardDB | null = null;

export function getDB(): ScriptGuardDB {
  if (!dbInstance) {
    dbInstance = new ScriptGuardDB();
  }
  return dbInstance;
}

// ====== Check Records ======
export async function addCheck(record: Omit<CheckRecord, 'id'>): Promise<number> {
  const db = getDB();
  const parsed = CheckRecord.omit({ id: true }).parse(record);
  return db.checks.add(parsed as CheckRecord);
}

export async function getChecksByScript(scriptId: string): Promise<CheckRecord[]> {
  const db = getDB();
  return db.checks.where('scriptId').equals(scriptId).reverse().sortBy('timestamp');
}

export async function getChecksByStatus(status: HealthStatus): Promise<CheckRecord[]> {
  const db = getDB();
  return db.checks.where('status').equals(status).toArray();
}

export async function getRecentChecks(limit: number = 50): Promise<CheckRecord[]> {
  const db = getDB();
  return db.checks.orderBy('timestamp').reverse().limit(limit).toArray();
}

export async function deleteCheck(id: number): Promise<void> {
  const db = getDB();
  await db.checks.delete(id);
}

// ====== Snapshots ======
export async function addSnapshot(record: Omit<DomSnapshot, 'id'>): Promise<number> {
  const db = getDB();
  const parsed = DomSnapshot.omit({ id: true }).parse(record);
  return db.snapshots.add(parsed as DomSnapshot);
}

export async function getSnapshotsByScript(scriptId: string): Promise<DomSnapshot[]> {
  const db = getDB();
  return db.snapshots.where('scriptId').equals(scriptId).reverse().sortBy('timestamp');
}

export async function deleteSnapshot(id: number): Promise<void> {
  const db = getDB();
  await db.snapshots.delete(id);
}

// ====== Alerts ======
export async function addAlert(
  record: Omit<AlertRecord, 'id' | 'acknowledged'> & { acknowledged?: boolean },
): Promise<number> {
  const db = getDB();
  const parsed = AlertRecord.omit({ id: true }).parse({ acknowledged: false, ...record });
  return db.alerts.add(parsed as AlertRecord);
}

export async function getAlertsByScript(scriptId: string): Promise<AlertRecord[]> {
  const db = getDB();
  return db.alerts.where('scriptId').equals(scriptId).reverse().sortBy('timestamp');
}

export async function getUnacknowledgedAlerts(): Promise<AlertRecord[]> {
  const db = getDB();
  return db.alerts.filter((alert) => !alert.acknowledged).toArray();
}

export async function acknowledgeAlert(id: number): Promise<void> {
  const db = getDB();
  await db.alerts.update(id, { acknowledged: true });
}

export async function deleteAlert(id: number): Promise<void> {
  const db = getDB();
  await db.alerts.delete(id);
}

// ====== Cleanup ======
export async function cleanupOldRecords(): Promise<{
  checks: number;
  snapshots: number;
  alerts: number;
}> {
  const db = getDB();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const checks = await db.checks.where('timestamp').below(new Date(thirtyDaysAgo)).delete();
  const snapshots = await db.snapshots.where('timestamp').below(new Date(thirtyDaysAgo)).delete();
  const alerts = await db.alerts.where('timestamp').below(new Date(thirtyDaysAgo)).delete();

  return { checks, snapshots, alerts };
}

// ====== Reset (for testing) ======
export async function resetDB(): Promise<void> {
  const db = getDB();
  await db.checks.clear();
  await db.snapshots.clear();
  await db.alerts.clear();
}
