/**
 * ScriptGuard Server - Fastify 主入口
 * 关联: TDD §3.1.2
 */
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { config } from './config.js'
import { rootRoutes } from './routes/root.js'
import { apiV1Routes } from './routes/api.js'
import errorHandlerPlugin from './plugins/error-handler.js'

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

  // 1. 错误处理
  await fastify.register(errorHandlerPlugin)

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
  })

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  })

  // 5. 根路由（含 /、/health、/ready）
  await fastify.register(rootRoutes)

  // 6. 业务路由（v1 命名空间）
  await fastify.register(apiV1Routes, { prefix: '/api/v1' })

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
