# ============================================
# ScriptGuard Runner - Playwright Worker
# ============================================
# Placeholder until runner implementation is ready

FROM mcr.microsoft.com/playwright:v1.45.0-jammy AS base

WORKDIR /app

# Create placeholder package
COPY <<EOF package.json
{
  "name": "@scriptguard/runner",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "worker": "node worker.js"
  }
}
EOF

# Create placeholder worker
COPY <<EOF worker.js
import { setTimeout } from 'node:timers/promises';

console.log('ScriptGuard Runner started (placeholder)');

while (true) {
  console.log('[runner] heartbeat - waiting for tasks...');
  await setTimeout(30_000);
}
EOF

USER pwuser

CMD ["node", "worker.js"]
