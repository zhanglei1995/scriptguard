import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../lib/auth.js'
import { UnauthorizedError } from '../lib/errors.js'

const WHITELIST_PATHS = [
  '/auth/login',
  '/auth/register',
  '/health',
  '/ready',
  '/docs',
  '/webhook',
  '/',
]

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string
    userPlan?: string
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('userId', undefined)
  fastify.decorateRequest('userPlan', undefined)

  // Rate limit: 5 req/min/IP for auth endpoints
  await fastify.register(rateLimit, {
    max: 5,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip ?? req.socket.remoteAddress ?? 'unknown',
    errorResponseBuilder: () => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    }),
  })

  fastify.addHook('onRequest', async (req: FastifyRequest, _reply: FastifyReply) => {
    const path = req.url.split('?')[0] ?? ''

    if (WHITELIST_PATHS.some((p) => path === p || path.startsWith(p + '/'))) {
      return
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header')
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    req.userId = payload.userId
    req.userPlan = payload.plan
  })
}

export default fp(authPlugin, { name: 'auth' })
