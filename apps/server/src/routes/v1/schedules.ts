import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { testSchedules } from '@scriptguard/db'
import { NotFoundError } from '../../lib/errors.js'
import {
  TestScheduleSchema,
  TestScheduleListSchema,
  CreateTestScheduleSchema,
  UpdateTestScheduleSchema,
  PaginationQuerySchema,
} from '../../lib/schemas.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

const IdParams = z.object({ id: z.string().uuid() })

export const schedulesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /schedules
  fastify.get('/schedules', {
    schema: {
      querystring: zodToJsonSchema(PaginationQuerySchema),
      response: { 200: zodToJsonSchema(TestScheduleListSchema) },
    },
  }, async (req) => {
    const { limit, offset } = PaginationQuerySchema.parse(req.query)
    const items = await db.select().from(testSchedules).limit(limit).offset(offset)
    const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(testSchedules)
    const total = countResult[0]?.count ?? 0
    return { items, total }
  })

  // POST /schedules
  fastify.post('/schedules', {
    schema: {
      body: zodToJsonSchema(CreateTestScheduleSchema),
      response: { 201: zodToJsonSchema(TestScheduleSchema) },
    },
  }, async (req, reply) => {
    const data = CreateTestScheduleSchema.parse(req.body)
    const [item] = await db.insert(testSchedules).values({
      ...data,
      config: data.config ?? {},
      enabled: data.enabled ?? true,
    }).returning()
    return reply.code(201).send(item)
  })

  // PUT /schedules/:id
  fastify.put('/schedules/:id', {
    schema: {
      params: zodToJsonSchema(IdParams),
      body: zodToJsonSchema(UpdateTestScheduleSchema),
      response: { 200: zodToJsonSchema(TestScheduleSchema) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const data = UpdateTestScheduleSchema.parse(req.body)
    const [item] = await db.update(testSchedules).set(data).where(eq(testSchedules.id, id)).returning()
    if (!item) throw new NotFoundError('Schedule not found')
    return item
  })

  // DELETE /schedules/:id
  fastify.delete('/schedules/:id', {
    schema: {
      params: zodToJsonSchema(IdParams),
      response: { 204: zodToJsonSchema(z.null()) },
    },
  }, async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const [item] = await db.delete(testSchedules).where(eq(testSchedules.id, id)).returning()
    if (!item) throw new NotFoundError('Schedule not found')
    return reply.code(204).send()
  })
}
