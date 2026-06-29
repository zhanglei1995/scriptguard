/**
 * 日志工具
 * Fastify 内置 pino logger，我们只提供应用级辅助日志
 * 关联: TDD §12.1
 */
import pino from 'pino';

/**
 * 应用级 logger (用于非 Fastify 上下文, 如定时任务)
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'scriptguard-server' },
});
