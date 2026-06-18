# SG-016: Rule Executor Interface and Base Class

## Status: DONE

## Summary
Refactored the rule engine into a modular architecture with proper interfaces, abstract base class, and executor pattern.

## Files Created/Modified

### New Files
- `rules/types.ts` - All interfaces (CheckRule, ExecutionContext, RuleResult, RuleExecutor, etc.)
- `rules/base.ts` - BaseExecutor abstract class with timing, timeout, and error handling
- `rules/registry.ts` - Executor registry for type → executor mapping
- `rules/engine.ts` - RuleEngine class with executeAll() method
- `rules/context.ts` - Default ExecutionContext factory
- `rules/index.ts` - Module exports
- `rules/executors/selector-exists.ts` - SelectorExistsExecutor
- `rules/executors/selector-visible.ts` - SelectorVisibleExecutor
- `rules/executors/text-content.ts` - TextContentExecutor
- `rules/executors/url-match.ts` - UrlMatchExecutor
- `rules/__tests__/base.test.ts` - BaseExecutor tests (8 tests)
- `rules/__tests__/registry.test.ts` - Registry tests (11 tests)
- `rules/__tests__/selector-exists.test.ts` - SelectorExistsExecutor tests (6 tests)
- `rules/__tests__/selector-visible.test.ts` - SelectorVisibleExecutor tests (6 tests)
- `rules/__tests__/text-content.test.ts` - TextContentExecutor tests (13 tests)
- `rules/__tests__/url-match.test.ts` - UrlMatchExecutor tests (11 tests)
- `rules/__tests__/engine.test.ts` - RuleEngine tests (8 tests)

### Modified Files
- `content/rule-engine.ts` - Updated to proxy to new rules/ module while maintaining backward-compatible API

## Test Results
- rules/__tests__/ - 63 tests passed
- content/__tests__/rule-engine.test.ts - 22 tests passed (backward compatibility verified)

## Architecture
```
RuleEngine
  ├── executor/
  │   ├── SelectorExistsExecutor
  │   ├── SelectorVisibleExecutor
  │   ├── TextContentExecutor
  │   └── UrlMatchExecutor
  ├── combinator/   (future: AND/OR logic)
  └── reporter/     (future: result aggregation)
```

## Key Design Decisions
1. **Backward Compatibility**: Existing `executeRules()` function signature unchanged
2. **BaseExecutor**: Subclasses only implement `evaluate()` method
3. **Registry Pattern**: Type-safe executor registration and lookup
4. **Timeout Handling**: Built into BaseExecutor with AbortSignal support

## Verification
- All new tests pass
- Existing tests pass (backward compatibility confirmed)
- TypeScript compilation successful (pre-existing errors unrelated to this change)
