import Fastify, { type FastifyInstance } from 'fastify';
import { vi } from 'vitest';
import { z } from 'zod';
import errorHandlerPlugin from '../../../plugins/error-handler.js';

function isZodSchema(val: unknown): val is z.ZodType {
  return val !== null && typeof val === 'object' && '_def' in (val as Record<string, unknown>);
}

function createChain(defaultResult: unknown[] = []) {
  let result: unknown = defaultResult;
  const chain: Record<string, unknown> = {};
  const methods = ['from', 'where', 'limit', 'offset', 'orderBy', 'values', 'set', 'innerJoin'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.returning = vi.fn().mockImplementation((r?: unknown) => {
    if (r !== undefined) result = r;
    return Promise.resolve(Array.isArray(result) ? result : [result]);
  });
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    return Promise.resolve(Array.isArray(result) ? result : [result]).then(resolve, reject);
  };
  return chain;
}

export const mockDb = {
  select: vi.fn(() => createChain()),
  insert: vi.fn(() => createChain()),
  update: vi.fn(() => createChain()),
  delete: vi.fn(() => createChain()),
  transaction: vi.fn(async (cb: (tx: typeof mockDb) => Promise<unknown>) => cb(mockDb)),
};

export function resetMocks() {
  vi.clearAllMocks();
  mockDb.select.mockImplementation(() => createChain());
  mockDb.insert.mockImplementation(() => createChain());
  mockDb.update.mockImplementation(() => createChain());
  mockDb.delete.mockImplementation(() => createChain());
  mockDb.transaction.mockImplementation(async (cb: (tx: typeof mockDb) => Promise<unknown>) =>
    cb(mockDb),
  );
}

export function mockDbResult(result: unknown) {
  const chain = createChain(Array.isArray(result) ? result : [result]);
  mockDb.select.mockImplementation(() => chain);
  mockDb.insert.mockImplementation(() => chain);
  mockDb.update.mockImplementation(() => chain);
  mockDb.delete.mockImplementation(() => chain);
  return chain;
}

vi.mock('../../../lib/db.js', () => ({ db: mockDb }));

export async function buildTestApp(
  registerRoutes: (app: FastifyInstance) => Promise<void>,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(({ schema, httpPart }) => {
    return (data) => {
      if (httpPart === 'response') return { value: data };
      if (isZodSchema(schema)) {
        try {
          return { value: schema.parse(data) };
        } catch (err) {
          return { error: err as Error };
        }
      }
      return { value: data };
    };
  });
  app.setSerializerCompiler(() => (data) => JSON.stringify(data));
  await app.register(errorHandlerPlugin);
  await registerRoutes(app);
  await app.ready();
  return app;
}

export async function buildTestAppWithAuth(
  registerRoutes: (app: FastifyInstance) => Promise<void>,
  userId = '00000000-0000-0000-0000-000000000001',
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(({ schema, httpPart }) => {
    return (data) => {
      if (httpPart === 'response') return { value: data };
      if (isZodSchema(schema)) {
        try {
          return { value: schema.parse(data) };
        } catch (err) {
          return { error: err as Error };
        }
      }
      return { value: data };
    };
  });
  app.setSerializerCompiler(() => (data) => JSON.stringify(data));
  app.addHook('onRequest', async (req) => {
    (req as { userId?: string }).userId = userId;
  });
  await app.register(errorHandlerPlugin);
  await registerRoutes(app);
  await app.ready();
  return app;
}

export async function buildTestAppWithSwagger(
  registerRoutes: (app: FastifyInstance) => Promise<void>,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(({ schema }) => {
    return (data) => {
      try {
        if (isZodSchema(schema)) {
          return { value: schema.parse(data) };
        }
        return { value: data };
      } catch (err) {
        return { error: err as Error };
      }
    };
  });
  const swagger = (await import('@fastify/swagger')).default;
  const { zodToJsonSchema: zts } = await import('zod-to-json-schema');
  await app.register(swagger, {
    openapi: { info: { title: 'Test', version: '0.0.1' } },
    transform: ({ schema, url }) => {
      if (!schema || typeof schema !== 'object') return { schema, url };
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
        if (key === 'response' && typeof value === 'object' && value !== null) {
          const respObj = value as Record<string, unknown>;
          const converted: Record<string, unknown> = {};
          for (const [status, s] of Object.entries(respObj)) {
            converted[status] = isZodSchema(s)
              ? zts(s as z.ZodType, { target: 'openApi3', $refStrategy: 'none' })
              : s;
          }
          out.response = converted;
        } else if (['body', 'params', 'querystring', 'query'].includes(key)) {
          out[key] = isZodSchema(value)
            ? zts(value as z.ZodType, { target: 'openApi3', $refStrategy: 'none' })
            : value;
        } else {
          out[key] = value;
        }
      }
      return { schema: out as import('fastify').FastifySchema, url };
    },
  });
  await app.register(errorHandlerPlugin);
  await registerRoutes(app);
  await app.ready();
  return app;
}
