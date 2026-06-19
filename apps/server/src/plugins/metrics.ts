/**
 * Prometheus Metrics Plugin
 * 关联: TDD §12.4
 *
 * 提供 /metrics 端点供 Prometheus 抓取。
 */
import type { FastifyInstance } from 'fastify'
import { register, startMetricsCollection, stopMetricsCollection } from '../lib/metrics.js'

export default async function metricsPlugin(fastify: FastifyInstance) {
  startMetricsCollection()

  fastify.addHook('onClose', async () => {
    stopMetricsCollection()
  })

  fastify.get('/metrics', async (_req, reply) => {
    const metrics = await register.metrics()
    reply.header('Content-Type', register.contentType)
    return reply.send(metrics)
  })

  fastify.get('/metrics/json', async (_req, reply) => {
    reply.header('Content-Type', 'application/json')
    return reply.send({ metrics: await register.metrics() })
  })
}
