FROM mcr.microsoft.com/playwright:v1.45.0-jammy

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/runner/package.json apps/runner/

RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY apps/runner/ apps/runner/

RUN pnpm --filter @scriptguard/shared build
RUN pnpm --filter @scriptguard/runner build

WORKDIR /app/apps/runner

CMD ["node", "dist/worker.js"]
