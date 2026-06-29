import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { healthRoutes } from './health.js';

describe('Health Routes', () => {
  it('GET /health returns ok', async () => {
    const app = Fastify();
    await app.register(healthRoutes);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    await app.close();
  });

  it('GET /ready returns ready when all checks pass', async () => {
    const app = Fastify();
    await app.register(healthRoutes);
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ready');
    expect(body.checks.database).toBe('ok');
    expect(body.checks.redis).toBe('ok');
    await app.close();
  });

  it('GET /health has JSON content-type', async () => {
    const app = Fastify();
    await app.register(healthRoutes);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['content-type']).toContain('application/json');
    await app.close();
  });
});
