# Phase 1: Foundation + Desktop Week Grid - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the existing vertical day-card list (`PlanningWeek.tsx`) with a 7-column horizontal grid for desktop. Fix the UTC timezone bug in date utilities as the first task — all date-rendering depends on it. Phase 1 is desktop only; the mobile layer is added in Phase 2.

**In scope:**
- FND-01: Fix timezone bug in `getMondayOf` / `toDateStr` (UTC parsing/formatting → local date parts)
- DSK-01: 7-column horizontal grid replacing vertical list
- DSK-02: Today's column visually distinguished (header treatment)
- DSK-03: Prev/next week navigation (already exists — preserve behavior)
- DSK-04: Day abbreviation + date number in each column header
- SHR-01: Two slots per day (Midi / Soir) on both views
- SHR-02 (desktop): Inline `RecipeCombobox` for adding a recipe
- SHR-03 (desktop): Remove recipe from slot
- SHR-04: "Créer une liste de courses" button stays accessible and functional

**Out of scope:**
- Mobile view — Phase 2
- v2 polish (PLH-01 "Aujourd'hui" button, PLH-02 faded past days, PLH-03 dot indicators)
- Drag & drop, monthly view, thumbnail images

</domain>

<decisions>
## Implementation Decisions

### Aujourd'hui highlight
- **D-01:** Badge on the date number — `bg-stone-900 text-white` circle behind the day number, header cell only. No background tint on the column body. Style inspired by Google Calendar.
- **D-02:** Day abbreviation label (e.g. "Lun") for today uses `text-stone-900 font-semibold`; other days use `text-stone-400` (dimmer). Consistent with current approach.
- **D-03:** Column body (meal slots) has no special visual treatment for today — header distinction alone is sufficient.

### Navigation controls
- **D-04:** Navigation bar stays as a dedicated row above the grid (same structure as current). No integration into the column header row.
- **D-05:** Week label format unchanged — "Cette semaine" when `weekOffset === 0`, range format (e.g. "15–21 sep") otherwise. `formatWeekLabel()` stays as-is.
- **D-06:** "Créer une liste de courses" button stays in the same flex row as the navigation controls, on the left — same layout as today.
- **D-07:** Navigation range stays ±4 weeks (`canGoPrev` / `canGoNext` logic preserved).

### Claude's Discretion
- Exact column width strategy (fixed min-width with horizontal scroll vs. flexible columns) — not explicitly discussed; planner should choose based on typical desktop viewport.
- Exact spacing, padding, and font sizes within columns — stay consistent with the existing Tailwind stone palette.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing component to refactor
- `src/app/(app)/planning/PlanningWeek.tsx` — The component to rewrite. Contains `getMondayOf`, `toDateStr`, `addDays`, `formatWeekLabel`, state management, slot rendering, and the shopping list modal. All logic must be preserved or migrated.

### Reusable components
- `src/components/RecipeCombobox.tsx` — Inline recipe search combobox; already integrated in the current component; must continue to be used per success criteria.
- `src/app/(app)/planning/actions.ts` — Server Actions `addMealPlan` / `deleteMealPlan` — unchanged.
- `src/app/(app)/shopping-lists/actions.ts` — `createShoppingListFromPlanning` — unchanged.

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: FND-01, DSK-01–04, SHR-01–04
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 items)
- `.planning/PROJECT.md` — Core constraints: no external calendar lib, Tailwind breakpoints, touch events

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RecipeCombobox` (`src/components/RecipeCombobox.tsx`): accepts `recipes`, `onAdd`, `disabled`, `excludeIds` — drop-in for each slot in the new grid.
- Shopping list modal: already implemented inside `PlanningWeek.tsx` — extract and preserve as-is.
- `addDays(date, n)`: correct (uses `setDate` on a local Date object) — keep unchanged.
- `formatWeekLabel(monday)`: correct and already tested via current usage — keep unchanged.
- `DAY_LABELS`, `MEAL_LABELS`, `MEAL_TYPES` constants — keep unchanged.

### Timezone Bug — Root Cause
- `getMondayOf(dateStr)`: calls `new Date(dateStr)` — ISO string parsed as UTC midnight. In negative-offset timezones (UTC-5), this becomes the previous day locally, making `getDay()` return the wrong weekday.
- `toDateStr(date)`: calls `date.toISOString().split("T")[0]` — produces UTC date, which in negative-offset timezones shows the day before the local date.
- **Fix direction:** parse date strings by splitting (`"2024-01-15".split("-")` → `new Date(y, m-1, d)` local midnight), and format using `getFullYear()/getMonth()/getDate()`.

### Integration Points
- `PlanningWeek` receives `initialMealPlans`, `recipes`, `today` as props from the RSC page — interface stays the same.
- `weekOffset` state drives which 7 days are displayed — preserve this pattern.
- Optimistic UI pattern (`setMealPlans` on add/remove without awaiting revalidation) — preserve.

### Established Patterns
- `stone-*` palette throughout — do not introduce new color tokens.
- No global state — local `useState` only.
- `"use client"` directive on all interactive components.

</code_context>

<specifics>
## Specific Ideas

- Google Calendar reference: badge on the date number (filled circle) as the primary today indicator — explicitly chosen over column-wide background.
- Navigation bar layout: identical to current flex row (`justify-between` with button + label + button), just above the new horizontal grid.

</specifics>

<deferred>
## Deferred Ideas

- Grid horizontal scroll vs squeeze — deferred to planner (not discussed, planner should decide).
- v2 polish (PLH-01 Aujourd'hui button, PLH-02 faded past days, PLH-03 dot indicators) — roadmap v2, post-Phase 2.

</deferred>

---

*Phase: 1-Foundation + Desktop Week Grid*
*Context gathered: 2026-09-15*
