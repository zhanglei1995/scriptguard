# T7 Progress: SG-012 Content Script Injection Framework

## Status: DONE

## What was implemented

### New files
- `content/error-capture.ts` — MAIN world error capture script (<1KB). Captures `error` and `unhandledrejection` events, sends via `window.postMessage` to ISOLATED world.
- `content/injector.ts` — User script injector for MAIN world with timeout protection (default 10s). Wraps code in try/catch, uses `<script>` tag injection + postMessage communication.

### Modified files
- `content/index.ts` — Full rewrite: PlasmoCSConfig (document_start, ISOLATED), capturePageError at earliest moment, bootstrap() fetching matched scripts via GET_SCRIPTS_FOR_URL, injectAndRun() with timeout/error tracking, REPORT_CHECK reporting.
- `lib/checks.ts` — capturePageError now injects MAIN world error capture + listens for postMessage. startCheck sends REPORT_CHECK to background.
- `background/router.ts` — GET_SCRIPTS_FOR_URL now reads from chrome.storage.local and filters by matchRules (glob/regex/exact). Added StoredScript, MatchRule types and matchUrl function.

### Tests (26 passing)
- `content/__tests__/error-capture.test.ts` — 10 tests: script size <1KB, isPageError type guard, injectErrorCapture DOM manipulation
- `content/__tests__/injector.test.ts` — 7 tests: success/error/timeout flows, wrong script ID filtering, script element creation
- `content/__tests__/url-match.test.ts` — 7 tests: glob/regex/exact matching, empty rules, invalid regex

## AC verification
- [x] Content Script at document_start ✓
- [x] Error capture <1KB ✓ (verified in tests)
- [x] ISOLATED ↔ MAIN world communication ✓ (postMessage bridge)
- [x] Timeout protection (10s default, configurable) ✓
- [x] chrome.runtime.sendMessage for URL matching ✓
- [x] REPORT_CHECK reporting ✓

## Commit
`54cb052` feat(extension): implement Content Script injection framework (SG-012)

## Known pre-existing issues
- `~/*` path alias not resolved by `tsc --noEmit` (affects popup, lib/tab too). Plasmo bundler resolves at build time.
