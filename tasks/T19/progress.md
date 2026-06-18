# T19 - SG-017: 6 类规则执行器（MVP 子集）

## 状态
✅ 完成

## 完成时间
2026-06-18

## 变更摘要

### 新增执行器
1. **`js_assertion`** (`executors/js-assertion.ts`)
   - 在页面上下文中执行 JS 表达式
   - 使用 `new Function()` 构造器，传入 document/window 参数
   - 返回 truthy/falsy 结果

2. **`console_clean`** (`executors/console-clean.ts`)
   - 检查 `capturedErrors` 中是否有 `error` 类型错误
   - 支持 `ignorePatterns` 忽略特定错误消息
   - 仅过滤 `type === 'error'`，不包含 `unhandledrejection`

3. **`duration`** (`executors/duration.ts`)
   - 通过 `performance.getEntriesByType('navigation')` 获取页面加载时间
   - 计算 `loadEventEnd - startTime` 与 `maxDuration` 阈值比较
   - 处理 performance API 不可用的情况

### 修改文件
- `types.ts`: RuleType 联合类型新增 `js_assertion | console_clean | duration`
- `index.ts`: 导出新增的 3 个执行器

### 测试
- 新增 `js-assertion.test.ts` (10 tests)
- 新增 `console-clean.test.ts` (9 tests)
- 新增 `duration.test.ts` (9 tests)
- 新增 `integration.test.ts` (17 tests) - 综合场景测试

## 测试结果
- 总计: 108 tests passed
- 所有执行器继承 BaseExecutor
- 性能: 单规则执行 < 100ms
- ESLint: 0 errors (2 warnings 来自 pre-existing files)

## Issue
- 关闭: #19 [SG-017]
- Project Status: Done
