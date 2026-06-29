import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, sql, lt, or, isNull } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { scripts, scriptVersions } from '@scriptguard/db';
import { NotFoundError } from '../../lib/errors.js';
import {
  ScriptSchema,
  ScriptListSchema,
  CreateScriptSchema,
  UpdateScriptSchema,
  ScriptVersionSchema,
  ScriptVersionListSchema,
  CreateScriptVersionSchema,
  ScriptListQuerySchema,
} from '../../lib/schemas.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

const IdParams = z.object({ id: z.string().uuid() });
const VersionIdParams = z.object({ id: z.string().uuid(), versionId: z.string().uuid() });

function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  return { createdAt: new Date(decoded.createdAt), id: decoded.id };
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString('base64');
}

export const scriptsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /scripts — cursor-based pagination, team filter, soft-delete excluded
  fastify.get(
    '/scripts',
    {
      schema: {
        querystring: zodToJsonSchema(ScriptListQuerySchema),
        response: { 200: zodToJsonSchema(ScriptListSchema) },
      },
    },
    async (req) => {
      const { limit, cursor, teamId } = ScriptListQuerySchema.parse(req.query);
      const conditions = [isNull(scripts.deletedAt)];
      if (teamId) conditions.push(eq(scripts.teamId, teamId));
      if (cursor) {
        const c = decodeCursor(cursor);
        conditions.push(
          or(
            lt(scripts.createdAt, c.createdAt),
            and(eq(scripts.createdAt, c.createdAt), lt(scripts.id, c.id)),
          )!,
        );
      }
      const where = and(...conditions);
      const items = await db
        .select()
        .from(scripts)
        .where(where)
        .orderBy(scripts.createdAt, scripts.id)
        .limit(limit + 1);
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(scripts)
        .where(where);
      const total = countResult[0]?.count ?? 0;
      const hasMore = items.length > limit;
      const sliced = hasMore ? items.slice(0, limit) : items;
      const lastItem = sliced[sliced.length - 1];
      const nextCursor = hasMore && lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : null;
      return { items: sliced, total: hasMore ? total : sliced.length, nextCursor };
    },
  );

  // GET /scripts/:id — excludes soft-deleted
  fastify.get(
    '/scripts/:id',
    {
      schema: {
        params: zodToJsonSchema(IdParams),
        response: { 200: zodToJsonSchema(ScriptSchema) },
      },
    },
    async (req) => {
      const { id } = IdParams.parse(req.params);
      const [item] = await db
        .select()
        .from(scripts)
        .where(and(eq(scripts.id, id), isNull(scripts.deletedAt)))
        .limit(1);
      if (!item) throw new NotFoundError('Script not found');
      return item;
    },
  );

  // POST /scripts — userId from JWT
  fastify.post(
    '/scripts',
    {
      schema: {
        body: zodToJsonSchema(CreateScriptSchema),
        response: { 201: zodToJsonSchema(ScriptSchema) },
      },
    },
    async (req, reply) => {
      const data = CreateScriptSchema.parse(req.body);
      const userId = req.userId!;
      const [item] = await db
        .insert(scripts)
        .values({
          ...data,
          userId,
          matchRules: data.matchRules ?? [],
          runAt: data.runAt ?? 'document_idle',
          config: data.config ?? {},
        })
        .returning();
      return reply.code(201).send(item);
    },
  );

  // PUT /scripts/:id — excludes soft-deleted
  fastify.put(
    '/scripts/:id',
    {
      schema: {
        params: zodToJsonSchema(IdParams),
        body: zodToJsonSchema(UpdateScriptSchema),
        response: { 200: zodToJsonSchema(ScriptSchema) },
      },
    },
    async (req) => {
      const { id } = IdParams.parse(req.params);
      const data = UpdateScriptSchema.parse(req.body);
      const [item] = await db
        .update(scripts)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(scripts.id, id), isNull(scripts.deletedAt)))
        .returning();
      if (!item) throw new NotFoundError('Script not found');
      return item;
    },
  );

  // DELETE /scripts/:id — soft delete
  fastify.delete(
    '/scripts/:id',
    {
      schema: {
        params: zodToJsonSchema(IdParams),
        response: { 204: zodToJsonSchema(z.null()) },
      },
    },
    async (req, reply) => {
      const { id } = IdParams.parse(req.params);
      const [item] = await db
        .update(scripts)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(scripts.id, id), isNull(scripts.deletedAt)))
        .returning();
      if (!item) throw new NotFoundError('Script not found');
      return reply.code(204).send();
    },
  );

  // GET /scripts/:id/versions
  fastify.get(
    '/scripts/:id/versions',
    {
      schema: {
        params: zodToJsonSchema(IdParams),
        response: { 200: zodToJsonSchema(ScriptVersionListSchema) },
      },
    },
    async (req) => {
      const { id } = IdParams.parse(req.params);
      const [script] = await db
        .select()
        .from(scripts)
        .where(and(eq(scripts.id, id), isNull(scripts.deletedAt)))
        .limit(1);
      if (!script) throw new NotFoundError('Script not found');
      const items = await db
        .select()
        .from(scriptVersions)
        .where(eq(scriptVersions.scriptId, id))
        .orderBy(scriptVersions.createdAt);
      return { items, total: items.length };
    },
  );

  // POST /scripts/:id/versions
  fastify.post(
    '/scripts/:id/versions',
    {
      schema: {
        params: zodToJsonSchema(IdParams),
        body: zodToJsonSchema(CreateScriptVersionSchema),
        response: { 201: zodToJsonSchema(ScriptVersionSchema) },
      },
    },
    async (req, reply) => {
      const { id } = IdParams.parse(req.params);
      const [script] = await db
        .select()
        .from(scripts)
        .where(and(eq(scripts.id, id), isNull(scripts.deletedAt)))
        .limit(1);
      if (!script) throw new NotFoundError('Script not found');
      const data = CreateScriptVersionSchema.parse(req.body);
      const [item] = await db
        .insert(scriptVersions)
        .values({
          scriptId: id,
          ...data,
          isStable: data.isStable ?? false,
        })
        .returning();
      return reply.code(201).send(item);
    },
  );

  // POST /scripts/:id/rollback/:versionId
  fastify.post(
    '/scripts/:id/rollback/:versionId',
    {
      schema: {
        params: zodToJsonSchema(VersionIdParams),
        response: { 200: zodToJsonSchema(ScriptSchema) },
      },
    },
    async (req) => {
      const { id, versionId } = VersionIdParams.parse(req.params);
      const [script] = await db
        .select()
        .from(scripts)
        .where(and(eq(scripts.id, id), isNull(scripts.deletedAt)))
        .limit(1);
      if (!script) throw new NotFoundError('Script not found');
      const [version] = await db
        .select()
        .from(scriptVersions)
        .where(eq(scriptVersions.id, versionId))
        .limit(1);
      if (!version || version.scriptId !== id) throw new NotFoundError('Version not found');
      const [updated] = await db
        .update(scripts)
        .set({
          code: version.code,
          version: version.version,
          updatedAt: new Date(),
        })
        .where(eq(scripts.id, id))
        .returning();
      return updated!;
    },
  );
};
