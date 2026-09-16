---
phase: 02-mobile-day-view-swipe-navigation
plan: "02"
subsystem: planning
tags: [mobile, bottom-sheet, recipe-add, touch, responsive]
dependency_graph:
  requires: [02-01]
  provides: [MOB-04, SHR-02-mobile]
  affects: [src/app/(app)/planning/PlanningWeek.tsx]
tech_stack:
  added: []
  patterns: [bottom-sheet-overlay, backdrop-tap-dismiss, savingKey-guard]
key_files:
  created: []
  modified:
    - src/app/(app)/planning/PlanningWeek.tsx
decisions:
  - "'+' button uses onClick (not onTouchEnd) to avoid conflict with imperative swipe handler on parent div"
  - "bottomSheet state cleared inside RecipeCombobox onAdd callback immediately after handleAdd — no delay"
  - "savingKey guard disables RecipeCombobox and '+' button while handleAdd is in-flight (T-02-05 mitigation)"
  - "Dismiss button labelled 'Fermer' not 'Annuler' — per UI-SPEC copywriting contract approved 2026-09-16"
  - "No swipe-down gesture to close bottom sheet — conflicts with day swipe navigation (D-08)"
  - "Plan 01 work implemented alongside Plan 02 — Plan 01 was not executed before wave 2 was launched; both plans implemented atomically in a single commit"
metrics:
  duration_minutes: 12
  completed_date: "2026-09-16"
  tasks_completed: 1
  tasks_total: 2
  files_changed: 1
status: complete
---

# Phase 02 Plan 02: Bottom Sheet Recipe Add Summary

Mobile recipe add flow via bottom sheet overlay with RecipeCombobox — completes Phase 2 MOB-04 and SHR-02 (mobile). Also includes Plan 01 mobile shell work (MOB-01, MOB-02, MOB-03, SHR-03) which was absent from the worktree base when this agent was spawned.

## What Was Built

### Plan 01 work (prerequisite, included in this commit)

Plan 01 was not executed before this wave was launched. The mobile shell was implemented as part of this plan:

- `selectedDay`, `bottomSheet`, `deletingKey` state declarations
- `selectedDayRef`, `weekOffsetRef`, `dayContentRef` stale-closure refs with sync effects
- `formatDayHeading` fr-FR locale helper (e.g. "Mercredi 16 septembre")
- Imperative `touchstart`/`touchmove`/`touchend` swipe handler (`{ passive: false }` on touchmove, 30px threshold, axis lock, week boundary navigation)
- Updated `handleRemove` with `deletingKey` guard (prevents double-tap race)
- Mobile layout branch (`block md:hidden`): 7-pill week strip, day heading, day content div (swipe target), Midi/Soir slot sections with recipe rows + Retirer, "Créer une liste de courses" CTA
- Desktop layout branch (`hidden md:block`) wrapping existing nav header + 7-column grid

### Plan 02 work (this plan's objective)

- Per-slot `+` button (`onClick` → `setBottomSheet({ date: selectedDay, mealType })`, `disabled={savingKey}`)
- Bottom sheet backdrop: `fixed inset-0 z-40 bg-black/40` with `onClick` close
- Bottom sheet panel: `fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl` with max-h-[80vh]
- Sheet header: "Ajouter un repas" + `×` close button (w-11 h-11 touch target)
- `RecipeCombobox` wired with `onAdd` callback calling `handleAdd` then `setBottomSheet(null)`
- "Fermer" dismiss button at bottom of panel
- Desktop "Retirer" button updated with `disabled={deletingKey === plan.id}` for consistency (T-02-01 mitigation)

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Plan 01 + Plan 02 (atomic) | e288123 | src/app/(app)/planning/PlanningWeek.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan 01 mobile shell missing from worktree base**
- **Found during:** Task 1 setup — PlanningWeek.tsx had no mobile code, 02-01-SUMMARY.md absent
- **Issue:** Wave 2 was spawned before Plan 01 work was merged into the worktree base commit
- **Fix:** Implemented Plan 01's complete mobile shell (state/refs/effects/layout/swipe handler) alongside Plan 02's bottom sheet additions in a single atomic commit
- **Files modified:** src/app/(app)/planning/PlanningWeek.tsx
- **Commit:** e288123

## Verification

- `npm run lint` — exits 0 (0 errors, 2 pre-existing warnings: `_today` unused param + ShoppingListDetail useCallback dep)
- `npm run build` — exits 0, all 9 routes compile successfully
- Automated acceptance criteria (grep checks) — all 17 checks passed

## Awaiting Human Checkpoint

**Task 2 (checkpoint:human-verify, gate: blocking)** — Manual verification of all 6 Phase 2 requirements on Chrome DevTools iPhone 12 Pro emulation. Not yet performed. See 02-02-PLAN.md Task 2 for full verification steps.

Requirements to verify: MOB-01, MOB-02, MOB-03, MOB-04, SHR-02 (mobile), SHR-03 (mobile), desktop non-regression.

## Known Stubs

None — all data is wired from real state (mealPlans, recipes, selectedDay, bottomSheet). No hardcoded empty values or placeholder text in the new mobile additions.

## Threat Flags

No new security surface beyond what the plan's threat model covers. All T-02-05 through T-02-08 mitigations are in place:
- T-02-05: `savingKey` guard on '+' button and RecipeCombobox `disabled` prop
- T-02-07: `auth.getUser()` enforced in `addMealPlan` server action (unchanged from Phase 1)

## Self-Check: PASSED

- [x] `src/app/(app)/planning/PlanningWeek.tsx` — modified and committed
- [x] Commit e288123 exists in git log
- [x] `npm run build` exits 0
- [x] All grep acceptance criteria pass
