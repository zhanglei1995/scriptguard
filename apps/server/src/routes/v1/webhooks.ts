/**
 * GitHub Actions Webhook Route
 *
 * SG-043: GitHub Actions 集成
 * Receives test results from GH Actions and upserts into test_runs table
 */
import type { FastifyPluginAsync } from 'fastify'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../../lib/db.js'
import { testRuns, scripts, alerts } from '@scriptguard/db'
import { config } from '../../config.js'
import { AppError } from '../../lib/errors.js'

interface GhActionsPayload {
  scriptId: string
  status: 'healthy' | 'degraded' | 'failed' | 'unknown'
  url: string
  duration?: number
  failedRules?: string[]
  screenshot?: string
  domSnapshot?: string
  errorMessage?: string
}

function verifySignature(payload: string, signature: string): boolean {
  const secret = config.WEBHOOK_SECRET
  const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')

  if (expected.length !== signature.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Params: { token: string }; Body: GhActionsPayload }>(
    '/webhook/gh-actions/:token',
    async (req, reply) => {
      const { token } = req.params

      if (!token || token.length < 32) {
        throw new AppError(400, 'INVALID_TOKEN', 'Invalid webhook token')
      }

      const rawBody = JSON.stringify(req.body)
      const signature = req.headers['x-scriptguard-signature'] as string | undefined

      if (!signature) {
        throw new AppError(401, 'MISSING_SIGNATURE', 'Missing x-scriptguard-signature header')
      }

      if (!verifySignature(rawBody, signature)) {
        throw new AppError(401, 'INVALID_SIGNATURE', 'Invalid HMAC signature')
      }

      const payload = req.body
      const { scriptId, status, url, duration, failedRules, screenshot, domSnapshot, errorMessage } = payload

      if (!scriptId || !status || !url) {
        throw new AppError(400, 'INVALID_PAYLOAD', 'Missing required fields: scriptId, status, url')
      }

      const [script] = await db
        .select({ id: scripts.id, userId: scripts.userId })
        .from(scripts)
        .where(eq(scripts.id, scriptId))
        .limit(1)

      if (!script) {
        throw new AppError(404, 'SCRIPT_NOT_FOUND', `Script ${scriptId} not found`)
      }

      const now = new Date()
      const result: Record<string, unknown> = { failedRules: failedRules ?? [] }
      if (errorMessage) result.errorMessage = errorMessage

      const [createdRun] = await db
        .insert(testRuns)
        .values({
          scriptId,
          status,
          url,
          startedAt: new Date(now.getTime() - (duration ?? 0)),
          endedAt: now,
          durationMs: duration ?? null,
          result,
          screenshotUrl: screenshot ?? null,
          domSnapshotUrl: domSnapshot ?? null,
        })
        .returning()

      if (!createdRun) {
        throw new AppError(500, 'INSERT_FAILED', 'Failed to create test run')
      }

      if (status === 'failed' || status === 'degraded') {
        await db.insert(alerts).values({
          userId: script.userId,
          scriptId,
          runId: createdRun.id,
          level: status === 'failed' ? 'high' : 'medium',
          message: `Script test ${status}: ${failedRules?.join(', ') ?? errorMessage ?? 'Unknown reason'}`,
          payload: { failedRules: failedRules ?? [], url },
        })
      }

      return reply.code(201).send({ ok: true, runId: createdRun.id })
    },
  )
}
