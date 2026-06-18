import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, and, sql, desc } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { testRuns, scripts } from '@scriptguard/db'
import { NotFoundError } from '../../lib/errors.js'
import {
  TestRunSchema,
  TestRunListSchema,
  RunListQuerySchema,
} from '../../lib/schemas.js'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { addTestJob } from '../../lib/queue.js'

const IdParams = z.object({ id: z.string().uuid() })

async function assertScriptOwned(scriptId: string, userId: string): Promise<void> {
  const [script] = await db
    .select({ id: scripts.id })
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1)
  if (!script) throw new NotFoundError('Script not found')
}

async function assertRunAccessible(runId: string, userId: string): Promise<void> {
  const [row] = await db
    .select({ id: testRuns.id })
    .from(testRuns)
    .innerJoin(scripts, eq(testRuns.scriptId, scripts.id))
    .where(and(eq(testRuns.id, runId), eq(scripts.userId, userId)))
    .limit(1)
  if (!row) throw new NotFoundError('Run not found')
}

export const runsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /scripts/:id/run-now
  fastify.post('/scripts/:id/run-now', {
    schema: {
      params: zodToJsonSchema(IdParams),
      response: { 200: zodToJsonSchema(TestRunSchema) },
    },
  }, async (req) => {
    const userId = req.userId!
    const { id } = IdParams.parse(req.params)
    await assertScriptOwned(id, userId)

    const [run] = await db.insert(testRuns).values({
      scriptId: id,
      status: 'unknown',
      url: '',
      startedAt: new Date(),
      result: {},
    }).returning()

    await addTestJob(id, '')
    return run
  })

  // GET /scripts/:id/runs
  fastify.get('/scripts/:id/runs', {
    schema: {
      params: zodToJsonSchema(IdParams),
      querystring: zodToJsonSchema(RunListQuerySchema),
      response: { 200: zodToJsonSchema(TestRunListSchema) },
    },
  }, async (req) => {
    const userId = req.userId!
    const { id } = IdParams.parse(req.params)
    const { limit, offset } = RunListQuerySchema.parse(req.query)
    await assertScriptOwned(id, userId)

    const items = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.scriptId, id))
      .orderBy(desc(testRuns.createdAt))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testRuns)
      .where(eq(testRuns.scriptId, id))
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
    const userId = req.userId!
    const { id } = IdParams.parse(req.params)
    await assertRunAccessible(id, userId)

    const [item] = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.id, id))
      .limit(1)
    if (!item) throw new NotFoundError('Run not found')
    return item
  })
}
