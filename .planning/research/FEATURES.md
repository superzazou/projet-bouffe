# Feature Research

**Domain:** Meal planning calendar UI — horizontal week view (desktop) + single-day swipe view (mobile)
**Researched:** 2026-09-15
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 7-column horizontal week grid (desktop) | Standard calendar layout; vertical card-per-day feels like a list, not a planner | MEDIUM | Replace current vertical layout; 7 equal columns, each day a column |
| Today highlighted/centered (desktop) | Every calendar app visually anchors the user on today | LOW | Current code already tracks `today`; add ring/background highlight to the column |
| Prev/next week navigation (both) | Users need to browse past/future weeks; already expected from current version | LOW | Already exists; must be preserved and placed in both responsive layouts |
| Mobile single-day view | A 7-column grid is unusable on a 375px screen; Google Calendar, Fantastical all default to day view on mobile | MEDIUM | Show exactly one day at a time; today is default |
| Mini week strip / bar (mobile) | When showing one day, users lose sense of where they are in the week; a day-pill row at the top is the universal mobile calendar pattern | MEDIUM | 7 compact day pills above the day view; selected day highlighted; days with meals get a dot indicator |
| Swipe left/right to navigate days (mobile) | Touch gesture is the expected primary navigation on mobile; arrow buttons feel wrong on touch | MEDIUM | `touchstart`/`touchend` with threshold (~50px); must not interfere with vertical scroll |
| Lunch and dinner slots per day (both) | Core domain model; two named meal slots is what the whole app is built on | LOW | Midi / Soir labels; preserve existing structure |
| Add recipe to a slot (both) | Core write operation; must work on both breakpoints | LOW | Desktop: inline `RecipeCombobox` as today; Mobile: `+` button that opens a modal |
| Remove recipe from a slot (both) | Core write operation; already exists; must be preserved | LOW | "Retirer" button; works the same on both breakpoints |
| Responsive breakpoint switch | The two layouts must coexist at the `md:` breakpoint without flicker or layout shift | LOW | Use Tailwind `md:` — hide mobile view on md+, hide desktop view below md |
| Saving/loading state feedback per slot | When add/remove is in-flight, the slot must disable to prevent double-submit; users notice when UI feels frozen | LOW | Already handled via `savingKey`; preserve this in the new layout |
| Shopping list creation preserved | This feature already exists and is expected by returning users; removing it would feel like regression | LOW | Keep existing modal; accessible from both views via toolbar button |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required for core function, but improve UX noticeably.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Today jump button (desktop) | After navigating several weeks out, a single click returns to the current week; reduces disorientation | LOW | Simple: `setWeekOffset(0)`; render as a pill "Aujourd'hui" between prev/next arrows |
| Past-day visual dimming | Days before today appear muted (reduced opacity or greyed text); gives temporal orientation at a glance | LOW | Compare `dateStr < today`; apply `opacity-50` or `text-stone-400` to past day columns |
| Meal count dot on mini week bar (mobile) | Each day pill in the strip shows a small dot if at least one meal is planned; lets users see their week at a glance without switching days | MEDIUM | Count `mealPlans` entries per date in the strip render; render a 2px dot below the day number |
| Empty slot affordance | An empty slot shows a distinct "add" target (dashed border or placeholder text) instead of just the combobox; visually communicates that this slot is waiting to be filled | LOW | Add `border-dashed border-stone-200` wrapper around empty slots; keep the combobox inside |
| Week range label in header | "Lun 15 Sep – Dim 21 Sep" gives users a precise anchor; already in the current code | LOW | Already implemented via `formatWeekLabel`; preserve in new layout |

### Anti-Features (Deliberately Out of Scope)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Drag & drop to move meals | Feels like a natural gesture for rearranging | High implementation complexity (pointer events, drop targets, accessibility); value is marginal in a family context where users plan, not rearrange constantly | Explicit remove + re-add is sufficient; simpler and works on touch without gesture conflicts |
| Recipe photos/thumbnails in the grid | Makes the planner feel richer and more appetising | Grid columns become too tall to show a useful overview; images require storage/CDN and lazy loading complexity | Recipe titles with a link to the recipe detail page is enough context |
| Monthly calendar view | Familiar from Google Calendar | Different UX paradigm; meal planning at month granularity isn't useful (too far out); scope creep for this milestone | Week view navigation covers the planning horizon users actually need |
| Inline combobox on mobile (no modal) | Fewer taps to add a recipe | Virtual keyboard pushes content up; combobox popover overlaps slot content on small screens; harder to type in a cramped inline input | Modal gives full screen width for the search input and results list |
| Undo / undo history | Safety net for accidental remove | The remove action is cheap to undo manually (re-add); undo history requires event sourcing or complex state management | Instant re-add is the natural recovery path; no infrastructure needed |
| Multi-week scroll (infinite scroll) | Smooth feel vs discrete prev/next | Complex scroll snapping behaviour; harder to know which week is "current"; complicates mobile layout where swipe already means day navigation | Discrete prev/next week navigation is unambiguous and matches the user's mental model |

## Feature Dependencies

```
Mobile single-day view
    └──requires──> Mini week strip (strip only makes sense alongside day view)
    └──requires──> Swipe navigation (swipe operates on days, not weeks)
    └──requires──> Add via modal (modal triggered from within the day view)

Mini week strip
    └──requires──> Meal plans data per date (to show the count dot)

Today jump button
    └──enhances──> Week navigation (resets weekOffset to 0)

Empty slot affordance
    └──enhances──> Add recipe (visual cue that leads to the add action)

Past-day dimming
    └──requires──> today prop (already available)

Shopping list creation
    └──requires──> mealPlans state (already available in both layouts)
```

### Dependency Notes

- **Mini week strip requires single-day view:** The strip's purpose is to give weekly context when only one day is shown. It has no function alongside the full 7-column desktop grid.
- **Swipe navigation requires single-day view:** You can only swipe between days when displaying one day at a time. Swipe on the desktop grid would conflict with horizontal scroll.
- **Add via modal is a mobile-only variant:** The same `handleAdd` server action is called; only the trigger UI differs (modal on mobile, inline combobox on desktop).
- **Meal count dot requires mealPlans per date:** The strip component needs access to the same `mealPlans` state the parent already holds — no extra fetch needed.

## MVP Definition

This is a UI redesign milestone, not a greenfield product. MVP = all Active requirements from PROJECT.md, with existing functionality fully preserved.

### Launch With (v1 — this milestone)

- [x] Desktop horizontal 7-column week grid — core purpose of the redesign
- [x] Today column highlighted (desktop) — table stakes for any calendar layout
- [x] Mobile single-day view defaulting to today — table stakes on mobile
- [x] Mobile mini week strip — required for orientation alongside day view
- [x] Mobile swipe left/right — table stakes for touch navigation
- [x] Mobile add-recipe modal — required to replace inline combobox on small screens
- [x] Lunch/Dinner slots preserved on both layouts — domain model must not regress
- [x] Add and remove recipe on both layouts — core CRUD must not regress
- [x] Shopping list creation preserved — existing feature must not regress
- [x] Responsive breakpoint (`md:`) — the two layouts must not coexist visually

### Add After Validation (v1.x)

- [ ] Today jump button — add once navigation is shipped and tested; simple one-liner
- [ ] Past-day visual dimming — low effort polish; add in a follow-up commit
- [ ] Meal count dot on mini strip — useful but requires extra wiring; add once strip is stable
- [ ] Empty slot affordance — visual polish; non-blocking for function

### Future Consideration (v2+)

- [ ] Drag & drop meal rearrangement — only if user feedback shows strong demand; requires full gesture/accessibility redesign
- [ ] Recipe photos in the grid — only if image infrastructure (storage, CDN) is added to the stack
- [ ] Monthly overview — separate milestone if planning horizon needs extend beyond a week

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Desktop 7-col horizontal grid | HIGH | MEDIUM | P1 |
| Today highlight (desktop) | HIGH | LOW | P1 |
| Mobile single-day view | HIGH | MEDIUM | P1 |
| Mobile mini week strip | HIGH | MEDIUM | P1 |
| Mobile swipe navigation | HIGH | MEDIUM | P1 |
| Mobile add-recipe modal | HIGH | LOW | P1 |
| Responsive `md:` breakpoint | HIGH | LOW | P1 |
| Lunch/dinner slots preserved | HIGH | LOW | P1 |
| Add / remove recipe (both) | HIGH | LOW | P1 |
| Shopping list button preserved | HIGH | LOW | P1 |
| Week prev/next navigation | HIGH | LOW | P1 |
| Today jump button | MEDIUM | LOW | P2 |
| Past-day visual dimming | MEDIUM | LOW | P2 |
| Empty slot affordance | MEDIUM | LOW | P2 |
| Meal count dot on mini strip | MEDIUM | MEDIUM | P2 |
| Drag & drop | LOW | HIGH | P3 |
| Recipe thumbnails | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone launch
- P2: Should have — add in follow-up commit within milestone
- P3: Future milestone

## Sources

- Existing `PlanningWeek.tsx` — current feature inventory (direct code reading)
- `PROJECT.md` — validated/active/out-of-scope requirements as stated by project owner
- Comparable patterns: Google Calendar mobile (day view + week strip + swipe), Fantastical (mini strip), Apple Calendar (day strip on iPhone)
- Standard mobile UX patterns: touch gesture thresholds (50px+ horizontal delta), day-pill strip, modal-over-inline for search on small viewports

---
*Feature research for: meal planning calendar UI redesign (desktop week view + mobile day view)*
*Researched: 2026-09-15*
