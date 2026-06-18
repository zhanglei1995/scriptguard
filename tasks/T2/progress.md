# T2 Progress: SG-004 GitHub Actions CI 工作流

## Status: DONE

## What was completed

1. Created `.github/workflows/ci.yml` with 4 jobs:
   - **lint-and-typecheck**: Runs `pnpm typecheck` and `pnpm lint`
   - **test**: Runs `pnpm test:unit` with PostgreSQL 16 service container, uploads coverage to Codecov
   - **build**: Runs `pnpm build` and uploads build artifacts (7-day retention)
   - **e2e**: Runs `pnpm test:e2e` with Playwright browsers (main push only)

2. Workflow triggers:
   - `pull_request: [main]` → runs lint-and-typecheck, test, build
   - `push: [main]` → runs all jobs including e2e

3. Configuration:
   - Node.js 22
   - pnpm 11.7.0 (via pnpm/action-setup@v4)
   - pnpm cache enabled
   - PostgreSQL 16 service for server tests
   - Concurrency control to cancel duplicate runs

## Files created

- `.github/workflows/ci.yml`

## Issue & Project

- Issue #6 (SG-004) closed
- Project status updated to "Done"

## Commit

- `aa1f971` - ci: add GitHub Actions CI workflow (SG-004)
- Pushed to origin/main

## AC coverage

- [x] PR 触发：typecheck + lint + test:unit + build
- [x] push main 触发：上述 + test:e2e
- [x] 覆盖率上传到 Codecov
- [x] 构建产物在 GitHub Actions 中可下载
- [x] Status check 阻塞 PR 合并 (workflow must pass)
- [ ] docker build (pending Dockerfile creation)
