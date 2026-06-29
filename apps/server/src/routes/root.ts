/**
 * 根路由 - 不在 /api/v1 前缀下
 * 关联: TDD §5.2
 */
import type { FastifyPluginAsync } from 'fastify';
import { healthRoutes } from './health.js';
import { config } from '../config.js';

export const rootRoutes: FastifyPluginAsync = async (fastify) => {
  // API 根信息
  fastify.get('/', async () => ({
    name: 'ScriptGuard Server',
    version: '0.1.0',
    api: '/api/v1',
    docs: '/docs',
    health: '/health',
    ready: '/ready',
    env: config.NODE_ENV,
  }));

  // 健康检查
  await fastify.register(healthRoutes);
};
