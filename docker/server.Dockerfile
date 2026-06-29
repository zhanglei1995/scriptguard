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

# Copy package manifests first for better layer caching
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/server/package.json ./apps/server/package.json

RUN pnpm install --frozen-lockfile

# Copy sources
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/server ./apps/server

# Build workspace dependencies explicitly; pnpm --filter does not implicitly build deps.
RUN pnpm --filter @scriptguard/shared build \
  && pnpm --filter @scriptguard/db build \
  && pnpm --filter @scriptguard/server build

# Stage 2: Runner
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Preserve workspace layout so pnpm's isolated node_modules symlinks remain valid.
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/apps/server ./apps/server

USER nodejs
WORKDIR /app/apps/server

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
