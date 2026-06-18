# T25 — SG-021: 手动测试功能

## §1 What was done
Implemented manual test functionality for ScriptGuard browser extension.

## §2 Subagent intent
Implement SG-021 acceptance criteria: popup test button, background check execution, content script rule evaluation, IndexedDB persistence, and result display with error overlay.

## §3 Files touched
- `apps/extension/background/check-runner.ts` — New CheckRunner class
- `apps/extension/background/__tests__/check-runner.test.ts` — Unit tests
- `apps/extension/background/router.ts` — Added RUN_MANUAL_CHECK handler
- `apps/extension/content.ts` — Added RUN_CHECK handler with rule execution
- `apps/extension/popup.tsx` — Updated UI for test results and error overlay
- `apps/extension/popup/hooks.ts` — Enhanced useTestRunner hook with full state management
- `apps/extension/vitest.setup.ts` — Added chrome.scripting and tabs.sendMessage mocks

## §4 What changed
- `check-runner.ts`: New file — CheckRunner class that orchestrates manual checks by getting active tab, fetching matched scripts, sending RUN_CHECK to content script, and writing results to IndexedDB
- `router.ts`: Added RUN_MANUAL_CHECK message type and handler that delegates to CheckRunner
- `content.ts`: Added RUN_CHECK message listener that executes rules and returns results
- `hooks.ts`: Rewrote useTestRunner to support idle/running/completed/failed states with full result data
- `popup.tsx`: Added TestResultSummary, ResultDetail, ErrorOverlay components; updated footer buttons
- `vitest.setup.ts`: Added chrome.scripting.executeScript and chrome.tabs.sendMessage mocks

## §5 Test results
- 279 tests pass (28 test files)
- 5 new tests for CheckRunner (no active tab, no URL, no matched scripts, unreachable content script, successful check)

## §6 Issues/blockers
None

## §7 Git
- Commit: `feat(extension): implement manual test functionality (SG-021)` (d65984e)
- Pushed to origin/main
- Issue #23 closed
- tickets/SG-021.md status updated to done
