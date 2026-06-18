# T21: SG-018 Popup 页面 MVP

## Status: Done

## Summary
Implemented Popup page MVP with Tailwind CSS + shadcn/ui components, custom hooks, and 9 unit tests.

## Changes
- **popup.tsx**: Rewritten from inline styles to Tailwind CSS classes using shadcn/ui Button, Badge, Card components. Fixed 380x500px window.
- **popup/hooks.ts**: Created `useCurrentTab()`, `useMatchedScripts()`, `useTestRunner()`, `formatRelativeTime()`.
- **popup/__tests__/popup.test.tsx**: 9 unit tests covering loading state, URL display, empty state, script list, button interactions, truncation, and edge cases.
- **vitest.config.ts**: Added `@/` alias for shadcn/ui component imports.
- **vitest.setup.ts**: Added `chrome.tabs` and `chrome.runtime.openOptionsPage` mocks.

## Features (AC met)
- [x] 380x500px fixed window
- [x] Current URL display (domain + truncated path, max 40 chars)
- [x] Matched script list with status badge + version + relative time
- [x] "立即测试" button sends RUN_CHECK to background
- [x] "打开后台" opens options page
- [x] Empty state with guidance
- [x] Bottom tab bar (notifications, reports, settings)
- [x] Offline ready (no external dependencies)

## Tests
- 9/9 popup tests pass
- 274/274 full test suite passes

## Commit
`9ab916e` - feat(extension): implement Popup page MVP (SG-018)
Pushed to origin/main. Issue #20 closed.
