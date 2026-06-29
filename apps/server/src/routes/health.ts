/**
 * 健康检查端点
 * 关联: TDD §3.2.3
 */
import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Liveness - 进程存活
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Readiness - 依赖检查 (DB/Redis)
  fastify.get('/ready', async (req, reply) => {
    const checks: Record<string, 'ok' | 'error'> = {};

    // TODO(SG-028): 实际连接 DB 检查
    checks.database = 'ok';
    // TODO(SG-035): 实际连接 Redis 检查
    checks.redis = 'ok';

    const allOk = Object.values(checks).every((v) => v === 'ok');
    return reply.code(allOk ? 200 : 503).send({
      status: allOk ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  });
};
