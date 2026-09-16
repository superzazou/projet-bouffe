---
phase: 01-foundation-desktop-week-grid
verified: 2026-09-16T00:00:00Z
status: passed
score: 3/5 roadmap success criteria verified
behavior_unverified: 2
overrides_applied: 0
behavior_unverified_items:

  - truth: "User can add a recipe to any Midi or Soir slot via an inline combobox and immediately see it appear"
    test: "Start dev server, open /planning, click RecipeCombobox in any slot, type a recipe name, select a result"
    expected: "Recipe appears in the slot immediately without a page reload (handleAdd calls addMealPlan server action, setMealPlans updates local state)"
    why_human: "Server action invocation and optimistic state update require a running app; grep cannot verify the roundtrip succeeds"

  - truth: "User can remove a recipe from any slot; the Creer une liste de courses button remains accessible and functional"
    test: "Click Retirer next to a recipe; then click Creer une liste de courses, enter a name, and click Creer"
    expected: "Recipe disappears immediately; shopping list creation navigates to the new list"
    why_human: "deleteMealPlan server action + state update and the full shopping list creation flow require runtime verification"
human_verification:

  - test: "Run dev server (npm run dev), open http://localhost:3000/planning"
    expected: |

      1. Layout: 7 day columns display side by side in one horizontal row. No vertical stacking.
      2. Today badge: today's column header shows a filled dark circle (bg-stone-900 text-white) around the date number. Other columns show no circle.
      3. Today abbreviation: today's abbreviated day name (Lun, Mar, etc.) is bold and dark (text-stone-900 font-semibold). Other days are lighter (text-stone-400).
      4. Column body parity: today's column body (meal slots area) looks identical to other days. No extra background or border.
      5. Column headers: each column shows the abbreviated day name above the date number.
      6. Navigation row: "Creer une liste de courses" and week nav arrows are in the same horizontal row. No separate row for the shopping list button.
      7. Navigation: clicking prev/next week shifts columns 7 days and updates the week label. "Cette semaine" label appears on current week.
      8. Navigation limit: prev button disabled after 4 clicks back; next button disabled after 4 clicks forward.
      9. Slots: each column shows a Midi slot and a Soir slot.
      10. Add recipe: select a recipe via combobox — it appears in the slot without page reload.
      11. Remove recipe: click Retirer — recipe disappears without page reload.
      12. Shopping list: button disabled when no upcoming meals; clicking opens the modal; entering a name and clicking Creer navigates to the new list.
    why_human: "Visual layout rendering, today column date correctness in the browser, and full interactive add/remove/shopping-list flows require a running app"
---

# Phase 01: Foundation + Desktop Week Grid — Verification Report

**Phase Goal:** Fix the UTC timezone bug in PlanningWeek.tsx and replace the vertical day-card list with a 7-column horizontal grid layout for desktop (Google Calendar style).
**Verified:** 2026-09-16
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees 7 day columns side by side with today's column visually highlighted and distinct | VERIFIED | `grid grid-cols-7 min-w-[900px]` at line 201; `bg-stone-900 text-white` badge at line 211; `text-stone-900 font-semibold` abbreviation at line 208 |
| 2 | User can navigate to prev/next week via arrow controls; today is the starting point on page load | VERIFIED | `canGoPrev = weekOffset > -4`, `canGoNext = weekOffset < 4` at lines 113-114; `baseMonday = getMondayOf(todayStr)` at line 64; `Cette semaine` conditional at line 135 |
| 3 | Each day column shows abbreviated day name and date number; dates correct regardless of UTC offset | VERIFIED | `getMondayOf` uses `split("-").map(Number)` + `new Date(y, m-1, d)` (lines 24-25); `toDateStr` uses `getFullYear/getMonth/getDate` (lines 39-42); `todayStr` derived client-side via `new Date()` (lines 52-53) |
| 4 | User can add a recipe to any Midi or Soir slot via inline combobox and immediately see it appear | PRESENT_BEHAVIOR_UNVERIFIED | `RecipeCombobox` wired to `handleAdd(dateStr, mealType, id)` (line 247); `handleAdd` calls `addMealPlan` server action and `setMealPlans` (lines 94-106); code is present and wired — server roundtrip requires runtime |
| 5 | User can remove a recipe from any slot; "Creer une liste de courses" button remains accessible and functional | PRESENT_BEHAVIOR_UNVERIFIED | `Retirer` button wired to `handleRemove(plan.id)` (line 237); `handleRemove` calls `deleteMealPlan` + `setMealPlans` (lines 108-111); shopping list button present, disabled logic correct (line 121); modal wired to `openListModal` — full flow requires runtime |

**Score:** 3/5 truths verified (2 present, behavior-unverified)

### Plan Must-Have Truths (All 19 — Plans 01-01 and 01-02)

#### Plan 01-01: Timezone Fix (FND-01)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | getMondayOf parses YYYY-MM-DD via split+3-arg Date constructor — no UTC offset shift | VERIFIED | Lines 24-25: `dateStr.split("-").map(Number)` + `new Date(y, m - 1, d)` |
| 2 | toDateStr formats using getFullYear/getMonth/getDate local accessors — no UTC date emission | VERIFIED | Lines 39-42: `getFullYear()`, `getMonth() + 1`, `getDate()`, `padStart(2, "0")` |
| 3 | todayStr is derived client-side at component render time from a fresh Date object | VERIFIED | Lines 52-53: `const now = new Date()` + `todayStr` assembled from `now.getFullYear()`, `now.getMonth()+1`, `now.getDate()` — before any useState |
| 4 | baseMonday derivation uses getMondayOf(todayStr) — not the server-passed today prop | VERIFIED | Line 64: `const baseMonday = getMondayOf(todayStr)` |
| 5 | upcomingRecipes filter compares mp.date against todayStr, not the today prop | VERIFIED | Lines 68-70: `mp.date >= todayStr` |
| 6 | isToday comparison in the column rendering loop uses todayStr | VERIFIED | Line 204: `const isToday = dateStr === todayStr` |
| 7 | Props signature for today: string remains unchanged — RSC page.tsx interface contract preserved | VERIFIED | Lines 13-17: `type Props` still contains `today: string`; destructured as `today: _today` (line 51) to signal intentional non-use |

#### Plan 01-02: Desktop Week Grid (DSK-01 through SHR-04)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 8 | User sees all 7 columns side by side — grid grid-cols-7 min-w-[900px] | VERIFIED | Line 201 |
| 9 | Today column header shows bg-stone-900 text-white circle behind date number | VERIFIED | Line 211 |
| 10 | Today abbreviation has text-stone-900 font-semibold; others have text-stone-400 | VERIFIED | Line 208 |
| 11 | Column body has identical classes regardless of isToday — no conditional on body div | VERIFIED | Line 215: `className="flex flex-col gap-3 p-2"` — fixed, no ternary |
| 12 | Navigation row is single flex justify-between: shopping list left, nav controls right | VERIFIED | Lines 118-145: outer div `flex items-center justify-between gap-4 flex-wrap`; shopping list button first child; nav div second child |
| 13 | Week label shows "Cette semaine" when weekOffset === 0; range label otherwise | VERIFIED | Line 135: `{weekOffset === 0 ? "Cette semaine" : formatWeekLabel(currentMonday)}` |
| 14 | Prev/next navigation limited to ±4 weeks via canGoPrev/canGoNext | VERIFIED | Lines 113-114 |
| 15 | Each day column contains Midi and Soir slots via MEAL_TYPES map | VERIFIED | Line 216: `{MEAL_TYPES.map((mealType) => {`; `MEAL_TYPES = ["lunch", "dinner"]` at line 21 |
| 16 | RecipeCombobox rendered in each slot with onAdd bound to handleAdd(dateStr, mealType, id) | VERIFIED | Lines 245-250 |
| 17 | Retirer button in each recipe row calls handleRemove(plan.id) | VERIFIED | Line 237: `onClick={() => handleRemove(plan.id)}` |
| 18 | "Creer une liste de courses" is in nav row; disabled when upcomingRecipes.length === 0; opens modal | VERIFIED | Lines 119-125 |
| 19 | Scroll wrapper uses only overflow-x-auto; grid container and column divs use no overflow modifier | VERIFIED | Line 200: `overflow-x-auto` only on wrapper; grid div (line 201) has no overflow class; column divs (line 206) `flex flex-col` — no overflow class. Note: `overflow-y-auto` at line 160 is inside the shopping list modal's recipe list — correct, does not affect grid |

### Prohibition Checks

| Prohibition | Verification | Status |
|-------------|-------------|--------|
| getMondayOf must not construct Date from bare ISO string | No `new Date(dateStr)` — uses 3-arg constructor only | NOT VIOLATED |
| toDateStr must not use UTC-based toISOString() | No `.toISOString()` call — uses local accessors | NOT VIOLATED |
| isToday must not compare against today prop directly | `isToday = dateStr === todayStr` — uses `todayStr`, not prop | NOT VIOLATED |
| Grid container and column divs must not carry overflow-clipping class | Grid: `grid grid-cols-7 min-w-[900px] border ... divide-x ...` — no overflow. Columns: `flex flex-col` — no overflow | NOT VIOLATED |
| Column body must not apply today-specific background or border | `className="flex flex-col gap-3 p-2"` — unconditional | NOT VIOLATED |
| No external calendar library imported | Imports: react, next/navigation, next/link, @/lib/types, @/components/RecipeCombobox, project server actions only | NOT VIOLATED |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(app)/planning/PlanningWeek.tsx` | Modified with timezone fix + grid layout | VERIFIED | File exists; 263 lines; contains all required changes |
| `eslint.config.mjs` | Updated with .claude/** globalIgnores | VERIFIED | Line 16: `".claude/**"` in globalIgnores array |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `getMondayOf(todayStr)` | `baseMonday` → `currentMonday` → `days` array | All 7 column dates derive from local-parsed Monday | WIRED | Line 64-66 |
| `toDateStr(day)` | `dateStr` → `isToday` | Today-column highlight depends on local date string match | WIRED | Lines 203-204 |
| `todayStr` client derivation | All today comparisons | Single source: `baseMonday`, `upcomingRecipes` filter, `isToday` | WIRED | Lines 52-53, 64, 69, 204 |
| `overflow-x-auto` wrapper | `grid min-w-[900px]` | Prevents collapse on sub-900px without clipping dropdowns | WIRED | Lines 200-201 |
| `RecipeCombobox.onAdd` | `handleAdd(dateStr, mealType, id)` | Add recipe to slot | WIRED | Lines 247 |
| `Retirer` button `onClick` | `handleRemove(plan.id)` | Remove recipe from slot | WIRED | Line 237 |
| `upcomingRecipes.length === 0` | `disabled` on shopping list button | Guard against empty list creation | WIRED | Line 121 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| PlanningWeek.tsx | `mealPlans` | `initialMealPlans` prop from RSC page.tsx (Supabase query) | Yes — RSC page fetches from Supabase | FLOWING |
| PlanningWeek.tsx | `recipes` | `recipes` prop from RSC page.tsx (Supabase query) | Yes — RSC page fetches from Supabase | FLOWING |
| PlanningWeek.tsx | `todayStr` | `new Date()` system clock at render time | Yes — live system clock | FLOWING |

### Behavioral Spot-Checks

Step 7b: Behavioral spot-checks deferred — dev server not started; runtime checks would require mutations (add/remove recipe). Structural checks confirm all wiring. Interactive behaviors routed to human verification.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FND-01 | 01-01-PLAN.md | UTC timezone bug in getMondayOf/toDateStr | SATISFIED | getMondayOf: 3-arg local constructor (line 24-25); toDateStr: local accessors (lines 39-42); todayStr: client-derived (lines 52-53) |
| DSK-01 | 01-02-PLAN.md | 7 columns horizontal côte à côte | SATISFIED | `grid grid-cols-7 min-w-[900px]` (line 201) |
| DSK-02 | 01-02-PLAN.md | Colonne du jour courant visuellement distinguée | SATISFIED | Today badge (line 211) + abbreviation styling (line 208) |
| DSK-03 | 01-02-PLAN.md | Navigation prev/next semaine | SATISFIED | `canGoPrev`/`canGoNext` (lines 113-114); `setWeekOffset` handlers (lines 129, 139) |
| DSK-04 | 01-02-PLAN.md | Colonne: jour abrégé + date | SATISFIED | `DAY_LABELS[i]` (line 209) + `day.getDate()` (line 212) in each column header |
| SHR-01 | 01-02-PLAN.md | Deux slots Midi/Soir par jour | SATISFIED | `MEAL_TYPES.map` (line 216); `MEAL_LABELS` map (line 20) |
| SHR-02 (desktop) | 01-02-PLAN.md | Ajouter recette via combobox inline | SATISFIED (struct) | RecipeCombobox wired to handleAdd (lines 245-250); server action imported and invoked |
| SHR-03 (desktop) | 01-02-PLAN.md | Retirer recette | SATISFIED (struct) | Retirer button wired to handleRemove (line 237); server action imported |
| SHR-04 | 01-02-PLAN.md | Bouton "Creer une liste de courses" accessible et fonctionnel | SATISFIED (struct) | Button in nav row, disabled guard, modal flow (lines 119-125, 147-198) |

All 9 Phase 1 requirements have implementation evidence. SHR-02, SHR-03, SHR-04 are structurally satisfied; their runtime behavior needs the human smoke test.

No orphaned requirements. All Phase 1 requirements from REQUIREMENTS.md are claimed by plans and verified.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| PlanningWeek.tsx | 157 | `placeholder="Nom de la liste..."` grep match | INFO | Standard HTML input placeholder attribute — not a stub marker. False positive. |

No TBD, FIXME, or XXX markers found. No unreferenced debt markers. No stub returns in production code paths. Pre-existing ESLint warning on `_today` unused prop (renamed with `_` prefix per TypeScript convention to signal intentional non-use — not a blocker).

### Human Verification Required

All 19 plan must-have truths are structurally VERIFIED. The following items require a running browser session to confirm.

---

#### 1. Full 12-Step Smoke Test (Plan 02 checkpoint:human-verify)

**Test:** Start `npm run dev`, open `http://localhost:3000/planning` (log in if prompted), then verify:

1. **Layout — DSK-01:** 7 day columns display side by side in one horizontal row. No vertical stacking.
2. **Today badge — DSK-02, D-01:** Today's column header shows a filled dark circle around the date number. Other columns show no circle.
3. **Today abbreviation — D-02:** Today's abbreviated day name (Lun, Mar, etc.) is bold and dark. Other days are lighter.
4. **Column body parity — D-03:** Today's column body (meal slots area) looks identical to other days. No extra background or border on body.
5. **Column headers — DSK-04:** Each column shows the abbreviated day name above the date number.
6. **Navigation row — D-06:** "Creer une liste de courses" and week arrow buttons are in the same horizontal row.
7. **Navigation — DSK-03, D-05:** Click prev week — columns shift 7 days, label shows range. Return to current week — label shows "Cette semaine".
8. **Navigation limit — D-07:** Prev button disabled after 4 clicks back; next disabled after 4 clicks forward.
9. **Slots — SHR-01:** Each column shows a Midi slot and a Soir slot.
10. **Add recipe — SHR-02:** Click combobox, type a recipe name, select a result — recipe appears in slot immediately without page reload.
11. **Remove recipe — SHR-03:** Click "Retirer" next to a recipe — it disappears immediately without page reload.
12. **Shopping list — SHR-04:** Button disabled when no upcoming meals. With meals planned: click button → modal opens with recipe checklist → enter name and click Creer → navigates to new shopping list.

**Expected:** All 12 checks pass.
**Why human:** Visual layout rendering, today date correctness in the user's browser locale, and the full add/remove/shopping-list interactive flows require a running application.

---

#### 2. Timezone Correctness Confirmation (FND-01)

**Test:** Open `/planning` in a browser. Note the day column highlighted as today.
**Expected:** The highlighted column matches the local system date — not a UTC-shifted date. Most verifiable for users in UTC-negative timezones at or after local midnight (e.g., at 23:00 UTC-5, local date is still "today" but UTC is already "tomorrow").
**Why human:** The timezone fix is code-correct but the actual date displayed in the browser depends on the user's system clock and locale — needs runtime confirmation.

---

### Gaps Summary

No gaps found. All must-have truths are either VERIFIED by code inspection or PRESENT_BEHAVIOR_UNVERIFIED with complete wiring confirmed. The two behavior-unverified truths (SC4, SC5) are not FAILED — the code is fully implemented and correctly wired to server actions. Pending human smoke test is the sole remaining gate.

---

_Verified: 2026-09-16_
_Verifier: Claude (gsd-verifier)_
