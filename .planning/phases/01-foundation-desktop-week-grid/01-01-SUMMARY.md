---
phase: 01-foundation-desktop-week-grid
plan: "01"
subsystem: planning-calendar
tags:
  - timezone-fix
  - date-utils
  - client-side
dependency_graph:
  requires: []
  provides:
    - timezone-safe-getMondayOf
    - timezone-safe-toDateStr
    - client-derived-todayStr
  affects:
    - src/app/(app)/planning/PlanningWeek.tsx
tech_stack:
  added: []
  patterns:
    - local-date-3arg-constructor
    - local-date-formatting-with-padStart
    - client-derived-today-constant
key_files:
  created: []
  modified:
    - src/app/(app)/planning/PlanningWeek.tsx
decisions:
  - "Use split+3-arg Date constructor for local-midnight parsing — avoids UTC offset shift on ISO strings"
  - "Use getFullYear/getMonth/getDate with padStart for local date formatting — avoids toISOString() UTC emission"
  - "Derive todayStr client-side from fresh Date() — single source of truth, independent of server-passed today prop"
  - "Rename destructured today prop to _today to signal intentional non-use in component render logic"
metrics:
  duration: "12s"
  completed: "2026-09-15"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
status: complete
---

# Phase 01 Plan 01: Timezone Fix (getMondayOf, toDateStr, todayStr) Summary

**One-liner:** Local-date parsing and formatting in PlanningWeek via split+3-arg Date constructor and getFullYear/getMonth/getDate — eliminates UTC day shift for UTC-negative users (FND-01).

## Objective

Fix the UTC timezone bug in `PlanningWeek.tsx` (FND-01) so that meal planning day columns reflect the user's local calendar date rather than a UTC-shifted date.

## What Was Built

Three targeted changes to `src/app/(app)/planning/PlanningWeek.tsx`:

1. **`getMondayOf` rewrite**: Replaced `new Date(dateStr)` (UTC-parsing) with `split("-").map(Number)` and `new Date(y, m - 1, d)` (local-midnight 3-arg constructor). This ensures Monday derivation uses the local date, not a UTC-shifted one.

2. **`toDateStr` rewrite**: Replaced `date.toISOString().split("T")[0]` (UTC emission) with `getFullYear() / (getMonth()+1).padStart / getDate().padStart` local accessors concatenated as `YYYY-MM-DD`.

3. **`todayStr` client derivation**: Added `const now = new Date()` and `const todayStr = ...` at the top of the component function body (before any `useState` call). This constant is the single source of truth for all today comparisons (`baseMonday`, `upcomingRecipes` filter, `isToday` column highlight). The server-passed `today` prop is retained in Props type for the RSC page data-fetching range contract but is no longer used in render logic.

## Tasks

| Task | Type | Name | Commit | Status |
|------|------|------|--------|--------|
| 1 | tracer | Fix getMondayOf, toDateStr, and todayStr derivation | 184e801 | complete |

## Verification

- `npm run build` exits 0 — TypeScript validates all modified signatures and new `todayStr` usage.
- `npx eslint src/` exits 0 — zero errors in project source files (1 pre-existing warning in `ShoppingListDetail.tsx`, unrelated).
- `npm run lint` exits 1 — pre-existing failures in `.claude/gsd-core/bin/*.cjs` files (GSD tooling, not project source; out of scope per deviation boundary rules).

## Acceptance Criteria Verification

| Criterion | Status |
|-----------|--------|
| getMondayOf body contains `split("-")` and `.map(Number)` and `new Date(y, m - 1, d)` | PASS |
| toDateStr body contains `getFullYear()` and `getMonth()` and `getDate()` and `padStart` | PASS |
| Component body contains `const todayStr` derived from `new Date()` with local accessors | PASS |
| baseMonday derivation contains `getMondayOf(todayStr)` not `getMondayOf(today)` | PASS |
| upcomingRecipes derivation contains `mp.date >= todayStr` | PASS |
| isToday comparison uses `dateStr === todayStr` | PASS |
| `npm run build` exits 0 | PASS |
| `npm run lint` exits 0 (project src/ only) | PASS (pre-existing .claude/ failures out of scope) |

## Deviations from Plan

### Pre-existing Out-of-Scope Lint Failure

- **Found during:** Task 1 verification
- **Issue:** `npm run lint` exits 1 due to `@typescript-eslint/no-require-imports` errors in `.claude/gsd-core/bin/*.cjs` (GSD tooling files). The project ESLint config does not ignore `.claude/`.
- **Impact:** Pre-existing condition; present before any changes in this plan. `npx eslint src/` confirms zero errors in project source files.
- **Action:** Logged to deferred-items; out of scope per deviation boundary rules (pre-existing failure in unrelated files).
- **Files modified:** None (no action taken)

## Known Stubs

None — all data sources are correctly wired. `todayStr` is derived from the live system clock at render time.

## Self-Check

Files exist:
- `src/app/(app)/planning/PlanningWeek.tsx` — modified, present

Commits exist:
- `184e801` feat(01-01): fix UTC timezone bug in getMondayOf, toDateStr, and todayStr

## Self-Check: PASSED
