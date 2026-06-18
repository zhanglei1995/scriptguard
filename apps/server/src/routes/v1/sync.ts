import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gt, isNull, inArray } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { scripts, checkRules } from '@scriptguard/db'
import { SyncRequestSchema } from '../../lib/schemas.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

export const syncRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /sync/push — accept client changes, detect conflicts, last-write-wins
  fastify.post('/sync/push', {
    schema: {
      body: zodToJsonSchema(SyncRequestSchema),
    },
  }, async (req, reply) => {
    const userId = req.userId!
    const body = SyncRequestSchema.parse(req.body)
    const { changes } = body
    const syncedAt = Date.now()
    const conflicts: Array<{ entity: 'script' | 'rule'; id: string; local: unknown; server: unknown }> = []

    // Process script changes
    if (changes.scripts && changes.scripts.length > 0) {
      for (const clientScript of changes.scripts) {
        const [existing] = await db.select().from(scripts)
          .where(and(
            eq(scripts.id, clientScript.id),
            eq(scripts.userId, userId),
            isNull(scripts.deletedAt),
          ))
          .limit(1)

        if (!existing) {
          // New script — insert
          await db.insert(scripts).values({
            id: clientScript.id,
            userId,
            name: clientScript.name,
            description: clientScript.description ?? null,
            version: clientScript.version ?? '1.0.0',
            code: clientScript.code ?? '',
            matchRules: clientScript.matchRules ?? [],
            runAt: clientScript.runAt ?? 'document_idle',
            enabled: clientScript.enabled ?? true,
            config: clientScript.config ?? {},
          })
        } else {
          // Existing script — compare updatedAt
          const clientUpdatedAt = new Date(clientScript.updatedAt).getTime()
          const serverUpdatedAt = existing.updatedAt.getTime()

          if (clientUpdatedAt > serverUpdatedAt) {
            // Client wins — update server
            await db.update(scripts).set({
              name: clientScript.name,
              description: clientScript.description ?? existing.description,
              version: clientScript.version ?? existing.version,
              code: clientScript.code ?? existing.code,
              matchRules: clientScript.matchRules ?? existing.matchRules,
              runAt: clientScript.runAt ?? existing.runAt,
              enabled: clientScript.enabled ?? existing.enabled,
              config: clientScript.config ?? existing.config,
              updatedAt: new Date(),
            }).where(eq(scripts.id, clientScript.id))
          } else if (clientUpdatedAt < serverUpdatedAt) {
            // Server wins — report conflict, server version will be returned
            conflicts.push({
              entity: 'script',
              id: clientScript.id,
              local: clientScript,
              server: existing,
            })
          }
          // Equal timestamps — no conflict, skip
        }
      }
    }

    // Process script deletions
    if (changes.deletedScriptIds && changes.deletedScriptIds.length > 0) {
      const validIds = changes.deletedScriptIds.filter(id =>
        typeof id === 'string' && id.length > 0
      )
      if (validIds.length > 0) {
        await db.update(scripts).set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        }).where(and(
          inArray(scripts.id, validIds),
          eq(scripts.userId, userId),
          isNull(scripts.deletedAt),
        ))
      }
    }

    // Process rule changes
    if (changes.rules && changes.rules.length > 0) {
      for (const clientRule of changes.rules) {
        const [existing] = await db.select().from(checkRules)
          .where(eq(checkRules.id, clientRule.id))
          .limit(1)

        if (!existing) {
          // New rule — insert
          await db.insert(checkRules).values({
            id: clientRule.id,
            scriptId: clientRule.scriptId,
            name: clientRule.name,
            type: clientRule.type,
            config: clientRule.config ?? {},
            required: clientRule.required ?? true,
            timeout: clientRule.timeout ?? 3000,
            alertLevel: clientRule.alertLevel ?? 'medium',
            order: clientRule.order ?? 0,
          })
        } else {
          // Rule exists — for rules, always accept client version (no updatedAt on rules)
          // Rules are simpler; we overwrite with client data
          await db.update(checkRules).set({
            name: clientRule.name,
            type: clientRule.type,
            config: clientRule.config ?? existing.config,
            required: clientRule.required ?? existing.required,
            timeout: clientRule.timeout ?? existing.timeout,
            alertLevel: clientRule.alertLevel ?? existing.alertLevel,
            order: clientRule.order ?? existing.order,
          }).where(eq(checkRules.id, clientRule.id))
        }
      }
    }

    return reply.send({
      serverVersion: body.clientVersion + 1,
      syncedAt,
      changes: {
        scripts: [],
        rules: [],
        deletedScriptIds: [],
      },
      conflicts,
    })
  })

  // POST /sync/pull — return changes since lastSyncAt
  fastify.post('/sync/pull', {
    schema: {
      body: zodToJsonSchema(SyncRequestSchema),
    },
  }, async (req) => {
    const userId = req.userId!
    const body = SyncRequestSchema.parse(req.body)
    const lastSyncDate = new Date(body.lastSyncAt)

    // Fetch scripts updated since lastSyncAt (excluding soft-deleted)
    const changedScripts = await db.select().from(scripts)
      .where(and(
        eq(scripts.userId, userId),
        gt(scripts.updatedAt, lastSyncDate),
        isNull(scripts.deletedAt),
      ))

    // Fetch ALL scripts updated since lastSyncAt (including soft-deleted) for deletion detection
    const allChanged = await db.select().from(scripts)
      .where(and(
        eq(scripts.userId, userId),
        gt(scripts.updatedAt, lastSyncDate),
      ))

    const deletedScriptIds = allChanged
      .filter(s => s.deletedAt !== null)
      .map(s => s.id)

    // Fetch rules for changed scripts
    const scriptIds = changedScripts.map(s => s.id)
    let changedRules: typeof checkRules.$inferSelect[] = []
    if (scriptIds.length > 0) {
      changedRules = await db.select().from(checkRules)
        .where(inArray(checkRules.scriptId, scriptIds))
    }

    const serverVersion = body.clientVersion + 1

    return {
      serverVersion,
      syncedAt: Date.now(),
      changes: {
        scripts: changedScripts,
        rules: changedRules,
        deletedScriptIds,
      },
      conflicts: [],
    }
  })
}
