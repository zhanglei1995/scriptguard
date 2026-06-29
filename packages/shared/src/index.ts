import { z } from 'zod';

// ===== Common enums =====
export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'failed', 'unknown']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const AlertLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type AlertLevel = z.infer<typeof AlertLevelSchema>;

export const RunAtSchema = z.enum(['document_start', 'document_idle', 'document_end', 'manual']);
export type RunAt = z.infer<typeof RunAtSchema>;

export const PlanSchema = z.enum(['free', 'pro', 'team', 'enterprise']);
export type Plan = z.infer<typeof PlanSchema>;

// ===== Script model =====
export const MatchRuleSchema = z.string().min(1);
export type MatchRule = z.infer<typeof MatchRuleSchema>;

export const ScriptSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  version: z.string().default('1.0.0'),
  alertLevel: AlertLevelSchema.default('medium'),
  description: z.string().default(''),
  code: z.string().default(''),
  matchRules: z.array(MatchRuleSchema).default([]),
  runAt: RunAtSchema.default('document_idle'),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  groupId: z.string().nullable().default(null),
  config: z.record(z.unknown()).default({}),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Script = z.infer<typeof ScriptSchema>;

// ===== Health check rules =====
export const RuleTypeSchema = z.enum([
  'selector_exists',
  'selector_visible',
  'text_content',
  'url_match',
  'js_assertion',
  'console_clean',
  'duration',
  'network_status',
]);
export type RuleType = z.infer<typeof RuleTypeSchema>;

export const CheckRuleSchema = z.object({
  id: z.string(),
  scriptId: z.string(),
  name: z.string().min(1),
  type: RuleTypeSchema,
  config: z.record(z.unknown()).default({}),
  required: z.boolean().default(true),
  enabled: z.boolean().default(true),
  timeout: z.number().int().min(100).max(60_000).default(5_000),
  alertLevel: AlertLevelSchema.default('medium'),
  order: z.number().int().default(0),
});
export type CheckRule = z.infer<typeof CheckRuleSchema>;

// Legacy local rule shape used before SG schema unification.
export const LegacyCheckRuleSchema = z.object({
  id: z.string(),
  scriptId: z.string(),
  type: z.enum(['selector', 'text', 'attribute', 'custom']),
  target: z.string(),
  expected: z.string().optional(),
  operator: z.enum(['exists', 'equals', 'contains', 'matches']).default('exists'),
  enabled: z.boolean().default(true),
});
export type LegacyCheckRule = z.infer<typeof LegacyCheckRuleSchema>;

export function normalizeCheckRule(input: CheckRule | LegacyCheckRule): CheckRule {
  const maybeModern = CheckRuleSchema.safeParse(input);
  if (maybeModern.success) return maybeModern.data;

  const legacy = LegacyCheckRuleSchema.parse(input);
  const type: RuleType =
    legacy.type === 'text'
      ? 'text_content'
      : legacy.type === 'custom'
        ? 'js_assertion'
        : 'selector_exists';

  return CheckRuleSchema.parse({
    id: legacy.id,
    scriptId: legacy.scriptId,
    name: legacy.target,
    type,
    enabled: legacy.enabled,
    required: true,
    config:
      type === 'text_content'
        ? { selector: legacy.target, expected: legacy.expected, operator: legacy.operator }
        : type === 'js_assertion'
          ? { expression: legacy.target }
          : { selector: legacy.target },
  });
}

export const CheckRuleInputSchema = z
  .union([CheckRuleSchema, LegacyCheckRuleSchema])
  .transform(normalizeCheckRule);

// ===== Queue contract =====
export const TestRunJobDataSchema = z.object({
  scheduleId: z.string().optional(),
  scriptId: z.string(),
  url: z.string(),
  cookies: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  rules: z.array(
    CheckRuleSchema.pick({ id: true, type: true, config: true, required: true }).extend({
      timeout: z.number().int().positive().optional(),
    }),
  ),
});
export type TestRunJobData = z.infer<typeof TestRunJobDataSchema>;

export const TestRunJobResultSchema = z.object({
  status: z.enum(['passed', 'failed', 'degraded', 'timeout', 'error']),
  durationMs: z.number().int().min(0),
  failedRules: z.array(z.string()),
  screenshotUrl: z.string().optional(),
  errorMessage: z.string().optional(),
});
export type TestRunJobResult = z.infer<typeof TestRunJobResultSchema>;

// ===== Extension message protocol =====
export const ScriptForExecutionSchema = ScriptSchema.pick({
  id: true,
  name: true,
  code: true,
}).extend({
  rules: z.array(CheckRuleSchema).optional(),
  timeout: z.number().int().positive().optional(),
});
export type ScriptForExecution = z.infer<typeof ScriptForExecutionSchema>;
