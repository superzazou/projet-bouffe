# Pitfalls Research

**Domain:** Calendar/planner UI — horizontal week view, mobile swipe navigation, no calendar library
**Researched:** 2026-09-15
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Touch events are passive by default — preventDefault fails silently

**What goes wrong:**
You add a `touchmove` handler to prevent page scroll while the user swipes horizontally. The browser ignores your `preventDefault()` call and logs a warning: "Unable to preventDefault inside passive event listener." The page scrolls AND the day changes simultaneously, making the interaction feel broken.

**Why it happens:**
Since Chrome 51 / iOS 13, browsers mark `touchstart` and `touchmove` as passive by default for performance reasons. React's synthetic `onTouchMove` prop attaches as a passive listener. Calling `e.preventDefault()` inside it has no effect.

**How to avoid:**
Use `useEffect` to attach the listener directly on the DOM node with `{ passive: false }`:
```ts
useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  const handler = (e: TouchEvent) => {
    if (isHorizontalSwipe) e.preventDefault();
  };
  el.addEventListener("touchmove", handler, { passive: false });
  return () => el.removeEventListener("touchmove", handler);
}, []);
```
Only call `preventDefault` when the gesture is clearly horizontal (deltaX > deltaY), so vertical scroll still works inside the same container.

**Warning signs:**
- Console warning "Unable to preventDefault inside passive event listener"
- Page scrolls vertically at the same time the day transitions
- Swipe only works when page is already at scroll top

**Phase to address:** Mobile swipe implementation phase (day view + mini week bar)

---

### Pitfall 2: Date arithmetic timezone trap — `new Date(dateString)` + local day methods

**What goes wrong:**
The existing `getMondayOf` and `toDateStr` functions mix ISO string parsing with local-timezone methods. `new Date("2024-01-15")` is parsed as UTC midnight. Calling `.getDay()` on it returns the weekday in the **local** timezone. In UTC-5 (Americas), UTC midnight is 7pm the previous day, so `.getDay()` returns Saturday instead of Monday. The week grid is offset by one day.

**Why it happens:**
JavaScript's `Date` constructor treats ISO date strings (no time component) as UTC, but `.getDay()`, `.getDate()`, `.setDate()` operate in local time. Developers don't notice during development (most dev machines in Europe/UTC+) but it breaks for users in UTC- timezones.

The existing code has this exact bug:
```ts
function getMondayOf(dateStr: string): Date {
  const d = new Date(dateStr); // parsed as UTC midnight
  const day = d.getDay();      // evaluated in local time — wrong in UTC-
  ...
}
function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0]; // back to UTC — double offset
}
```

**How to avoid:**
Parse date strings by manually extracting year/month/day to avoid timezone interpretation:
```ts
function parseDateStr(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight, no UTC ambiguity
}
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```
Use this pattern consistently for all date construction throughout the component.

**Warning signs:**
- Week starts on Sunday instead of Monday for some users
- "Today" highlight appears on the wrong day
- Meal plans appear shifted by one day after SSR hydration

**Phase to address:** Desktop week view implementation (foundational — fix before building any view)

---

### Pitfall 3: Swipe drag state stored in React state causes jank

**What goes wrong:**
You track `touchStartX` and `currentDeltaX` in `useState`. Every `touchmove` event calls `setState`, triggering a re-render on each pixel of movement. On mid-range Android devices this drops to 20fps during the drag, making the swipe feel stuttery even before any transition animation plays.

**Why it happens:**
React re-renders are not free. 60 re-renders per second (one per touchmove) during a gesture is too much work, especially when the swipe tracking value is only needed at `touchend` to decide whether to commit the navigation.

**How to avoid:**
Store swipe tracking data in `useRef`, not `useState`. Only call `setState` once at `touchend` when committing to the new day:
```ts
const touchStartX = useRef(0);
const touchCurrentX = useRef(0);

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
};
const handleTouchMove = (e: React.TouchEvent) => {
  touchCurrentX.current = e.touches[0].clientX;
  // Animate with CSS transform directly, not state
  if (containerRef.current) {
    const delta = touchCurrentX.current - touchStartX.current;
    containerRef.current.style.transform = `translateX(${delta}px)`;
  }
};
const handleTouchEnd = () => {
  const delta = touchCurrentX.current - touchStartX.current;
  if (Math.abs(delta) > SWIPE_THRESHOLD) {
    setActiveDay(prev => delta < 0 ? nextDay(prev) : prevDay(prev));
  }
  // Reset transform
  if (containerRef.current) containerRef.current.style.transform = "";
};
```

**Warning signs:**
- Sluggish feel during drag on lower-end devices
- React DevTools Profiler shows >20 commits per second during swipe
- Animation frame rate drops visible in Chrome Performance tab

**Phase to address:** Mobile swipe implementation phase

---

### Pitfall 4: Meal plan data is not fetched for weeks other than the initial SSR week

**What goes wrong:**
The existing component receives `initialMealPlans` via SSR props and stores them in local state. When the user navigates to the next week, the component renders slots for those days but `mealPlans` still only contains data from the original SSR load. Past/future weeks appear empty even if they have plans.

**Why it happens:**
SSR fetched data for the current week. Week navigation is pure client-side state (`weekOffset`). There is no mechanism to fetch meal plans for new weeks on demand.

**How to avoid:**
Two viable approaches:
1. **Fetch all weeks upfront at SSR time** (acceptable for a family app with small data): fetch a wider window (e.g. ±4 weeks) and pass all plans down. Simple, no client fetching needed.
2. **Client-side fetch on week change**: use a Server Action or route handler to fetch plans for the new week range when `weekOffset` changes. Requires a loading state per week.

For this app, option 1 is simpler and sufficient — meal plans per family are not large enough to make a wide fetch expensive.

**Warning signs:**
- Future/past weeks show no meal plans even after adding them
- Adding a meal in week +1 and navigating away/back loses it (it was added to `mealPlans` state but re-navigation resets to `initialMealPlans`)
- No loading indicator when switching weeks (because no data fetch is happening)

**Phase to address:** Desktop week view implementation (data layer decision must be made first)

---

### Pitfall 5: Mini week bar and day view selected day state drift

**What goes wrong:**
The mobile view has two pieces of UI that must agree on "which day is active": the mini week bar (7 dots/labels at top) and the main day view below. If they are driven by separate state variables, they can drift. A swipe updates `activeDay` but the mini bar still highlights the old day. Or tapping a day in the mini bar doesn't update the swipe view.

**Why it happens:**
Developers build the mini bar and day view as siblings and give each its own `useState`, connected only via callbacks. Edge cases (rapid taps, simultaneous swipe + tap) cause them to desync.

**How to avoid:**
Use a single source of truth: one `activeDay: string` state (ISO date string) lifted to the parent. Both the mini bar and day view read from and write to the same state. The mini bar's `onDaySelect` and the swipe handler both call `setActiveDay`. No local state in either child for the "which day" concern.

**Warning signs:**
- Mini bar highlight and day content show different days
- After a swipe, tapping the same day in the mini bar does nothing (event fires but state is already that value — looks like it works)
- On week boundary (swipe from Sunday to Monday of next week), the week bar doesn't update to show the new week

**Phase to address:** Mobile day view + mini week bar phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep existing `new Date(dateStr)` pattern | No refactor needed | Timezone bug for UTC- users; corrupted week display | Never — fix in first implementation phase |
| Single `initialMealPlans` SSR prop, no pagination | Simple, no client fetch | Past/future weeks look empty; users distrust the app | Only if app is single-week view (it's not) |
| Use `onClick` for swipe (click on arrow buttons only on mobile) | Fast to build | Poor mobile UX, no gesture feel | Acceptable as v0 placeholder only |
| CSS `overflow-x: scroll` on week grid instead of true 7-col layout | Works for basic scroll | Week navigation becomes ambiguous (scroll vs. navigate); "current day centered" is impossible | Never — defeats the design goal |
| Hardcode `md:` as the mobile/desktop breakpoint | Zero configuration | iPads (768px portrait) get broken layout; Tailwind `md:` = 768px, same as iPad | Acceptable if only targeting phones vs. laptop |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase `meal_plans` query | Fetch all plans with no date filter, filter client-side | Filter by date range server-side: `gte('date', weekStart).lte('date', weekEnd)` or fetch ±4 weeks |
| Server Actions (`addMealPlan`) | Call without optimistic update, wait for server round-trip before updating UI | Add optimistic state immediately, roll back on error (existing code already does this correctly) |
| Next.js App Router + client swipe state | Put swipe state in a Server Component by mistake | All swipe/touch logic must live in a `"use client"` component — the entire new calendar component is client-side |
| `today` prop from server | Server computes today in UTC; user's browser is UTC-5; "today" is yesterday | Compute `today` on the client with `new Date().toLocaleDateString("fr-FR", ...)`, or pass the date parts (year, month, day) explicitly from the server |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering all 7 day columns on every swipe touchmove | Visible stutter during drag on Android mid-range | Store swipe delta in `useRef`, animate via `style.transform` direct DOM mutation, not state | Immediately on any touchmove if state-based |
| `recipes.find()` called inside render for every plan in every slot | Noticeable lag when recipe list is large | Pre-compute a `Map<id, Recipe>` outside the render loop: `useMemo(() => new Map(recipes.map(r => [r.id, r])), [recipes])` | At ~200+ recipes |
| Fetching meal plans on every week navigation without caching | 300ms+ blank flash between weeks | Cache fetched weeks in a `Map<weekKey, plans>` ref; only fetch weeks not yet cached | From first navigation if no cache |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Swipe threshold too low (< 20px) | Accidental day navigation when user means to scroll or tap | Use 40–60px horizontal threshold AND require deltaX > deltaY to confirm horizontal intent |
| No visual feedback during swipe drag | Swipe feels unresponsive; user doesn't know if gesture was registered | Apply a live `translateX` CSS transform during drag so the content "follows the finger" |
| Mini week bar shows abbreviated day labels only, no date number | User can't tell which "Lun" is the 4th vs. 11th | Show day-of-month number below the label in the mini bar (e.g. "Lun / 15") |
| RecipeCombobox dropdown clipped inside narrow grid column | User can't see search results; dropdown is cut off by `overflow: hidden` on column | On desktop narrow columns, open the dropdown as a portal to document body, or switch to modal pattern for adding recipes on desktop too |
| "Créer une liste de courses" button missing from mobile view | Mobile users can't access a core feature | Ensure the shopping list action is accessible from the mobile day view (e.g. in a header menu or floating action) |
| Week navigation disabled after ±4 weeks with no explanation | Users trying to plan further than 4 weeks get stuck silently | Either remove the hard limit, increase it, or show a tooltip explaining why further navigation is blocked |

---

## "Looks Done But Isn't" Checklist

- [ ] **Today highlight:** Works correctly on a machine where the local timezone is UTC-5 (Americas) — test with `TZ=America/New_York` in the browser/Node environment
- [ ] **Swipe navigation:** Works when the app is embedded inside a scrollable page container — the swipe doesn't accidentally scroll the outer page
- [ ] **Mini week bar:** Transitions to the next week automatically when swiping past Sunday to Monday (not just updating the day, but the entire week bar advances)
- [ ] **Data loading:** Navigating to week +1 and week +2 shows actual meal plans, not empty slots
- [ ] **RecipeCombobox on desktop:** Dropdown is not clipped by parent `overflow: hidden` on the grid column
- [ ] **Mobile modal:** "Add recipe" modal is reachable from the mobile day view without the inline combobox being present
- [ ] **Keyboard navigation:** Left/right arrow keys navigate between days on mobile view; tab order follows visual order on desktop

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Timezone bug discovered after shipping | MEDIUM | Fix `parseDateStr` / `toDateStr` utilities; all date logic propagates from these two functions — one fix repairs everything |
| Stale data across week navigation | LOW | Add date-range filter to the Supabase query and pass wider window as SSR prop; no architectural change needed |
| Swipe jank on Android | MEDIUM | Refactor touch handlers to use refs + direct DOM style mutation; requires rewriting touch handler logic but not component structure |
| State drift between mini bar and day view | LOW | Lift `activeDay` state one level up to the shared parent; both sub-components become controlled; mechanical refactor |
| RecipeCombobox dropdown clipping | MEDIUM | Add portal rendering to the combobox or replace with modal on narrow columns; may require touching the RecipeCombobox component itself |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Date timezone trap | Phase 1 — Desktop week view (foundational utilities) | Run tests with `TZ=America/New_York node` — week labels and today highlight must be correct |
| Stale data across week navigation | Phase 1 — Desktop week view (data layer) | Navigate to week +2 in production build; plans added there must persist and reload correctly |
| Passive touch event / preventDefault failure | Phase 2 — Mobile swipe implementation | Test on real iOS Safari and Chrome Android; page must not scroll while swiping horizontally |
| Swipe state in React state causing jank | Phase 2 — Mobile swipe implementation | Chrome DevTools Performance tab: 0 re-renders during touchmove drag phase |
| Mini bar / day view state drift | Phase 2 — Mobile day view + mini week bar | Rapid alternating taps + swipes must never desync the two views |
| RecipeCombobox dropdown clipping | Phase 1 — Desktop week view layout | Open the recipe search dropdown in the last column (Sunday) on a narrow viewport; dropdown must be fully visible |

---

## Sources

- React touch event handling: passive listeners documented at https://developer.chrome.com/blog/passive-event-listeners
- MDN `TouchEvent`: https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
- JavaScript date timezone trap: well-documented in MDN Date constructor — ISO strings without time are UTC
- Next.js App Router client components: https://nextjs.org/docs/app/building-your-application/rendering/client-components
- Existing codebase: `PlanningWeek.tsx` analyzed directly for current patterns and specific bugs
- Tailwind breakpoints: https://tailwindcss.com/docs/responsive-design (md = 768px)

---
*Pitfalls research for: Horizontal meal planning calendar UI — React/Next.js, no calendar library*
*Researched: 2026-09-15*
