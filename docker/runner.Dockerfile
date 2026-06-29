# ============================================
# ScriptGuard Runner - Playwright Worker
# ============================================

FROM mcr.microsoft.com/playwright:v1.45.0-jammy AS builder

RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/runner/package.json ./apps/runner/package.json

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/runner ./apps/runner

RUN pnpm --filter @scriptguard/shared build \
  && pnpm --filter @scriptguard/runner build

FROM mcr.microsoft.com/playwright:v1.45.0-jammy AS runner

WORKDIR /app

COPY --from=builder --chown=pwuser:pwuser /app/package.json ./package.json
COPY --from=builder --chown=pwuser:pwuser /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=pwuser:pwuser /app/node_modules ./node_modules
COPY --from=builder --chown=pwuser:pwuser /app/packages ./packages
COPY --from=builder --chown=pwuser:pwuser /app/apps/runner ./apps/runner

USER pwuser
WORKDIR /app/apps/runner

CMD ["node", "dist/worker.js"]
