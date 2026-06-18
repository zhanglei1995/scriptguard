# SG-015: 用户脚本注入与执行

## Status: DONE

## Summary
Implemented script injection orchestration (ScriptRunner) and rule engine (RuleEngine) for the content script layer.

## What was delivered

### New files
- `apps/extension/content/script-runner.ts` — ScriptRunner: lifecycle-aware script injection with timeout protection, error logging, and automatic rule execution
- `apps/extension/content/rule-engine.ts` — Simplified rule engine supporting selector_exists, selector_visible, text_content, url_match rules
- `apps/extension/content/__tests__/script-runner.test.ts` — 11 tests covering all runAt timings, timeout, error recording, rule execution
- `apps/extension/content/__tests__/rule-engine.test.ts` — 22 tests covering all rule types and multi-rule combinations

### Modified files
- `apps/extension/content/index.ts` — Refactored bootstrap to use ScriptRunner, separates immediate/deferred scripts by runAt timing
- `apps/extension/storage/schemas.ts` — Added 'manual' to RunAt enum
- `apps/extension/vitest.config.ts` — Fixed ~ alias resolution for vitest
- `apps/extension/vitest.setup.ts` — Added chrome.runtime mock

## Test results
- 157 tests passing (33 new for SG-015)
- All existing tests unaffected

## Git
- Commit: `feat(extension): implement script injection and rule execution (SG-015)`
- Pushed to origin/main
- Issue #17 closed
