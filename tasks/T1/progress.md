# T1: SG-006 Design Token + Tailwind Theme

## Status: Done

## Summary
Implemented complete design token system and Tailwind theme for ScriptGuard extension.

## What was done
- Updated `apps/extension/tailwind.config.ts` with all Wireframes §1 tokens:
  - CSS variable-based semantic colors (primary, background, foreground, muted, border, card)
  - Static status colors (success, warning, destructive, unknown)
  - Alert level colors (low, medium, high, critical)
  - Font families (sans, mono), font sizes (xs-3xl), font weights
  - Spacing scale (1-13: 4px-128px)
  - Border radius (sm, md, lg, xl)
  - Box shadows (sm, md, lg)
  - Transition timing and duration tokens

- Updated `apps/extension/styles/globals.css`:
  - Added CSS variables for --primary, --primary-foreground
  - Added CSS variables for --success, --warning, --destructive, --unknown
  - Added CSS variables for --alert-low/medium/high/critical
  - Added @media (prefers-color-scheme: dark) .dark selector for auto dark mode
  - Fixed badge component text colors to use direct color values

- Created `apps/extension/lib/tokens.ts`:
  - `getToken(name)` utility to read CSS variables at runtime
  - `isDarkMode()` helper
  - Exported all token constants (COLORS, FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, BOX_SHADOW, TRANSITION)

## Verification
- `npx tsc --noEmit`: 0 errors from new files (pre-existing errors in other files only)
- Committed: `ce6e328`
- Pushed to origin/main
- Issue #8 closed
- Project board status: Done

## Files touched
- `apps/extension/tailwind.config.ts`
- `apps/extension/styles/globals.css`
- `apps/extension/lib/tokens.ts` (new)
