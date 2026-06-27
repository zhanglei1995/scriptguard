/**
 * ScriptGuard Server - Fastify 主入口
 * 关联: TDD §3.1.2 / SG-028
 */
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { config } from './config.js'
import { rootRoutes } from './routes/root.js'
import { apiV1Routes } from './routes/v1/index.js'
import errorHandlerPlugin from './plugins/error-handler.js'
import authPlugin from './plugins/auth.js'
import bullBoardPlugin from './plugins/bull-board.js'
import metricsPlugin from './plugins/metrics.js'
import { initQueue, closeQueue } from './lib/queue.js'
import { startTestRunHandler, stopTestRunHandler } from './workers/test-run-handler.js'

function isZodSchema(val: unknown): val is z.ZodType {
  return val !== null && typeof val === 'object' && '_def' in (val as Record<string, unknown>)
}

function swaggerTransform(args: { schema: import('fastify').FastifySchema; url: string; route: import('fastify').RouteOptions }) {
  const { schema, url } = args
  if (!schema || typeof schema !== 'object') return { schema, url }
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (key === 'response' && typeof value === 'object' && value !== null) {
      const respObj = value as Record<string, unknown>
      const converted: Record<string, unknown> = {}
      for (const [status, s] of Object.entries(respObj)) {
        converted[status] = isZodSchema(s)
          ? zodToJsonSchema(s, { target: 'openApi3', $refStrategy: 'none' })
          : s
      }
      out.response = converted
    } else if (['body', 'params', 'querystring', 'query'].includes(key)) {
      out[key] = isZodSchema(value)
        ? zodToJsonSchema(value, { target: 'openApi3', $refStrategy: 'none' })
        : value
    } else {
      out[key] = value
    }
  }
  return { schema: out as import('fastify').FastifySchema, url }
}

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
          : undefined,
    },
    disableRequestLogging: false,
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024,
  })

  // 0. Disable Ajv validation — Zod validates in handlers
  fastify.setValidatorCompiler(({ schema }) => {
    return (data) => {
      try {
        if (isZodSchema(schema)) {
          return { value: schema.parse(data) }
        }
        return { value: data }
      } catch (err) {
        return { error: err as Error }
      }
    }
  })

  // 1. 错误处理
  await fastify.register(errorHandlerPlugin)

  // 1.5. 认证
  await fastify.register(authPlugin)

  // 2. 安全
  await fastify.register(helmet, { contentSecurityPolicy: false })

  // 3. CORS
  await fastify.register(cors, {
    origin: config.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // 4. OpenAPI / Swagger
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'ScriptGuard API',
        description: '用户脚本健康监控与管理平台 - Cloud API',
        version: '0.1.0',
        contact: { name: 'ScriptGuard Team' },
      },
      servers: [{ url: `http://localhost:${config.PORT}`, description: '本地开发' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: swaggerTransform,
  })

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  })

  // 5. 根路由（含 /、/health、/ready）
  await fastify.register(rootRoutes)

  // 6. 业务路由（v1 命名空间）
  await fastify.register(apiV1Routes, { prefix: '/api/v1' })

  // 7. Bull Board UI (开发环境)
  await fastify.register(bullBoardPlugin)

  // 8. Prometheus Metrics
  await fastify.register(metricsPlugin)

  // 9. Initialize queue
  await initQueue()

  // 10. Start test run handler
  startTestRunHandler()

  // 11. Graceful shutdown
  fastify.addHook('onClose', async () => {
    await stopTestRunHandler()
  })

  return fastify
}

async function start() {
  try {
    const fastify = await buildServer()
    await fastify.listen({ port: config.PORT, host: config.HOST })
    fastify.log.info(
      { port: config.PORT, host: config.HOST, env: config.NODE_ENV },
      '🚀 ScriptGuard server started',
    )
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

const signals = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
  process.on(signal, () => {
    console.log(`\n${signal} received, shutting down...`)
    process.exit(0)
  })
})

start()
