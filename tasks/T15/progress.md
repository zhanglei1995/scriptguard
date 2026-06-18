# T15: SG-014 脚本 CRUD（本地）

## Status: Done

## Summary
实现 ScriptGuard 浏览器扩展的本地脚本 CRUD 功能，基于 Zustand + persist 中间件。

## Changes

### 1. `apps/extension/storage/schemas.ts`
- 扩展 Script schema（ScriptCurrent）增加字段：
  - `description: string`
  - `code: string`
  - `matchRules: string[]`
  - `runAt: 'document_idle' | 'document_start' | 'document_end'`
  - `enabled: boolean`
  - `tags: string[]`
  - `groupId: string | null`
  - `config: Record<string, unknown>`
  - `createdAt: number`
  - `updatedAt: number`
- 添加 V3 migration 支持旧数据迁移

### 2. `apps/extension/store/scripts.ts` (新建)
- Zustand store + persist 中间件
- persist 到 `chrome.storage.local`（key: `sg-scripts`）
- State: `scripts: Script[]`, `filter: ScriptFilter`
- Actions:
  - `createScript(input)`: 生成 UUID，设置时间戳，Zod 校验后写入
  - `updateScript(id, patch)`: 合并 patch，更新 updatedAt
  - `deleteScript(id)`: 删除脚本
  - `enableScript(id)` / `disableScript(id)`
  - `getScript(id)`: 返回单个脚本
  - `getFilteredScripts()`: 按 filter 过滤 + updatedAt desc 排序
  - `setFilter(filter)`: 设置过滤条件

### 3. `apps/extension/store/index.ts` (新建)
- 统一导出 store

### 4. 测试修复
- `storage/__tests__/chrome.test.ts`: 更新测试数据匹配新 schema
- `storage/__tests__/schemas.test.ts`: 更新测试验证 V3 migration

## Test Results
- 70 tests passed (21 new store tests + 49 existing)
- ESLint: 0 errors (only pre-existing warnings)

## Commits
- `feat(extension): implement local scripts CRUD (SG-014)`

## Related
- Issue: #16 (closed)
