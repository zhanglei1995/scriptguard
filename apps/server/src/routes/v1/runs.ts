import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { testRuns } from '@scriptguard/db'
import { NotFoundError } from '../../lib/errors.js'
import {
  TestRunSchema,
  TestRunListSchema,
  PaginationQuerySchema,
} from '../../lib/schemas.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

const IdParams = z.object({ id: z.string().uuid() })

export const runsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /scripts/:id/run-now
  fastify.post('/scripts/:id/run-now', {
    schema: {
      params: zodToJsonSchema(IdParams),
      response: { 200: zodToJsonSchema(TestRunSchema) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const [run] = await db.insert(testRuns).values({
      scriptId: id,
      status: 'unknown',
      url: '',
      startedAt: new Date(),
      result: {},
    }).returning()
    return run
  })

  // GET /scripts/:id/runs
  fastify.get('/scripts/:id/runs', {
    schema: {
      params: zodToJsonSchema(IdParams),
      querystring: zodToJsonSchema(PaginationQuerySchema),
      response: { 200: zodToJsonSchema(TestRunListSchema) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const { limit, offset } = PaginationQuerySchema.parse(req.query)
    const items = await db.select().from(testRuns)
      .where(eq(testRuns.scriptId, id))
      .limit(limit).offset(offset)
    const countResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(testRuns).where(eq(testRuns.scriptId, id))
    const total = countResult[0]?.count ?? 0
    return { items, total }
  })

  // GET /runs/:id
  fastify.get('/runs/:id', {
    schema: {
      params: zodToJsonSchema(IdParams),
      response: { 200: zodToJsonSchema(TestRunSchema) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const [item] = await db.select().from(testRuns).where(eq(testRuns.id, id)).limit(1)
    if (!item) throw new NotFoundError('Run not found')
    return item
  })
}
