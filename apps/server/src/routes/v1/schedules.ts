import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { testSchedules, scripts } from '@scriptguard/db';
import { NotFoundError } from '../../lib/errors.js';
import {
  TestScheduleSchema,
  TestScheduleListSchema,
  CreateTestScheduleSchema,
  UpdateTestScheduleSchema,
  PaginationQuerySchema,
} from '../../lib/schemas.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

const IdParams = z.object({ id: z.string().uuid() });

async function assertScriptOwned(scriptId: string, userId: string): Promise<void> {
  const [script] = await db
    .select({ id: scripts.id })
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);
  if (!script) throw new NotFoundError('Script not found');
}

async function assertScheduleOwned(
  id: string,
  userId: string,
): Promise<typeof testSchedules.$inferSelect> {
  const [schedule] = await db
    .select()
    .from(testSchedules)
    .innerJoin(scripts, eq(testSchedules.scriptId, scripts.id))
    .where(and(eq(testSchedules.id, id), eq(scripts.userId, userId)))
    .limit(1);
  if (!schedule) throw new NotFoundError('Schedule not found');
  return schedule.test_schedules;
}

export const schedulesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /schedules
  fastify.get(
    '/schedules',
    {
      schema: {
        querystring: zodToJsonSchema(PaginationQuerySchema),
        response: { 200: zodToJsonSchema(TestScheduleListSchema) },
      },
    },
    async (req) => {
      const userId = req.userId!;
      const { limit, offset } = PaginationQuerySchema.parse(req.query);
      const items = await db
        .select()
        .from(testSchedules)
        .innerJoin(scripts, eq(testSchedules.scriptId, scripts.id))
        .where(eq(scripts.userId, userId))
        .limit(limit)
        .offset(offset);
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(testSchedules)
        .innerJoin(scripts, eq(testSchedules.scriptId, scripts.id))
        .where(eq(scripts.userId, userId));
      const total = countResult[0]?.count ?? 0;
      return { items: items.map((r) => r.test_schedules), total };
    },
  );

  // POST /schedules
  fastify.post(
    '/schedules',
    {
      schema: {
        body: zodToJsonSchema(CreateTestScheduleSchema),
        response: { 201: zodToJsonSchema(TestScheduleSchema) },
      },
    },
    async (req, reply) => {
      const userId = req.userId!;
      const data = CreateTestScheduleSchema.parse(req.body);
      await assertScriptOwned(data.scriptId, userId);
      const [item] = await db
        .insert(testSchedules)
        .values({
          ...data,
          config: data.config ?? {},
          enabled: data.enabled ?? true,
        })
        .returning();
      return reply.code(201).send(item);
    },
  );

  // PUT /schedules/:id
  fastify.put(
    '/schedules/:id',
    {
      schema: {
        params: zodToJsonSchema(IdParams),
        body: zodToJsonSchema(UpdateTestScheduleSchema),
        response: { 200: zodToJsonSchema(TestScheduleSchema) },
      },
    },
    async (req) => {
      const userId = req.userId!;
      const { id } = IdParams.parse(req.params);
      const data = UpdateTestScheduleSchema.parse(req.body);
      await assertScheduleOwned(id, userId);
      const [item] = await db
        .update(testSchedules)
        .set(data)
        .where(eq(testSchedules.id, id))
        .returning();
      if (!item) throw new NotFoundError('Schedule not found');
      return item;
    },
  );

  // DELETE /schedules/:id
  fastify.delete(
    '/schedules/:id',
    {
      schema: {
        params: zodToJsonSchema(IdParams),
        response: { 204: zodToJsonSchema(z.null()) },
      },
    },
    async (req, reply) => {
      const userId = req.userId!;
      const { id } = IdParams.parse(req.params);
      await assertScheduleOwned(id, userId);
      const [item] = await db.delete(testSchedules).where(eq(testSchedules.id, id)).returning();
      if (!item) throw new NotFoundError('Schedule not found');
      return reply.code(204).send();
    },
  );
};
