/**
 * API v1 业务路由
 * 关联: SG-028, SG-029
 */
import type { FastifyPluginAsync } from 'fastify';
import { authRoutes } from './auth.js';
import { scriptsRoutes } from './scripts.js';
import { rulesRoutes } from './rules.js';
import { schedulesRoutes } from './schedules.js';
import { runsRoutes } from './runs.js';
import { alertsRoutes } from './alerts.js';
import { channelsRoutes } from './channels.js';
import { syncRoutes } from './sync.js';
import { webhooksRoutes } from './webhooks.js';

export const apiV1Routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authRoutes);
  await fastify.register(scriptsRoutes);
  await fastify.register(rulesRoutes);
  await fastify.register(schedulesRoutes);
  await fastify.register(runsRoutes);
  await fastify.register(alertsRoutes);
  await fastify.register(channelsRoutes);
  await fastify.register(syncRoutes);
  await fastify.register(webhooksRoutes);
};
