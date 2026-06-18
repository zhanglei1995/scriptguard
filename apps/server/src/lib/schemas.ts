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
  nextCursor: z.string().nullable(),
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

export const ScriptListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  teamId: z.string().uuid().optional(),
})

export const RollbackSchema = z.object({
  versionId: z.string().uuid(),
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

export const ReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().int(),
  })).min(1),
})

// ============ Cron Validation ============
const CRON_5_REGEX =
  /^(\*|([0-9]|[1-5][0-9])(\/[0-9]+)?|([0-9]|[1-5][0-9])(-[0-9]|[1-5][0-9])?|([0-9]|[1-5][0-9])(,[0-9]|[1-5][0-9])*)\s+(\*|([0-9]|1[0-9]|2[0-3])(\/[0-9]+)?|([0-9]|1[0-9]|2[0-3])(-([0-9]|1[0-9]|2[0-3]))?|([0-9]|1[0-9]|2[0-3])(,([0-9]|1[0-9]|2[0-3]))*)\s+(\*|([1-9]|[12][0-9]|3[01])(\/[0-9]+)?|([1-9]|[12][0-9]|3[01])(-([1-9]|[12][0-9]|3[01]))?|([1-9]|[12][0-9]|3[01])(,([1-9]|[12][0-9]|3[01]))*)\s+(\*|(0?[1-9]|1[0-2])(\/[0-9]+)?|(0?[1-9]|1[0-2])(-(0?[1-9]|1[0-2]))?|(0?[1-9]|1[0-2])(,(0?[1-9]|1[0-2]))*)\s+(\*|([0-6])(\/[0-9]+)?|([0-6])(-([0-6]))?|([0-6])(,([0-6]))*)$/

export const CronExpression = z.string().regex(
  CRON_5_REGEX,
  'Invalid cron expression: expected 5-segment format (minute hour day month weekday)',
)

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
  cron: CronExpression,
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
  cron: CronExpression.optional(),
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

export const RunListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
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

// ============ Sync ============
export const SyncScriptSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  version: z.string().optional(),
  code: z.string().optional(),
  matchRules: z.array(z.string()).optional(),
  runAt: RunAtEnum.optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string(),
})

export const SyncRuleSchema = z.object({
  id: z.string().uuid(),
  scriptId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  config: z.record(z.unknown()).optional(),
  required: z.boolean().optional(),
  timeout: z.number().int().optional(),
  alertLevel: AlertLevelEnum.optional(),
  order: z.number().int().optional(),
})

export const ConflictSchema = z.object({
  entity: z.enum(['script', 'rule']),
  id: z.string().uuid(),
  local: z.record(z.unknown()),
  server: z.record(z.unknown()),
})

export const SyncRequestSchema = z.object({
  clientVersion: z.number().int(),
  lastSyncAt: z.number(),
  changes: z.object({
    scripts: z.array(SyncScriptSchema).optional(),
    rules: z.array(SyncRuleSchema).optional(),
    deletedScriptIds: z.array(z.string().uuid()).optional(),
  }),
})

export const SyncResponseSchema = z.object({
  serverVersion: z.number().int(),
  syncedAt: z.number(),
  changes: z.object({
    scripts: z.array(ScriptSchema),
    rules: z.array(CheckRuleSchema),
    deletedScriptIds: z.array(z.string().uuid()),
  }),
  conflicts: z.array(ConflictSchema),
})

// ============ Auth ============
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.string(),
})

export const RefreshTokenSchema = z.object({
  token: z.string().min(1),
})

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  plan: PlanEnum,
  createdAt: z.string(),
})
