import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, asc } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { checkRules, scripts } from '@scriptguard/db';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
import {
  CheckRuleSchema,
  CheckRuleListSchema,
  CreateCheckRuleSchema,
  UpdateCheckRuleSchema,
  ReorderSchema,
} from '../../lib/schemas.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

const ScriptIdParams = z.object({ id: z.string().uuid() });
const RuleIdParams = z.object({ id: z.string().uuid() });

async function verifyScriptOwnership(scriptId: string, userId: string) {
  const [script] = await db.select().from(scripts).where(eq(scripts.id, scriptId)).limit(1);
  if (!script) throw new NotFoundError('Script not found');
  if (script.userId !== userId) throw new ForbiddenError('Script not found');
  return script;
}

async function verifyRuleOwnership(ruleId: string, userId: string) {
  const [rule] = await db.select().from(checkRules).where(eq(checkRules.id, ruleId)).limit(1);
  if (!rule) throw new NotFoundError('Rule not found');
  await verifyScriptOwnership(rule.scriptId, userId);
  return rule;
}

export const rulesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/scripts/:id/rules',
    {
      schema: {
        params: zodToJsonSchema(ScriptIdParams),
        response: { 200: zodToJsonSchema(CheckRuleListSchema) },
      },
    },
    async (req) => {
      const { id } = ScriptIdParams.parse(req.params);
      const userId = req.userId!;
      await verifyScriptOwnership(id, userId);
      const items = await db
        .select()
        .from(checkRules)
        .where(eq(checkRules.scriptId, id))
        .orderBy(asc(checkRules.order));
      return { items, total: items.length };
    },
  );

  fastify.post(
    '/scripts/:id/rules',
    {
      schema: {
        params: zodToJsonSchema(ScriptIdParams),
        body: zodToJsonSchema(CreateCheckRuleSchema),
        response: { 201: zodToJsonSchema(CheckRuleSchema) },
      },
    },
    async (req, reply) => {
      const { id } = ScriptIdParams.parse(req.params);
      const userId = req.userId!;
      await verifyScriptOwnership(id, userId);
      const data = CreateCheckRuleSchema.parse(req.body);
      const [item] = await db
        .insert(checkRules)
        .values({
          scriptId: id,
          ...data,
          config: data.config ?? {},
          required: data.required ?? true,
          timeout: data.timeout ?? 3000,
          alertLevel: data.alertLevel ?? 'medium',
          order: data.order ?? 0,
        })
        .returning();
      return reply.code(201).send(item);
    },
  );

  fastify.put(
    '/rules/:id',
    {
      schema: {
        params: zodToJsonSchema(RuleIdParams),
        body: zodToJsonSchema(UpdateCheckRuleSchema),
        response: { 200: zodToJsonSchema(CheckRuleSchema) },
      },
    },
    async (req) => {
      const { id } = RuleIdParams.parse(req.params);
      const userId = req.userId!;
      await verifyRuleOwnership(id, userId);
      const data = UpdateCheckRuleSchema.parse(req.body);
      const [item] = await db.update(checkRules).set(data).where(eq(checkRules.id, id)).returning();
      if (!item) throw new NotFoundError('Rule not found');
      return item;
    },
  );

  fastify.delete(
    '/rules/:id',
    {
      schema: {
        params: zodToJsonSchema(RuleIdParams),
        response: { 204: zodToJsonSchema(z.null()) },
      },
    },
    async (req, reply) => {
      const { id } = RuleIdParams.parse(req.params);
      const userId = req.userId!;
      await verifyRuleOwnership(id, userId);
      const [item] = await db.delete(checkRules).where(eq(checkRules.id, id)).returning();
      if (!item) throw new NotFoundError('Rule not found');
      return reply.code(204).send();
    },
  );

  fastify.post(
    '/rules/reorder',
    {
      schema: {
        body: zodToJsonSchema(ReorderSchema),
        response: { 200: zodToJsonSchema(z.object({ success: z.literal(true) })) },
      },
    },
    async (req) => {
      const userId = req.userId!;
      const { items } = ReorderSchema.parse(req.body);

      await db.transaction(async (tx) => {
        for (const item of items) {
          const [rule] = await tx
            .select()
            .from(checkRules)
            .where(eq(checkRules.id, item.id))
            .limit(1);
          if (!rule) throw new NotFoundError(`Rule ${item.id} not found`);
          const [script] = await tx
            .select()
            .from(scripts)
            .where(eq(scripts.id, rule.scriptId))
            .limit(1);
          if (!script || script.userId !== userId) throw new ForbiddenError('Rule not found');
          await tx.update(checkRules).set({ order: item.order }).where(eq(checkRules.id, item.id));
        }
      });

      return { success: true as const };
    },
  );
};
