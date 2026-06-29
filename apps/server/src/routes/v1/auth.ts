import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { users } from '@scriptguard/db';
import {
  RegisterSchema,
  LoginSchema,
  TokenResponseSchema,
  RefreshTokenSchema,
} from '../../lib/schemas.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../../lib/auth.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../lib/errors.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/register
  fastify.post(
    '/auth/register',
    {
      schema: {
        body: zodToJsonSchema(RegisterSchema),
        response: {
          201: zodToJsonSchema(TokenResponseSchema),
        },
      },
    },
    async (req, reply) => {
      const { email, password } = RegisterSchema.parse(req.body);

      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing) throw new ConflictError('Email already registered');

      const passwordHash = await hashPassword(password);
      const [user] = await db.insert(users).values({ email, passwordHash }).returning();
      if (!user) throw new Error('Failed to create user');

      const token = generateToken({ userId: user.id, plan: user.plan });
      return reply.code(201).send({
        accessToken: token,
        tokenType: 'Bearer' as const,
        expiresIn: '7d',
      });
    },
  );

  // POST /auth/login
  fastify.post(
    '/auth/login',
    {
      schema: {
        body: zodToJsonSchema(LoginSchema),
        response: {
          200: zodToJsonSchema(TokenResponseSchema),
        },
      },
    },
    async (req) => {
      const { email, password } = LoginSchema.parse(req.body);

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid email or password');

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) throw new UnauthorizedError('Invalid email or password');

      const token = generateToken({ userId: user.id, plan: user.plan });
      return {
        accessToken: token,
        tokenType: 'Bearer' as const,
        expiresIn: '7d',
      };
    },
  );

  // POST /auth/refresh
  fastify.post(
    '/auth/refresh',
    {
      schema: {
        body: zodToJsonSchema(RefreshTokenSchema),
        response: {
          200: zodToJsonSchema(TokenResponseSchema),
        },
      },
    },
    async (req) => {
      const { token } = RefreshTokenSchema.parse(req.body);

      const payload = verifyToken(token);
      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      if (!user) throw new NotFoundError('User not found');

      const newToken = generateToken({ userId: user.id, plan: user.plan });
      return {
        accessToken: newToken,
        tokenType: 'Bearer' as const,
        expiresIn: '7d',
      };
    },
  );

  // POST /auth/logout
  fastify.post(
    '/auth/logout',
    {
      schema: {
        response: {
          200: zodToJsonSchema(z.object({ message: z.string() })),
        },
      },
    },
    async () => {
      return { message: 'Logged out successfully' };
    },
  );
};
