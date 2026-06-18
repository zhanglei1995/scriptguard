import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const planEnum = pgEnum('plan', ['free', 'pro', 'team', 'enterprise'])
export const healthStatusEnum = pgEnum('health_status', [
  'healthy',
  'degraded',
  'failed',
  'unknown',
])
export const runAtEnum = pgEnum('run_at', [
  'document_start',
  'document_idle',
  'document_end',
  'manual',
])
export const alertLevelEnum = pgEnum('alert_level', [
  'low',
  'medium',
  'high',
  'critical',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  plan: planEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: planEnum('plan').notNull().default('team'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    teamId: uuid('team_id')
      .references(() => teams.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').notNull().default('member'),
  },
  (t) => [
    uniqueIndex('idx_team_members_user_team').on(t.userId, t.teamId),
  ],
)

export const scripts = pgTable(
  'scripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    teamId: uuid('team_id').references(() => teams.id, {
      onDelete: 'cascade',
    }),
    name: text('name').notNull(),
    description: text('description'),
    version: text('version').notNull().default('1.0.0'),
    code: text('code').notNull(),
    matchRules: jsonb('match_rules').$type<string[]>().notNull().default([]),
    runAt: runAtEnum('run_at').notNull().default('document_idle'),
    enabled: boolean('enabled').notNull().default(true),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_scripts_user_enabled')
      .on(t.userId)
      .where(sql`${t.enabled} = true`),
    index('idx_scripts_team')
      .on(t.teamId)
      .where(sql`${t.teamId} IS NOT NULL`),
  ],
)

export const checkRules = pgTable(
  'check_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scriptId: uuid('script_id')
      .references(() => scripts.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    required: boolean('required').notNull().default(true),
    timeout: integer('timeout').notNull().default(3000),
    alertLevel: alertLevelEnum('alert_level').notNull().default('medium'),
    order: integer('order').notNull().default(0),
  },
  (t) => [index('idx_check_rules_script').on(t.scriptId)],
)

export const testSchedules = pgTable(
  'test_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scriptId: uuid('script_id')
      .references(() => scripts.id, { onDelete: 'cascade' })
      .notNull(),
    cron: text('cron').notNull(),
    mode: text('mode').notNull(),
    config: jsonb('config')
      .$type<{ cookies?: string; timeout?: number }>()
      .notNull()
      .default({}),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_test_schedules_script').on(t.scriptId)],
)

export const testRuns = pgTable(
  'test_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scheduleId: uuid('schedule_id').references(() => testSchedules.id, {
      onDelete: 'set null',
    }),
    scriptId: uuid('script_id')
      .references(() => scripts.id, { onDelete: 'cascade' })
      .notNull(),
    status: healthStatusEnum('status').notNull(),
    url: text('url').notNull(),
    startedAt: timestamp('started_at').notNull(),
    endedAt: timestamp('ended_at'),
    durationMs: integer('duration_ms'),
    result: jsonb('result').$type<Record<string, unknown>>().notNull(),
    screenshotUrl: text('screenshot_url'),
    domSnapshotUrl: text('dom_snapshot_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_test_runs_script_created').on(t.scriptId, t.createdAt),
    index('idx_test_runs_status')
      .on(t.status)
      .where(sql`${t.status} IN ('failed', 'degraded')`),
  ],
)

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    scriptId: uuid('script_id')
      .references(() => scripts.id, { onDelete: 'cascade' })
      .notNull(),
    runId: uuid('run_id').references(() => testRuns.id, {
      onDelete: 'set null',
    }),
    level: alertLevelEnum('level').notNull(),
    message: text('message').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    acknowledged: boolean('acknowledged').notNull().default(false),
    acknowledgedAt: timestamp('acknowledged_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_alerts_user_unack')
      .on(t.userId, t.createdAt)
      .where(sql`${t.acknowledged} = false`),
  ],
)

export const notifyChannels = pgTable(
  'notify_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().notNull(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_notify_channels_user').on(t.userId)],
)

export const scriptVersions = pgTable(
  'script_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scriptId: uuid('script_id')
      .references(() => scripts.id, { onDelete: 'cascade' })
      .notNull(),
    version: text('version').notNull(),
    code: text('code').notNull(),
    changelog: text('changelog'),
    isStable: boolean('is_stable').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_script_versions_script').on(t.scriptId)],
)
