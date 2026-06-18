/**
 * 全局错误处理 plugin
 * 关联: TDD §9.5
 */
import fp from 'fastify-plugin'
import { ZodError } from 'zod'
import { AppError } from '../lib/errors.js'
import type { FastifyPluginAsync, FastifyError } from 'fastify'

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((err: FastifyError, req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: err.flatten().fieldErrors,
        },
      })
    }
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details },
      })
    }
    // Fastify 验证错误
    if (err.validation) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: err.message,
          details: err.validation,
        },
      })
    }
    // 未知错误
    fastify.log.error({ err: { message: err.message, stack: err.stack }, req: { method: req.method, url: req.url } }, 'Unhandled error')
    return reply.code(err.statusCode ?? 500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.statusCode === 500 ? 'Internal server error' : err.message,
      },
    })
  })

  fastify.setNotFoundHandler((req, reply) => {
    return reply.code(404).send({
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` },
    })
  })
}

export default fp(errorHandlerPlugin, { name: 'error-handler' })
