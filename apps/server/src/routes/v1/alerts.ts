import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { alerts } from '@scriptguard/db';
import { NotFoundError } from '../../lib/errors.js';
import { AlertSchema, AlertListSchema, AlertListQuerySchema } from '../../lib/schemas.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

const IdParams = z.object({ id: z.string().uuid() });

export const alertsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /alerts
  fastify.get(
    '/alerts',
    {
      schema: {
        querystring: zodToJsonSchema(AlertListQuerySchema),
        response: { 200: zodToJsonSchema(AlertListSchema) },
      },
    },
    async (req) => {
      const { limit, offset, acknowledged, scriptId } = AlertListQuerySchema.parse(req.query);
      const conditions = [];
      if (acknowledged !== undefined) conditions.push(eq(alerts.acknowledged, acknowledged));
      if (scriptId) conditions.push(eq(alerts.scriptId, scriptId));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const items = await db.select().from(alerts).where(where).limit(limit).offset(offset);
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(alerts)
        .where(where);
      const total = countResult[0]?.count ?? 0;
      return { items, total };
    },
  );

  // POST /alerts/:id/ack
  fastify.post(
    '/alerts/:id/ack',
    {
      schema: {
        params: zodToJsonSchema(IdParams),
        response: { 200: zodToJsonSchema(AlertSchema) },
      },
    },
    async (req) => {
      const { id } = IdParams.parse(req.params);
      const [item] = await db
        .update(alerts)
        .set({
          acknowledged: true,
          acknowledgedAt: new Date(),
        })
        .where(eq(alerts.id, id))
        .returning();
      if (!item) throw new NotFoundError('Alert not found');
      return item;
    },
  );
};
