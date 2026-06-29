import { z } from 'zod';
import {
  AlertLevelSchema,
  CheckRuleInputSchema,
  CheckRuleSchema,
  HealthStatusSchema,
  RunAtSchema,
  ScriptSchema,
  normalizeCheckRule,
  type AlertLevel as SharedAlertLevel,
  type CheckRule as SharedCheckRule,
  type HealthStatus as SharedHealthStatus,
  type RunAt as SharedRunAt,
  type Script as SharedScript,
} from '@scriptguard/shared';

// ====== Health Status ======
export const HealthStatus = HealthStatusSchema;
export type HealthStatus = SharedHealthStatus;

// ====== Alert Level ======
export const AlertLevel = AlertLevelSchema;
export type AlertLevel = SharedAlertLevel;

// ====== Script Schema (with versioning) ======
export const ScriptV1 = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
});
export type ScriptV1 = z.infer<typeof ScriptV1>;

export const ScriptV2 = ScriptV1.extend({
  alertLevel: AlertLevelSchema,
});
export type ScriptV2 = z.infer<typeof ScriptV2>;

export const RunAt = RunAtSchema;
export type RunAt = SharedRunAt;

export const ScriptCurrent = ScriptSchema;
export type Script = SharedScript;

// ====== CheckRule ======
export const CheckRule = CheckRuleInputSchema;
export const CheckRuleCurrent = CheckRuleSchema;
export { normalizeCheckRule };
export type CheckRule = SharedCheckRule;

// ====== LocalSchedule ======
export const LocalSchedule = z.object({
  id: z.string(),
  scriptId: z.string(),
  intervalMinutes: z.number().min(1),
  enabled: z.boolean().default(true),
  lastRunAt: z.number().optional(),
});
export type LocalSchedule = z.infer<typeof LocalSchedule>;

// ====== NotifyChannel ======
export const NotifyChannel = z.object({
  id: z.string(),
  type: z.enum(['browser', 'email', 'webhook']),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.string()).default({}),
});
export type NotifyChannel = z.infer<typeof NotifyChannel>;

// ====== UserPreferences ======
export const UserPreferences = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().default('zh-CN'),
  notificationsEnabled: z.boolean().default(true),
  autoCheck: z.boolean().default(true),
  defaultIntervalMinutes: z.number().min(1).default(30),
});
export type UserPreferences = z.infer<typeof UserPreferences>;

// ====== SyncMeta ======
export const SyncMeta = z.object({
  lastSyncAt: z.number().optional(),
  lastSyncVersion: z.string().optional(),
  cloudId: z.string().optional(),
});
export type SyncMeta = z.infer<typeof SyncMeta>;

// ====== IndexedDB Schemas ======
export const CheckRecord = z.object({
  id: z.number().optional(),
  scriptId: z.string(),
  timestamp: z.date(),
  status: HealthStatusSchema,
  url: z.string(),
  duration: z.number(),
  failedRules: z.array(z.string()),
  errorMessage: z.string().optional(),
  domSnapshot: z.string().optional(),
  screenshot: z.instanceof(Blob).optional(),
});
export type CheckRecord = z.infer<typeof CheckRecord>;

export const DomSnapshot = z.object({
  id: z.number().optional(),
  scriptId: z.string(),
  url: z.string(),
  html: z.string(),
  timestamp: z.date(),
  reason: z.enum(['failure', 'manual']),
});
export type DomSnapshot = z.infer<typeof DomSnapshot>;

export const AlertRecord = z.object({
  id: z.number().optional(),
  scriptId: z.string(),
  timestamp: z.date(),
  acknowledged: z.boolean().default(false),
  level: AlertLevelSchema,
  message: z.string(),
});
export type AlertRecord = z.infer<typeof AlertRecord>;

// ====== Schema Versioning ======
export const scriptMigrations: Record<number, (data: unknown) => unknown> = {
  1: (data: unknown) => ScriptV1.parse(data),
  2: (data: unknown) => {
    const v1 = ScriptV1.parse(data);
    return ScriptV2.parse({ ...v1, alertLevel: 'medium' });
  },
  3: (data: unknown) => {
    const v2 = ScriptV2.parse(data);
    return ScriptCurrent.parse({
      ...v2,
      description: '',
      code: '',
      matchRules: [],
      runAt: 'document_idle',
      enabled: true,
      tags: [],
      groupId: null,
      config: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
};

export function migrateScript(data: unknown, fromVersion: number): SharedScript {
  let result = data;
  for (let v = fromVersion + 1; v <= 3; v++) {
    const migration = scriptMigrations[v];
    if (migration) {
      result = migration(result);
    }
  }
  return ScriptCurrent.parse(result);
}
