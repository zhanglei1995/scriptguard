# ============================================
# ScriptGuard Server - Multi-stage Docker Build
# ============================================

# Stage 1: Builder
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy package sources
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy package source code
COPY packages/shared/ ./packages/shared/
COPY packages/db/ ./packages/db/
COPY apps/server/ ./apps/server/

# Build server
RUN pnpm --filter @scriptguard/server build

# Stage 2: Runner
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built output and dependencies
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/node_modules ./node_modules

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
