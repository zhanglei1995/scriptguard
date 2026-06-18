import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { scripts, scriptVersions } from '@scriptguard/db'
import { NotFoundError } from '../../lib/errors.js'
import {
  ScriptSchema,
  ScriptListSchema,
  CreateScriptSchema,
  UpdateScriptSchema,
  ScriptVersionSchema,
  ScriptVersionListSchema,
  CreateScriptVersionSchema,
  ScriptListQuerySchema,
} from '../../lib/schemas.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

const IdParams = z.object({ id: z.string().uuid() })

export const scriptsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /scripts
  fastify.get('/scripts', {
    schema: {
      querystring: zodToJsonSchema(ScriptListQuerySchema),
      response: { 200: zodToJsonSchema(ScriptListSchema) },
    },
  }, async (req) => {
    const { limit, offset, teamId } = ScriptListQuerySchema.parse(req.query)
    const conditions = []
    if (teamId) conditions.push(eq(scripts.teamId, teamId))
    const where = conditions.length > 0 ? and(...conditions) : undefined
    const items = await db.select().from(scripts).where(where).limit(limit).offset(offset)
    const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(scripts).where(where)
    const total = countResult[0]?.count ?? 0
    return { items, total }
  })

  // GET /scripts/:id
  fastify.get('/scripts/:id', {
    schema: {
      params: zodToJsonSchema(IdParams),
      response: { 200: zodToJsonSchema(ScriptSchema) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const [item] = await db.select().from(scripts).where(eq(scripts.id, id)).limit(1)
    if (!item) throw new NotFoundError('Script not found')
    return item
  })

  // POST /scripts
  fastify.post('/scripts', {
    schema: {
      body: zodToJsonSchema(CreateScriptSchema),
      response: { 201: zodToJsonSchema(ScriptSchema) },
    },
  }, async (req, reply) => {
    const data = CreateScriptSchema.parse(req.body)
    const userId = '00000000-0000-0000-0000-000000000000'
    const [item] = await db.insert(scripts).values({
      ...data,
      userId,
      matchRules: data.matchRules ?? [],
      runAt: data.runAt ?? 'document_idle',
      config: data.config ?? {},
    }).returning()
    return reply.code(201).send(item)
  })

  // PUT /scripts/:id
  fastify.put('/scripts/:id', {
    schema: {
      params: zodToJsonSchema(IdParams),
      body: zodToJsonSchema(UpdateScriptSchema),
      response: { 200: zodToJsonSchema(ScriptSchema) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const data = UpdateScriptSchema.parse(req.body)
    const [item] = await db.update(scripts).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(scripts.id, id)).returning()
    if (!item) throw new NotFoundError('Script not found')
    return item
  })

  // DELETE /scripts/:id
  fastify.delete('/scripts/:id', {
    schema: {
      params: zodToJsonSchema(IdParams),
      response: { 204: zodToJsonSchema(z.null()) },
    },
  }, async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const [item] = await db.delete(scripts).where(eq(scripts.id, id)).returning()
    if (!item) throw new NotFoundError('Script not found')
    return reply.code(204).send()
  })

  // GET /scripts/:id/versions
  fastify.get('/scripts/:id/versions', {
    schema: {
      params: zodToJsonSchema(IdParams),
      response: { 200: zodToJsonSchema(ScriptVersionListSchema) },
    },
  }, async (req) => {
    const { id } = IdParams.parse(req.params)
    const items = await db.select().from(scriptVersions).where(eq(scriptVersions.scriptId, id))
    return { items, total: items.length }
  })

  // POST /scripts/:id/versions
  fastify.post('/scripts/:id/versions', {
    schema: {
      params: zodToJsonSchema(IdParams),
      body: zodToJsonSchema(CreateScriptVersionSchema),
      response: { 201: zodToJsonSchema(ScriptVersionSchema) },
    },
  }, async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const data = CreateScriptVersionSchema.parse(req.body)
    const [item] = await db.insert(scriptVersions).values({
      scriptId: id,
      ...data,
      isStable: data.isStable ?? false,
    }).returning()
    return reply.code(201).send(item)
  })
}
