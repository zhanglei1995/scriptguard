import { z } from 'zod'

// ====== Health Status ======
export const HealthStatus = z.enum(['healthy', 'degraded', 'failed', 'unknown'])
export type HealthStatus = z.infer<typeof HealthStatus>

// ====== Alert Level ======
export const AlertLevel = z.enum(['low', 'medium', 'high', 'critical'])
export type AlertLevel = z.infer<typeof AlertLevel>

// ====== Script Schema (with versioning) ======
export const ScriptV1 = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
})
export type ScriptV1 = z.infer<typeof ScriptV1>

export const ScriptV2 = ScriptV1.extend({
  alertLevel: AlertLevel,
})
export type ScriptV2 = z.infer<typeof ScriptV2>

export const RunAt = z.enum(['document_idle', 'document_start', 'document_end', 'manual'])
export type RunAt = z.infer<typeof RunAt>

export const ScriptCurrent = ScriptV2.extend({
  description: z.string().default(''),
  code: z.string().default(''),
  matchRules: z.array(z.string()).default([]),
  runAt: RunAt.default('document_idle'),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  groupId: z.string().nullable().default(null),
  config: z.record(z.unknown()).default({}),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type Script = z.infer<typeof ScriptCurrent>

// ====== CheckRule ======
export const CheckRule = z.object({
  id: z.string(),
  scriptId: z.string(),
  type: z.enum(['selector', 'text', 'attribute', 'custom']),
  target: z.string(),
  expected: z.string().optional(),
  operator: z.enum(['exists', 'equals', 'contains', 'matches']).default('exists'),
  enabled: z.boolean().default(true),
})
export type CheckRule = z.infer<typeof CheckRule>

// ====== LocalSchedule ======
export const LocalSchedule = z.object({
  id: z.string(),
  scriptId: z.string(),
  intervalMinutes: z.number().min(1),
  enabled: z.boolean().default(true),
  lastRunAt: z.number().optional(),
})
export type LocalSchedule = z.infer<typeof LocalSchedule>

// ====== NotifyChannel ======
export const NotifyChannel = z.object({
  id: z.string(),
  type: z.enum(['browser', 'email', 'webhook']),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.string()).default({}),
})
export type NotifyChannel = z.infer<typeof NotifyChannel>

// ====== UserPreferences ======
export const UserPreferences = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().default('zh-CN'),
  notificationsEnabled: z.boolean().default(true),
  autoCheck: z.boolean().default(true),
  defaultIntervalMinutes: z.number().min(1).default(30),
})
export type UserPreferences = z.infer<typeof UserPreferences>

// ====== SyncMeta ======
export const SyncMeta = z.object({
  lastSyncAt: z.number().optional(),
  lastSyncVersion: z.string().optional(),
  cloudId: z.string().optional(),
})
export type SyncMeta = z.infer<typeof SyncMeta>

// ====== IndexedDB Schemas ======
export const CheckRecord = z.object({
  id: z.number().optional(),
  scriptId: z.string(),
  timestamp: z.date(),
  status: HealthStatus,
  url: z.string(),
  duration: z.number(),
  failedRules: z.array(z.string()),
  errorMessage: z.string().optional(),
  domSnapshot: z.string().optional(),
  screenshot: z.instanceof(Blob).optional(),
})
export type CheckRecord = z.infer<typeof CheckRecord>

export const DomSnapshot = z.object({
  id: z.number().optional(),
  scriptId: z.string(),
  url: z.string(),
  html: z.string(),
  timestamp: z.date(),
  reason: z.enum(['failure', 'manual']),
})
export type DomSnapshot = z.infer<typeof DomSnapshot>

export const AlertRecord = z.object({
  id: z.number().optional(),
  scriptId: z.string(),
  timestamp: z.date(),
  acknowledged: z.boolean().default(false),
  level: AlertLevel,
  message: z.string(),
})
export type AlertRecord = z.infer<typeof AlertRecord>

// ====== Schema Versioning ======
export const scriptMigrations: Record<number, (data: unknown) => unknown> = {
  1: (data: unknown) => ScriptV1.parse(data),
  2: (data: unknown) => {
    const v1 = ScriptV1.parse(data)
    return ScriptV2.parse({ ...v1, alertLevel: 'medium' })
  },
  3: (data: unknown) => {
    const v2 = ScriptV2.parse(data)
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
    })
  },
}

export function migrateScript(data: unknown, fromVersion: number): Script {
  let result = data
  for (let v = fromVersion + 1; v <= 3; v++) {
    const migration = scriptMigrations[v]
    if (migration) {
      result = migration(result)
    }
  }
  return ScriptCurrent.parse(result)
}
