/**
 * API v1 业务路由
 * 关联: SG-028, SG-029
 */
import type { FastifyPluginAsync } from 'fastify'
import { authRoutes } from './v1/auth.js'
import { scriptsRoutes } from './v1/scripts.js'
import { rulesRoutes } from './v1/rules.js'
import { schedulesRoutes } from './v1/schedules.js'
import { runsRoutes } from './v1/runs.js'
import { alertsRoutes } from './v1/alerts.js'
import { channelsRoutes } from './v1/channels.js'
import { syncRoutes } from './v1/sync.js'

export const apiV1Routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authRoutes)
  await fastify.register(scriptsRoutes)
  await fastify.register(rulesRoutes)
  await fastify.register(schedulesRoutes)
  await fastify.register(runsRoutes)
  await fastify.register(alertsRoutes)
  await fastify.register(channelsRoutes)
  await fastify.register(syncRoutes)
}
