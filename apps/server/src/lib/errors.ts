/**
 * 业务异常 + 统一错误响应
 * 关联: TDD §5.2 / §9.5
 */
import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(404, 'NOT_FOUND', message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request', details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(401, 'UNAUTHORIZED', message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(403, 'FORBIDDEN', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable entity', details?: unknown) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details);
  }
}

/**
 * 统一错误响应
 * 关联: TDD §5.2
 */
export function sendError(reply: FastifyReply, err: unknown): FastifyReply {
  if (err instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.flatten().fieldErrors,
      },
    });
  }
  if (err instanceof AppError) {
    return reply.code(err.statusCode).send({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }
  return reply.code(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: err instanceof Error ? err.message : 'Unknown error',
    },
  });
}
