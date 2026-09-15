---
phase: 01-foundation-desktop-week-grid
plan: "02"
subsystem: planning-ui
tags: [grid-layout, calendar, today-badge, navigation, tailwind]
status: checkpoint
completed_date: 2026-09-15
duration_minutes: 65
tasks_completed: 1
tasks_total: 2
files_created: []
files_modified:
  - src/app/(app)/planning/PlanningWeek.tsx
  - eslint.config.mjs
key_decisions:
  - "Merged shopping list button and week nav into single justify-between flex row (D-06)"
  - "overflow-x-auto on wrapper only; grid container and day column divs have no overflow modifier to preserve RecipeCombobox dropdown visibility"
  - "Column body div has identical className regardless of isToday — today distinction is header-only (D-03)"
  - "Added .claude/** to ESLint globalIgnores (pre-existing lint failure on gsd-core bin files)"
requires: [01-01-SUMMARY.md]
provides: [7-column grid layout, today badge, merged nav row]
affects: [src/app/(app)/planning/PlanningWeek.tsx]
tech_stack_added: []
tech_stack_patterns: [grid grid-cols-7, overflow-x-auto scroll wrapper, stone badge circle]
---

# Phase 01 Plan 02: Desktop Week Grid Layout Summary

**One-liner:** 7-column CSS grid replacing vertical day cards, with today badge header, abbreviated day labels, and shopping list button merged into the navigation row.

## Tasks

| # | Name | Status | Commit |
|---|------|--------|--------|
| 1 | Replace vertical layout with 7-column horizontal grid and merge navigation row | Complete | cb4b169 |
| 2 | Smoke test: verify 7-column grid, today badge, navigation, and all slot interactions | Pending — awaiting human verification | — |

## What Was Built

### Task 1 — Grid Layout Rewrite (cb4b169)

**PlanningWeek.tsx** rewritten with:

- **DSK-01**: `overflow-x-auto` wrapper div containing `grid grid-cols-7 min-w-[900px]` grid — 7 columns side by side on any viewport wider than 900px; horizontal scroll below that.
- **DSK-02 / D-01**: Each column header contains a date number span with `bg-stone-900 text-white rounded-full` when `isToday`, plain `text-stone-700` otherwise.
- **DSK-02 / D-02**: Day abbreviation span uses `text-stone-900 font-semibold` when `isToday`, `text-stone-400` otherwise.
- **D-03**: Column body div has a single fixed `className="flex flex-col gap-3 p-2"` — no conditional styling on the meal slots container.
- **SHR-01**: Each column maps `MEAL_TYPES` to render Midi and Soir slots.
- **SHR-02 / SHR-03**: `RecipeCombobox` and `Retirer` button preserved in each slot.
- **D-06 / SHR-04**: Single `justify-between flex` row: "Créer une liste de courses" button on the left, navigation controls (prev/label/next) on the right in a nested `flex items-center gap-4` div.
- **DSK-03 / D-07**: `canGoPrev = weekOffset > -4` / `canGoNext = weekOffset < 4` navigation limits unchanged.
- **D-05**: `Cette semaine` label when `weekOffset === 0`, `formatWeekLabel` range otherwise.

**eslint.config.mjs** — added `.claude/**` to `globalIgnores` to exclude gsd-core tooling bin files from ESLint (Rule 3 auto-fix: pre-existing lint failure blocked acceptance criteria verification).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added .claude/** to ESLint globalIgnores**
- **Found during:** Task 1 verification (`npm run lint`)
- **Issue:** ESLint scanned `.claude/gsd-core/bin/*.cjs` files which use CommonJS `require()` imports, triggering `@typescript-eslint/no-require-imports` errors. These are pre-existing tool files, not application code.
- **Fix:** Added `".claude/**"` to the `globalIgnores` array in `eslint.config.mjs`.
- **Files modified:** `eslint.config.mjs`
- **Commit:** cb4b169 (included in task commit)

## Verification Results

- `npm run build` — passes (TypeScript strict, no errors)
- `npm run lint` — passes from worktree context (0 errors, 2 pre-existing warnings: `_today` unused prop and ShoppingListDetail `useCallback` dep — both pre-existing, not introduced by this plan)

## Known Stubs

None — all slot interactions (add, remove, shopping list modal) are wired to existing server actions.

## Pending

Task 2 (checkpoint:human-verify) requires developer to open `http://localhost:3000/planning`, start the dev server, and confirm all 12 smoke-test checks pass.

## Self-Check: PASSED

- [x] `src/app/(app)/planning/PlanningWeek.tsx` exists and contains `grid grid-cols-7`
- [x] `eslint.config.mjs` contains `.claude/**` in globalIgnores
- [x] Commit cb4b169 exists: `git log --oneline | grep cb4b169`
