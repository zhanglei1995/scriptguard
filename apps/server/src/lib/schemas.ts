import { z } from 'zod'

// ============ Enums ============
export const HealthStatusEnum = z.enum(['healthy', 'degraded', 'failed', 'unknown'])
export const RunAtEnum = z.enum(['document_start', 'document_idle', 'document_end', 'manual'])
export const AlertLevelEnum = z.enum(['low', 'medium', 'high', 'critical'])
export const PlanEnum = z.enum(['free', 'pro', 'team', 'enterprise'])

// ============ Common ============
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

// ============ Scripts ============
export const ScriptSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  teamId: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  version: z.string(),
  code: z.string(),
  matchRules: z.array(z.string()),
  runAt: RunAtEnum,
  enabled: z.boolean(),
  config: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ScriptListSchema = z.object({
  items: z.array(ScriptSchema),
  total: z.number().int(),
})

export const CreateScriptSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  code: z.string().min(1),
  matchRules: z.array(z.string()).optional(),
  runAt: RunAtEnum.optional(),
  teamId: z.string().uuid().optional(),
  config: z.record(z.unknown()).optional(),
})

export const UpdateScriptSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  code: z.string().min(1).optional(),
  matchRules: z.array(z.string()).optional(),
  runAt: RunAtEnum.optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
})

export const ScriptListQuerySchema = PaginationQuerySchema.extend({
  teamId: z.string().uuid().optional(),
})

// ============ Script Versions ============
export const ScriptVersionSchema = z.object({
  id: z.string().uuid(),
  scriptId: z.string().uuid(),
  version: z.string(),
  code: z.string(),
  changelog: z.string().nullable(),
  isStable: z.boolean(),
  createdAt: z.string(),
})

export const ScriptVersionListSchema = z.object({
  items: z.array(ScriptVersionSchema),
  total: z.number().int(),
})

export const CreateScriptVersionSchema = z.object({
  version: z.string().min(1),
  code: z.string().min(1),
  changelog: z.string().max(1000).optional(),
  isStable: z.boolean().optional(),
})

// ============ Check Rules ============
export const CheckRuleSchema = z.object({
  id: z.string().uuid(),
  scriptId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  config: z.record(z.unknown()),
  required: z.boolean(),
  timeout: z.number().int(),
  alertLevel: AlertLevelEnum,
  order: z.number().int(),
})

export const CheckRuleListSchema = z.object({
  items: z.array(CheckRuleSchema),
  total: z.number().int(),
})

export const CreateCheckRuleSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().min(1),
  config: z.record(z.unknown()).optional(),
  required: z.boolean().optional(),
  timeout: z.number().int().min(100).max(30000).optional(),
  alertLevel: AlertLevelEnum.optional(),
  order: z.number().int().optional(),
})

export const UpdateCheckRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.string().min(1).optional(),
  config: z.record(z.unknown()).optional(),
  required: z.boolean().optional(),
  timeout: z.number().int().min(100).max(30000).optional(),
  alertLevel: AlertLevelEnum.optional(),
  order: z.number().int().optional(),
})

// ============ Test Schedules ============
export const TestScheduleSchema = z.object({
  id: z.string().uuid(),
  scriptId: z.string().uuid(),
  cron: z.string(),
  mode: z.string(),
  config: z.object({
    cookies: z.string().optional(),
    timeout: z.number().int().optional(),
  }),
  enabled: z.boolean(),
  createdAt: z.string(),
})

export const TestScheduleListSchema = z.object({
  items: z.array(TestScheduleSchema),
  total: z.number().int(),
})

export const CreateTestScheduleSchema = z.object({
  scriptId: z.string().uuid(),
  cron: z.string().min(1),
  mode: z.string().min(1),
  config: z
    .object({
      cookies: z.string().optional(),
      timeout: z.number().int().optional(),
    })
    .optional(),
  enabled: z.boolean().optional(),
})

export const UpdateTestScheduleSchema = z.object({
  cron: z.string().min(1).optional(),
  mode: z.string().min(1).optional(),
  config: z
    .object({
      cookies: z.string().optional(),
      timeout: z.number().int().optional(),
    })
    .optional(),
  enabled: z.boolean().optional(),
})

// ============ Test Runs ============
export const TestRunSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid().nullable(),
  scriptId: z.string().uuid(),
  status: HealthStatusEnum,
  url: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  durationMs: z.number().int().nullable(),
  result: z.record(z.unknown()),
  screenshotUrl: z.string().nullable(),
  domSnapshotUrl: z.string().nullable(),
  createdAt: z.string(),
})

export const TestRunListSchema = z.object({
  items: z.array(TestRunSchema),
  total: z.number().int(),
})

// ============ Alerts ============
export const AlertSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  scriptId: z.string().uuid(),
  runId: z.string().uuid().nullable(),
  level: AlertLevelEnum,
  message: z.string(),
  payload: z.record(z.unknown()),
  acknowledged: z.boolean(),
  acknowledgedAt: z.string().nullable(),
  createdAt: z.string(),
})

export const AlertListSchema = z.object({
  items: z.array(AlertSchema),
  total: z.number().int(),
})

// ============ Notify Channels ============
export const NotifyChannelSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  config: z.record(z.unknown()),
  enabled: z.boolean(),
  createdAt: z.string(),
})

export const NotifyChannelListSchema = z.object({
  items: z.array(NotifyChannelSchema),
  total: z.number().int(),
})

export const CreateNotifyChannelSchema = z.object({
  type: z.string().min(1),
  config: z.record(z.unknown()),
  enabled: z.boolean().optional(),
})

export const TestNotifyChannelSchema = z.object({
  message: z.string().optional(),
})
