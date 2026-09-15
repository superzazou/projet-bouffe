# Project Research Summary

**Project:** projet-bouffe — Meal Planning Calendar UI Redesign
**Domain:** Responsive week-planner calendar (React/Next.js, brownfield)
**Researched:** 2026-09-15
**Confidence:** HIGH

## Executive Summary

This is a brownfield UI redesign of an existing Next.js meal planning app. The goal is to replace the current vertical card-per-day layout with a proper horizontal 7-column week grid on desktop and a swipeable single-day view on mobile. The existing stack (React 19, Tailwind 4, Next.js App Router, Supabase) requires zero new dependencies — every required pattern is achievable with existing primitives. The recommended approach is to decompose the existing PlanningWeek.tsx monolith into a state-controller root with stateless layout subtrees, using CSS breakpoint toggling rather than JS media queries.

The main implementation risk is date timezone handling: the existing codebase parses ISO date strings via new Date(dateString) which treats them as UTC midnight, then calls local-timezone methods — a latent bug that causes wrong-day rendering for UTC- users. This must be fixed in the first implementation phase. The second significant risk is touch event passivity: preventDefault() on swipe gestures silently fails unless listeners are registered with { passive: false } via imperative DOM attachment.

The recommended build order is bottom-up: fix date utilities first, build leaf components, then compose upward to layout trees, and finally wire the root controller. This order allows each component to be tested independently and avoids rebuilding higher-level components when foundational bugs are discovered.

## Key Findings

### Recommended Stack

No new packages are required. The entire redesign uses React 19 useState/useRef/useCallback/useEffect, Tailwind 4 utility classes, and native browser touch events. CSS Grid (grid-cols-7) provides the desktop layout; a state-driven translateX transform provides mobile day-slide animation. The existing date utilities, Server Actions, and RecipeCombobox component are reused as-is.

**Core technologies:**
- React 19 (existing): State controller root + stateless layout children — no new primitives needed
- Tailwind 4 (existing): md:grid/md:hidden breakpoint toggling, transition-transform for slide animation
- CSS Grid via Tailwind: grid-cols-7 for desktop week grid — the only correct layout primitive for equal-width columns
- Native touch events + useRef: Custom useSwipeGesture hook (~20 lines) — avoids 40KB library dependency
- Next.js App Router (existing): page.tsx RSC interface is unchanged

### Expected Features

**Must have (table stakes — this milestone):**
- Desktop 7-column horizontal week grid replacing the current vertical layout
- Today column highlighted on desktop
- Mobile single-day view defaulting to today
- Mobile mini week strip (7-pill bar showing abbreviated day + date number)
- Mobile swipe left/right between days
- Mobile add-recipe modal (replaces inline combobox on small screens)
- Responsive md: breakpoint — two layouts coexist without flicker
- Lunch/dinner slots, add/remove recipe, and shopping list creation preserved on both layouts

**Should have (P2 — add after core is validated):**
- Today jump button (resets weekOffset to 0)
- Past-day visual dimming (opacity-50 on columns before today)
- Meal count dot on mini strip per day
- Empty slot affordance (dashed border placeholder)

**Defer (v2+):**
- Drag and drop meal rearrangement — high complexity, marginal value for family context
- Recipe thumbnails — requires image infrastructure
- Monthly calendar view — different UX paradigm

### Architecture Approach

The architecture decomposes the current PlanningWeek.tsx monolith into a state-controller root and 10 co-located components. The root owns all state (mealPlans, weekOffset, selectedDate, savingKey) and passes stable callbacks down. Both desktop and mobile subtrees render simultaneously in the DOM — visibility is CSS-only, avoiding hydration flicker. A single MealSlot component with a variant prop handles both add-recipe UIs to avoid duplicate recipe-entry logic.

**Major components:**
1. PlanningWeek — root state controller, owns all shared state, calls Server Actions
2. PlanningDesktop — stateless, renders 7 DayColumn in a grid-cols-7, hidden on mobile
3. PlanningMobile — stateless container for WeekMiniBar + DayView, hidden on desktop
4. MealSlot — shared slot with variant prop; desktop: inline combobox; mobile: modal button
5. DayView — single-day view with imperative swipe detection
6. WeekMiniBar — 7-pill day selector, reads and writes selectedDate via parent state

### Critical Pitfalls

1. Date timezone trap — new Date(2024-01-15) parses as UTC midnight; .getDay() returns wrong weekday in UTC- timezones. Fix: parse date strings manually (new Date(y, m-1, d)). Fix this before building any view.

2. Passive touch event / preventDefault failure — React synthetic onTouchMove is passive; e.preventDefault() is silently ignored. Fix: attach touchmove handler imperatively via useEffect with { passive: false }.

3. Swipe state in React state causing animation jank — storing touchStartX in useState triggers 60 re-renders/sec during drag. Fix: use useRef for drag-phase data; call setState only once at touchend.

4. Stale meal plan data across week navigation — initialMealPlans from SSR only covers initial week. Fix: fetch a +-4 week window at SSR time.

5. Mini bar / day view state drift — separate useState in siblings can desync. Fix: single selectedDate state in PlanningWeek root.

## Implications for Roadmap

### Phase 1: Foundation — Desktop Week Grid + Date Utilities

**Rationale:** The timezone bug in date utilities is foundational — it corrupts every other component. The desktop layout establishes the component architecture that mobile builds on.

**Delivers:** Working desktop horizontal week grid with today highlight, week navigation, preserved add/remove/shopping list functionality, correct date utilities.

**Addresses:** Desktop 7-col grid, today highlight, prev/next navigation, shopping list preservation (all P1 table stakes).

**Avoids:** Date timezone trap (fix first), stale data across weeks (SSR window decision), RecipeCombobox dropdown clipping.

**Build order:** Fix parseDateStr/toDateStr -> RecipeEntry -> MealSlot (desktop variant) -> DayColumn -> PlanningDesktop -> ShoppingListModal -> PlanningHeader -> wire into PlanningWeek.

### Phase 2: Mobile — Day View, Mini Bar, Swipe

**Rationale:** Mobile is a separate layout subtree that builds on the shared MealSlot already created in Phase 1. Swipe implementation has its own pitfalls that are cleanest to address in isolation.

**Delivers:** Mobile single-day view with mini week strip, swipe left/right day navigation, add-recipe modal, cross-week swipe boundary handling.

**Addresses:** Mobile single-day view, mini week strip, swipe navigation, add-recipe modal (all P1 table stakes).

**Avoids:** Passive touch event failure (imperative useEffect attachment), swipe jank (useRef for drag state), mini bar/day view state drift (single selectedDate in root).

**Build order:** AddRecipeModal -> MealSlot (mobile variant) -> WeekMiniBar -> DayView (swipe logic) -> PlanningMobile -> wire into PlanningWeek.

### Phase 3: Polish — P2 Features

**Rationale:** Low-complexity add-ons that are easier to validate once core layouts are stable.

**Delivers:** Today jump button, past-day visual dimming, meal count dots on mini strip, empty slot affordance.

### Phase Ordering Rationale

- Foundation before mobile because MealSlot is shared — building it correctly once means mobile reuses it without changes
- Date utility fix must be Phase 1 Day 1 — every component depends on correct date arithmetic
- SSR data window decision in Phase 1 — avoids discovering stale-data bug during Phase 2 testing
- Polish deferred to Phase 3 — none are blockers for core function

### Research Flags

Phases with standard patterns (skip additional research):
- Phase 1 (Desktop grid): CSS Grid, Tailwind breakpoints, React state — all established patterns with code samples in STACK.md and ARCHITECTURE.md
- Phase 2 (Mobile swipe): Custom touch hook pattern fully documented in STACK.md and PITFALLS.md with exact code
- Phase 3 (Polish): All features are trivial CSS/derived-state additions

No phase requires additional research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against actual codebase files; zero new dependencies |
| Features | HIGH | Sourced directly from PROJECT.md + existing PlanningWeek.tsx |
| Architecture | HIGH | Component boundaries derived from direct codebase analysis |
| Pitfalls | HIGH | Timezone bug verified in existing source code; passive listener patterns are documented browser behavior |

**Overall confidence:** HIGH

### Gaps to Address

- RecipeCombobox dropdown clipping on narrow desktop columns: may require modifying the existing shared component. Assess during Phase 1 — modal pattern already designed for mobile may be extended.
- Today computed on server vs. client: server computes today in UTC while user browser may differ. Evaluate alongside date utility refactor in Phase 1.

## Sources

### Primary (HIGH confidence)
- Existing codebase (PlanningWeek.tsx, page.tsx, .planning/codebase/ARCHITECTURE.md) — direct code reading
- PROJECT.md — stated requirements and constraints

### Secondary (MEDIUM confidence)
- MDN Web Docs — CSS scroll-snap, TouchEvent API, Date constructor UTC behavior
- React Docs — synthetic touch events, changedTouches API
- Tailwind CSS v4 upgrade guide — arbitrary value syntax change for grid utilities

### Tertiary (comparable patterns)
- Google Calendar mobile, Fantastical, Apple Calendar — day strip + swipe navigation pattern validation

---
*Research completed: 2026-09-15*
*Ready for roadmap: yes*
