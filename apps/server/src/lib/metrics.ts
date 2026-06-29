/**
 * Prometheus Metrics
 * 关联: TDD §12.4
 *
 * 队列深度、HTTP 请求延迟、测试运行延迟等指标。
 */
import { Registry, Gauge, Histogram, Counter } from 'prom-client';
import { getQueueStats } from './queue.js';

export const register = new Registry();

// --- HTTP Request Metrics ---

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// --- Queue Metrics ---

export const queueDepth = new Gauge({
  name: 'bullmq_queue_depth',
  help: 'BullMQ queue depth by state',
  labelNames: ['queue', 'state'],
  registers: [register],
});

// --- Test Run Metrics ---

export const testRunDuration = new Histogram({
  name: 'test_run_duration_seconds',
  help: 'Test run duration in seconds',
  labelNames: ['status'],
  buckets: [1, 5, 10, 30, 60, 120],
  registers: [register],
});

export const testRunTotal = new Counter({
  name: 'test_runs_total',
  help: 'Total number of test runs',
  labelNames: ['status'],
  registers: [register],
});

// --- Queue Stats Collector ---

export async function collectQueueMetrics(): Promise<void> {
  try {
    const stats = await getQueueStats();
    const states = ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'] as const;
    for (const state of states) {
      queueDepth.set({ queue: 'test-runs', state }, stats[state] ?? 0);
    }
  } catch {
    // Redis not available
  }
}

// --- Periodic Collection ---

let collectInterval: ReturnType<typeof setInterval> | null = null;

export function startMetricsCollection(intervalMs = 15000): void {
  collectQueueMetrics();
  collectInterval = setInterval(collectQueueMetrics, intervalMs);
}

export function stopMetricsCollection(): void {
  if (collectInterval) {
    clearInterval(collectInterval);
    collectInterval = null;
  }
}
