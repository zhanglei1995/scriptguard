import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { alerts } from '@scriptguard/db'
import { NotFoundError } from '../../lib/errors.js'
import {
  AlertSchema,
  AlertListSchema,
  PaginationQuerySchema,
} from '../../lib/schemas.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

const IdParams = z.object({ id: z.string().uuid() })

export const alertsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /alerts
  fastify.get('/alerts', {
    schema: {
      querystring: zodToJsonSchema(PaginationQuerySchema),
      response: { 200: zodToJsonSchema(AlertListSchema) },
    },
  }, async (req) => {
    const { limit, offset } = PaginationQuerySchema.parse(req.query)
    const items = await db.select().from(alerts).limit(limit).offset(offset)
    const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(alerts)
    const total = countResult[0]?.count ?? 0
    return { items, total }
  })

  // POST /alerts/:id/ack
  fastify.post('/alerts/:id/ack', {
    schema: {
      params: zodToJsonSchema(IdParams),
      response: { 200: zodToJsonSchema(AlertSchema) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const [item] = await db.update(alerts).set({
      acknowledged: true,
      acknowledgedAt: new Date(),
    }).where(eq(alerts.id, id)).returning()
    if (!item) throw new NotFoundError('Alert not found')
    return item
  })
}
