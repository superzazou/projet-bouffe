# Phase 01: Foundation + Desktop Week Grid - Research

**Researched:** 2026-09-15
**Domain:** React + Tailwind CSS layout refactor, JavaScript date handling, timezone correctness
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Today badge = `bg-stone-900 text-white` circle behind the day number in the column header only. No background tint on the column body.
- **D-02:** Day abbreviation for today: `text-stone-900 font-semibold`. Other days: `text-stone-400`.
- **D-03:** Column body (meal slots) — no special visual treatment for today. Header distinction alone.
- **D-04:** Navigation bar stays as a dedicated row above the grid.
- **D-05:** Week label format unchanged: "Cette semaine" when `weekOffset === 0`, range format otherwise. `formatWeekLabel()` stays as-is.
- **D-06:** "Créer une liste de courses" button moves into the same flex row as navigation controls, on the left side (was a separate row in the current code).
- **D-07:** Navigation range stays ±4 weeks (`canGoPrev` / `canGoNext` logic preserved).

### Claude's Discretion

- Exact column width strategy (fixed min-width with horizontal scroll vs. flexible columns).
- Exact spacing, padding, and font sizes within columns — stay consistent with the existing Tailwind stone palette.

### Deferred Ideas (OUT OF SCOPE)

- Mobile view — Phase 2.
- v2 polish: PLH-01 "Aujourd'hui" button, PLH-02 faded past days, PLH-03 dot indicators.
- Drag & drop, monthly view, thumbnail images.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | Fix timezone bug in `getMondayOf` / `toDateStr` — UTC parsing/formatting produces wrong day in negative-offset timezones | Root cause and exact fix documented in §Timezone Bug section |
| DSK-01 | 7-column horizontal grid replacing the vertical list in `PlanningWeek.tsx` | CSS Grid pattern documented, column width strategy recommended |
| DSK-02 | Today's column visually distinguished via header badge | Badge markup pattern documented |
| DSK-03 | Prev/next week navigation preserved | Existing state logic is correct — no change needed |
| DSK-04 | Each column header shows abbreviated day name + date number | Column header markup pattern documented |
| SHR-01 | Two slots per day (Midi / Soir) | Slot structure maps directly from existing code |
| SHR-02 (desktop) | Inline `RecipeCombobox` for adding a recipe | Existing `RecipeCombobox` is drop-in compatible |
| SHR-03 (desktop) | Remove recipe from slot | Existing `handleRemove` + "Retirer" button pattern preserved |
| SHR-04 | "Créer une liste de courses" button accessible and functional | Modal logic unchanged, button moved into nav row per D-06 |
</phase_requirements>

---

## Summary

This phase is a **single-component refactor** of `src/app/(app)/planning/PlanningWeek.tsx`. No new files are required. The existing logic (state, actions, modal, navigation) is entirely preserved — the work is: (1) fix two date utility functions, (2) replace the vertical `flex-col` day-card layout with a horizontal `grid grid-cols-7` layout, and (3) move the shopping list button into the navigation row.

The timezone bug is the highest-risk task. It requires understanding why `new Date("YYYY-MM-DD")` parses as UTC midnight and why `Date.toISOString()` emits a UTC date — and replacing both with local-date-part operations. The fix is deterministic and small (two functions, ~5 lines each). Once the date utilities are correct, the layout refactor is pure Tailwind restructuring with no logic changes.

**Primary recommendation:** Fix FND-01 first as a standalone commit, then restructure layout in a second commit. This makes the timezone fix reviewable and rollback-safe independently.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Date parsing / week offset math | Frontend Client | — | All date math lives in `PlanningWeek.tsx`; no server computation needed |
| Grid layout rendering | Frontend Client | — | `PlanningWeek.tsx` is a `"use client"` component |
| Today highlight badge | Frontend Client | — | Client-only visual, derived from local date comparison |
| Navigation state (weekOffset) | Frontend Client | — | `useState` in the component — existing pattern |
| Meal plan mutations (add/remove) | Server Actions | — | `actions.ts` — unchanged |
| Shopping list creation | Server Actions | — | `shopping-lists/actions.ts` — unchanged |
| Data fetching (meal plans, recipes) | RSC Page | — | `page.tsx` — unchanged |

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component rendering | Already in project |
| Tailwind CSS | 4.x | Utility-class styling | CLAUDE.md constraint: Tailwind only |
| Next.js | 16.2.4 | App Router, RSC, Server Actions | Already in project |
| TypeScript | 5.x | Type safety | Already in project |

**No new packages are installed in this phase.** All tooling is already present. The constraint from CLAUDE.md is explicit: React + Tailwind only — no external calendar library.

---

## Package Legitimacy Audit

No packages are installed in this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
[RSC page.tsx]
    |-- fetches meal_plans + recipes from Supabase (server, UTC-based range)
    |-- passes today (UTC date string), initialMealPlans, recipes as props
    v
[PlanningWeek.tsx — "use client"]
    |-- weekOffset state → derives currentMonday → derives 7 days
    |-- getMondayOf(today)  [FIXED: local-date parsing]
    |-- toDateStr(day)      [FIXED: local-date formatting]
    |-- renders navigation row (shopping list btn LEFT | nav controls RIGHT)
    |-- renders 7-column grid
         |-- column[0..6]: header (day abbrev + date badge)
                           body (Midi slot → RecipeCombobox + recipe list)
                               (Soir slot  → RecipeCombobox + recipe list)
    |-- shopping list modal (overlay, unchanged)
    v
[Server Actions: addMealPlan / deleteMealPlan / createShoppingListFromPlanning]
    |-- unchanged
```

### Recommended Project Structure

No structural changes. The refactor is confined to:

```
src/app/(app)/planning/
├── page.tsx               # RSC — unchanged (max-w-4xl needs widening, see §Pitfalls)
└── PlanningWeek.tsx       # Client component — full rewrite of layout section
src/components/
└── RecipeCombobox.tsx     # Unchanged — drop-in reuse
```

### Pattern 1: Timezone-safe Date Parsing

**What:** Parse `"YYYY-MM-DD"` strings as local midnight by splitting on `"-"` and using the 3-argument `Date` constructor. Never pass an ISO string directly to `new Date()` for date-only values.

**When to use:** Whenever a `"YYYY-MM-DD"` string from the database or a prop needs to become a `Date` object for day-of-week or date arithmetic.

**Example:**
```typescript
// Source: MDN — Date parsing, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
// WRONG — parses as UTC midnight → wrong weekday in UTC-N timezones
function getMondayOf_BROKEN(dateStr: string): Date {
  const d = new Date(dateStr); // UTC midnight, wrong local day
  const day = d.getDay();      // returns previous day's weekday in UTC-5
  ...
}

// CORRECT — parses as local midnight
function getMondayOf(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d); // local midnight
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}
```

### Pattern 2: Timezone-safe Date Formatting

**What:** Format a `Date` to `"YYYY-MM-DD"` using local date parts (`getFullYear`, `getMonth`, `getDate`). Never use `toISOString()` for date-only formatting — it emits UTC which is the previous day in UTC-N timezones.

**When to use:** Whenever a `Date` object needs to be converted to a `"YYYY-MM-DD"` string for comparison with database values or the `today` prop.

**Example:**
```typescript
// Source: MDN — Date getFullYear/getMonth/getDate
// WRONG — emits UTC date, which is previous day in UTC-5 at midnight
function toDateStr_BROKEN(date: Date): string {
  return date.toISOString().split("T")[0]; // UTC date
}

// CORRECT — emits local date
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```

### Pattern 3: Client-side "Today" Derivation

**What:** Compute the local `todayStr` directly in the client component using local date parts, rather than relying on the server-passed `today` prop for display/comparison logic.

**Why:** The `today` prop from `page.tsx` is `new Date().toISOString().split("T")[0]` — a UTC date string generated server-side. After fixing `toDateStr` to produce local dates, comparing those local date strings against a UTC `today` prop will be wrong at midnight for users in UTC-N timezones. The safe fix is to derive `todayStr` locally.

**Example:**
```typescript
// Source: MDN — Date getFullYear/getMonth/getDate
// At the top of the component body, derive today locally:
const localToday = new Date();
const todayStr = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, "0")}-${String(localToday.getDate()).padStart(2, "0")}`;

// Then use todayStr for isToday comparison:
const isToday = dateStr === todayStr;
// And for baseMonday derivation:
const baseMonday = getMondayOf(todayStr);
```

The `today` prop still flows from the server (needed for the data fetching range in page.tsx) but `todayStr` computed locally ensures correct "today" detection on the client.

### Pattern 4: 7-Column CSS Grid Layout

**What:** Replace the vertical `flex-col` day cards with a `grid grid-cols-7` container. Each grid cell is a column containing a header and two meal slots.

**When to use:** Desktop-only, unconstrained by mobile breakpoint (Phase 2 adds mobile with a different structure).

**Example:**
```typescript
// Source: Tailwind CSS docs — Grid Template Columns
// Container: horizontal scroll guard with min-width
<div className="overflow-x-auto">
  <div className="grid grid-cols-7 min-w-[700px] border border-stone-200 rounded-lg divide-x divide-stone-200">
    {days.map((day, i) => {
      const dateStr = toDateStr(day);
      const isToday = dateStr === todayStr;
      return (
        <div key={dateStr} className="flex flex-col">
          {/* Column header */}
          <div className="flex flex-col items-center gap-1 py-2 border-b border-stone-200">
            <span className={`text-xs font-medium ${isToday ? "text-stone-900 font-semibold" : "text-stone-400"}`}>
              {DAY_LABELS[i]}
            </span>
            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? "bg-stone-900 text-white" : "text-stone-700"}`}>
              {day.getDate()}
            </span>
          </div>
          {/* Column body: Midi + Soir slots */}
          <div className="flex flex-col gap-3 p-2">
            {MEAL_TYPES.map((mealType) => {
              // slot rendering — same logic as existing code
            })}
          </div>
        </div>
      );
    })}
  </div>
</div>
```

### Pattern 5: Navigation Row with Shopping List Button (D-06)

**What:** Combine the shopping list button (currently in a separate top div) with the navigation controls into a single `justify-between` flex row.

**Example:**
```typescript
// Source: existing PlanningWeek.tsx navigation pattern, restructured per D-06
<div className="flex items-center justify-between gap-4 flex-wrap">
  {/* Left: shopping list button */}
  <button
    onClick={openListModal}
    disabled={upcomingRecipes.length === 0}
    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  >
    Créer une liste de courses
  </button>
  {/* Right: week navigation */}
  <div className="flex items-center gap-4">
    <button onClick={() => setWeekOffset((o) => o - 1)} disabled={!canGoPrev} className="...">
      ← Semaine précédente
    </button>
    <span className="text-sm font-medium text-stone-700 min-w-[180px] text-center">
      {weekOffset === 0 ? "Cette semaine" : formatWeekLabel(currentMonday)}
    </span>
    <button onClick={() => setWeekOffset((o) => o + 1)} disabled={!canGoNext} className="...">
      Semaine suivante →
    </button>
  </div>
</div>
```

### Anti-Patterns to Avoid

- **Using `new Date(isoString)` for date-only values:** ISO date strings are parsed as UTC midnight. Use split + 3-arg constructor instead.
- **Using `toISOString()` for date formatting:** Emits UTC, not local date. Use `getFullYear/getMonth/getDate`.
- **Adding overflow-hidden to the grid container:** The `RecipeCombobox` uses `absolute` positioning for its dropdown — an `overflow-hidden` ancestor clips it invisibly. Keep grid container `overflow-visible` (default); only use `overflow-x-auto` on the scroll wrapper, which is outside the grid.
- **Relying on the server-passed `today` prop for client-side date comparisons:** The prop is UTC-based. Derive `todayStr` locally in the component (Pattern 3).
- **Making column widths too narrow by keeping `max-w-4xl` on the page container:** See §Common Pitfalls.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recipe search with filtering | Custom dropdown | `RecipeCombobox` (existing) | Already implemented, tested, accessible |
| Shopping list creation modal | New modal | Existing modal in `PlanningWeek.tsx` | Keep as-is — logic is correct |
| Date-to-week-range formatting | New formatter | `formatWeekLabel()` (existing) | Already correct and French-locale aware |
| Day label array | New i18n | `DAY_LABELS` constant (existing) | Already defined |

---

## Common Pitfalls

### Pitfall 1: `max-w-4xl` Container Too Narrow for 7 Columns

**What goes wrong:** `page.tsx` wraps content in `max-w-4xl` (896px). At 896px, 7 equal columns = ~128px each — too narrow for the `RecipeCombobox` input (placeholder text is ~160px at `text-sm`). Columns collapse or overflow visibly.

**Why it happens:** The current vertical layout only needed a single card width; 7 horizontal columns need much more horizontal space.

**How to avoid:** Change the container in `page.tsx` to `max-w-7xl` (1280px) or `max-w-screen-xl`, OR add `overflow-x-auto` on a wrapper inside `PlanningWeek` with `min-w-[900px]` on the grid. The second approach keeps page layout concerns inside the component, which is preferable.

**Recommendation for planner (Claude's Discretion):** Use `overflow-x-auto` wrapper + `min-w-[900px]` on the grid. This leaves `page.tsx` unchanged and ensures graceful scrolling on narrow viewports (not that Phase 1 targets mobile, but it prevents layout breakage on e.g. 1024px laptop screens).

### Pitfall 2: RecipeCombobox Dropdown Clipped by Overflow Ancestor

**What goes wrong:** The combobox dropdown (`absolute z-10`) is clipped when any ancestor has `overflow-hidden` set.

**Why it happens:** CSS `overflow-hidden` creates a new block formatting context that clips absolutely positioned descendants.

**How to avoid:** Keep the scroll wrapper as `overflow-x-auto` only (on the outer div). Do NOT add `overflow-hidden` to the grid container or column divs. The grid itself should have default (visible) overflow.

### Pitfall 3: `isToday` False Negative After Timezone Fix

**What goes wrong:** After fixing `toDateStr` to use local dates, `dateStr === today` is false for users in UTC-N timezones at midnight because `today` (from server prop) is still a UTC date string.

**Why it happens:** The server computes `today.toISOString().split("T")[0]` in UTC, but client-side `toDateStr()` now produces local dates.

**How to avoid:** Derive `todayStr` on the client from local date parts (Pattern 3 above). Use `todayStr` for all client-side "today" comparisons and as the base for `getMondayOf`. Keep the server `today` prop only if needed for the data-fetching range — but that logic is in `page.tsx` and is already correct (the Supabase range query is fine with UTC dates).

### Pitfall 4: Shopping List Modal Loses Recipes If `today` Prop Is Used for Filtering

**What goes wrong:** `upcomingRecipes` is computed as `recipes.filter((r) => mealPlans.some((mp) => mp.recipe_id === r.id && mp.date >= today))`. If `today` becomes `todayStr` (client-local), verify this filter still makes semantic sense. It does — filtering upcoming meals from today forward.

**How to avoid:** Replace `today` in this filter with `todayStr` (the client-local today) for consistency.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vertical day-card list | 7-column horizontal grid (this phase) | Phase 1 | Matches Google Calendar desktop UX |
| `flex-col gap-3` day layout | `grid grid-cols-7` | Phase 1 | All 7 days visible at once |
| Shopping list button in separate top row | Same row as navigation | Phase 1 per D-06 | Simpler layout, one less visual row |

**Deprecated/outdated (after this phase):**
- `new Date(dateStr)` in `getMondayOf`: replaced by `new Date(y, m-1, d)` local constructor.
- `date.toISOString().split("T")[0]` in `toDateStr`: replaced by `getFullYear/getMonth/getDate`.
- Vertical `flex-col gap-3` day card layout: replaced by `grid grid-cols-7`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `page.tsx` does not need to be widened — `overflow-x-auto` + `min-w-[900px]` in `PlanningWeek` is sufficient | Pitfall 1, Pattern 4 | If page has max-width that clips the scroll area itself, user cannot scroll; fix: change `max-w-4xl` on page.tsx |
| A2 | `RecipeCombobox` dropdown z-index (z-10) is sufficient to overlay grid sibling columns | Pattern 2 | If not, increase to `z-20` on the dropdown `ul` in `RecipeCombobox.tsx` |
| A3 | `formatWeekLabel()` using `toLocaleDateString("fr-FR")` is correct with local Date objects after timezone fix | Pattern 1 | If not, the week label shows wrong dates — fix by verifying `monday` is local midnight |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Should `today` prop be removed from PlanningWeek, or kept?**
   - What we know: `today` is used for `getMondayOf(today)`, `isToday` comparison, and the upcoming recipes filter.
   - What's unclear: Whether the server-side date string is needed at all, or if all logic can use client-local `todayStr`.
   - Recommendation: Keep the `today` prop signature unchanged (it's the RSC interface) but derive `todayStr` locally for all display logic. This avoids a prop-signature change that would affect `page.tsx`.

2. **Grid border/separator style: `divide-x` vs individual column borders?**
   - What we know: The stone palette uses `border-stone-200` throughout.
   - What's unclear: Whether `divide-x divide-stone-200` on the grid looks right, or whether explicit `border-r` per column with no border on the last column is cleaner.
   - Recommendation: Use `divide-x divide-stone-200` on the grid — Tailwind's divide utility handles the first/last column edge cases automatically.

---

## Environment Availability

This phase is a code/config change only — no external dependencies beyond the existing project stack.

Step 2.6: SKIPPED (no external dependencies identified — all tooling already installed)

---

## Validation Architecture

### Test Framework

No test framework is currently configured in this project (no `jest.config.*`, `vitest.config.*`, or `pytest.ini` detected, no `tests/` directory). This phase does not add tests.

| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | None |
| Quick run command | `npm run lint` (ESLint only) |
| Full suite command | `npm run build` (type-check + build) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | Timezone fix: `getMondayOf("2024-01-15")` returns local Monday | Manual | Open app from UTC-5 browser, verify Mon Jan 15 column is correct | N/A |
| DSK-01 | 7 columns visible side by side | Manual / visual | Load `/planning` in browser | N/A |
| DSK-02 | Today's column header has badge | Manual / visual | Compare header to non-today columns | N/A |
| DSK-03 | Prev/next week navigation works | Manual | Click navigation arrows | N/A |
| DSK-04 | Day abbrev + date number in header | Manual / visual | Inspect column headers | N/A |
| SHR-01 | Midi + Soir slots per column | Manual / visual | Count slots per column | N/A |
| SHR-02 | Add recipe via combobox | Manual | Type in combobox, select, verify slot updates | N/A |
| SHR-03 | Remove recipe via "Retirer" button | Manual | Click Retirer, verify slot clears | N/A |
| SHR-04 | Shopping list button functional | Manual | Click button, modal opens, create list | N/A |

### Wave 0 Gaps

No test framework — all validation is manual. The planner should include a manual smoke-test checklist task at the end of the phase.

---

## Security Domain

This phase modifies only frontend layout and date utilities. No authentication, no new data access, no new API surfaces. All existing security controls (auth-gated layout, server action auth checks) are unchanged.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Unchanged from existing |
| V3 Session Management | no | Unchanged |
| V4 Access Control | no | Unchanged |
| V5 Input Validation | no | No new input surfaces |
| V6 Cryptography | no | Not applicable |

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — `Date` constructor, `getFullYear/getMonth/getDate`, `toISOString` — UTC/local date parsing behavior [VERIFIED: authoritative source, training knowledge consistent with MDN specification]
- `src/app/(app)/planning/PlanningWeek.tsx` — Direct code read — existing logic, bug location, state structure [VERIFIED: codebase read]
- `src/components/RecipeCombobox.tsx` — Direct code read — props interface, dropdown behavior [VERIFIED: codebase read]
- `src/app/(app)/planning/page.tsx` — Direct code read — RSC, props passed to client component, container max-width [VERIFIED: codebase read]
- `.planning/phases/01-foundation-desktop-week-grid/01-CONTEXT.md` — User decisions D-01 through D-07 [VERIFIED: codebase read]
- `CLAUDE.md` / `.claude/CLAUDE.md` — Project constraints, stack, patterns [VERIFIED: codebase read]

### Secondary (MEDIUM confidence)
- Tailwind CSS `grid grid-cols-7`, `divide-x`, `overflow-x-auto` — standard documented utilities [ASSUMED — consistent with Tailwind v4 docs; no live lookup performed this session]

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; existing stack verified from codebase
- Architecture: HIGH — single-component refactor, all constraints read from source
- Timezone fix: HIGH — root cause and fix directly verified from source code read + MDN spec knowledge
- Layout patterns: HIGH — pure Tailwind utilities applied to existing codebase
- Pitfalls: HIGH — derived from direct inspection of existing code + well-known CSS positioning rules

**Research date:** 2026-09-15
**Valid until:** 2026-10-15 (stable stack — no moving dependencies)
