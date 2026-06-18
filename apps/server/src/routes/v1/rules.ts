import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { checkRules } from '@scriptguard/db'
import { NotFoundError } from '../../lib/errors.js'
import {
  CheckRuleSchema,
  CheckRuleListSchema,
  CreateCheckRuleSchema,
  UpdateCheckRuleSchema,
} from '../../lib/schemas.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

const ScriptIdParams = z.object({ id: z.string().uuid() })
const RuleIdParams = z.object({ id: z.string().uuid() })

export const rulesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /scripts/:id/rules
  fastify.get('/scripts/:id/rules', {
    schema: {
      params: zodToJsonSchema(ScriptIdParams),
      response: { 200: zodToJsonSchema(CheckRuleListSchema) },
    },
  }, async (req) => {
    const { id } = ScriptIdParams.parse(req.params)
    const items = await db.select().from(checkRules).where(eq(checkRules.scriptId, id))
    return { items, total: items.length }
  })

  // POST /scripts/:id/rules
  fastify.post('/scripts/:id/rules', {
    schema: {
      params: zodToJsonSchema(ScriptIdParams),
      body: zodToJsonSchema(CreateCheckRuleSchema),
      response: { 201: zodToJsonSchema(CheckRuleSchema) },
    },
  }, async (req, reply) => {
    const { id } = ScriptIdParams.parse(req.params)
    const data = CreateCheckRuleSchema.parse(req.body)
    const [item] = await db.insert(checkRules).values({
      scriptId: id,
      ...data,
      config: data.config ?? {},
      required: data.required ?? true,
      timeout: data.timeout ?? 3000,
      alertLevel: data.alertLevel ?? 'medium',
      order: data.order ?? 0,
    }).returning()
    return reply.code(201).send(item)
  })

  // PUT /rules/:id
  fastify.put('/rules/:id', {
    schema: {
      params: zodToJsonSchema(RuleIdParams),
      body: zodToJsonSchema(UpdateCheckRuleSchema),
      response: { 200: zodToJsonSchema(CheckRuleSchema) },
    },
  }, async (req) => {
    const { id } = RuleIdParams.parse(req.params)
    const data = UpdateCheckRuleSchema.parse(req.body)
    const [item] = await db.update(checkRules).set(data).where(eq(checkRules.id, id)).returning()
    if (!item) throw new NotFoundError('Check rule not found')
    return item
  })

  // DELETE /rules/:id
  fastify.delete('/rules/:id', {
    schema: {
      params: zodToJsonSchema(RuleIdParams),
      response: { 204: zodToJsonSchema(z.null()) },
    },
  }, async (req, reply) => {
    const { id } = RuleIdParams.parse(req.params)
    const [item] = await db.delete(checkRules).where(eq(checkRules.id, id)).returning()
    if (!item) throw new NotFoundError('Check rule not found')
    return reply.code(204).send()
  })
}
