import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { notifyChannels } from '@scriptguard/db'
import { NotFoundError } from '../../lib/errors.js'
import {
  NotifyChannelSchema,
  NotifyChannelListSchema,
  CreateNotifyChannelSchema,
  TestNotifyChannelSchema,
  PaginationQuerySchema,
} from '../../lib/schemas.js'
import { notificationService } from '../../lib/notify/index.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

const IdParams = z.object({ id: z.string().uuid() })

export const channelsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /channels
  fastify.get('/channels', {
    schema: {
      querystring: zodToJsonSchema(PaginationQuerySchema),
      response: { 200: zodToJsonSchema(NotifyChannelListSchema) },
    },
  }, async (req) => {
    const { limit, offset } = PaginationQuerySchema.parse(req.query)
    const items = await db.select().from(notifyChannels).limit(limit).offset(offset)
    const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(notifyChannels)
    const total = countResult[0]?.count ?? 0
    return { items, total }
  })

  // POST /channels
  fastify.post('/channels', {
    schema: {
      body: zodToJsonSchema(CreateNotifyChannelSchema),
      response: { 201: zodToJsonSchema(NotifyChannelSchema) },
    },
  }, async (req, reply) => {
    const data = CreateNotifyChannelSchema.parse(req.body)
    const userId = '00000000-0000-0000-0000-000000000000'
    const [item] = await db.insert(notifyChannels).values({
      ...data,
      userId,
      enabled: data.enabled ?? true,
    }).returning()
    return reply.code(201).send(item)
  })

  // POST /channels/:id/test
  fastify.post('/channels/:id/test', {
    schema: {
      params: zodToJsonSchema(IdParams),
      body: zodToJsonSchema(TestNotifyChannelSchema),
      response: { 200: zodToJsonSchema(z.object({ success: z.boolean(), message: z.string() })) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const body = TestNotifyChannelSchema.parse(req.body)
    const [item] = await db.select().from(notifyChannels).where(eq(notifyChannels.id, id)).limit(1)
    if (!item) throw new NotFoundError('Channel not found')
    const result = await notificationService.sendTest(
      { type: item.type, config: item.config as Record<string, unknown> },
      body.message,
    )
    if (!result.success) {
      return { success: false, message: result.error ?? 'Failed to send test message' }
    }
    return { success: true, message: `Test message sent to ${item.type} channel` }
  })
}
