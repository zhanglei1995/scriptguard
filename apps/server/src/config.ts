/**
 * 环境变量配置 - Zod 校验启动时
 * 关联: TDD §1.1 / §5.2
 */
import { z } from 'zod'

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('*'),

  // Database
  DATABASE_URL: z.string().url().default('postgresql://localhost:5432/scriptguard'),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Auth
  JWT_SECRET: z.string().min(16).default('dev-secret-change-in-production-please'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Webhook
  WEBHOOK_SECRET: z.string().min(16).default('dev-webhook-secret-change-in-prod'),

  // Public (exposed to extension via /api/config)
  PLASMO_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
})

export type Config = z.infer<typeof ConfigSchema>

function loadConfig(): Config {
  const parsed = ConfigSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  return parsed.data
}

export const config = loadConfig()
