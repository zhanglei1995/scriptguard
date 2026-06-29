/**
 * Bull Board UI Plugin (开发环境)
 * 关联: SG-035 / TDD §12.4
 *
 * 提供队列可视化监控界面，仅在 development 环境启用。
 * 路由: /admin/queues
 */
import type { FastifyInstance } from 'fastify';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { config } from '../config.js';
import { getTestRunQueue } from '../lib/queue.js';

export default async function bullBoardPlugin(fastify: FastifyInstance) {
  if (config.NODE_ENV !== 'development') {
    return;
  }

  const serverAdapter = new FastifyAdapter();
  const testRunQueue = getTestRunQueue();

  createBullBoard({
    queues: [new BullMQAdapter(testRunQueue as any) as any],
    serverAdapter: serverAdapter as any,
  });

  serverAdapter.setBasePath('/admin/queues');
  await fastify.register(serverAdapter.registerPlugin() as any, { prefix: '/admin/queues' });

  fastify.log.info('Bull Board UI enabled at /admin/queues');
}
