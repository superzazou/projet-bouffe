# Phase 02: Mobile Day View + Swipe Navigation — Research

**Researched:** 2026-09-16
**Domain:** React touch gestures, responsive layout branching, mobile-first UI within an existing Next.js + Tailwind component
**Confidence:** HIGH (all findings derived from direct codebase reads and locked CONTEXT.md decisions)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Swap instantané — pas d'animation slide. Le contenu du jour change immédiatement au relâcher du doigt, sans transition CSS.
- **D-02:** Le swipe se déclenche au relâcher si le déplacement horizontal est ≥ seuil (~30–40 px). En dessous du seuil, l'action est annulée.
- **D-03:** L'axe de geste est déterminé au premier mouvement : si Δx > Δy, on verrouille sur swipe et on appelle `preventDefault` pour bloquer le scroll vertical. Sinon le scroll natif passe librement. Attachment impératif `useEffect` avec `{ passive: false }` (requis pour `preventDefault` sur les event listeners touch).
- **D-04:** Chaque pill affiche l'abréviation du jour seule ("Lun", "Mar"…) — pas de numéro de date dans la pill.
- **D-05:** Trois états visuels dans les pills: Aujourd'hui = `bg-stone-900 text-white`; Sélectionné non-aujourd'hui = `bg-stone-200 text-stone-900`; Non sélectionné = texte normal sans badge.
- **D-06:** La mini-barre affiche toujours les 7 jours de la semaine courante. Elle se met à jour automatiquement quand un swipe traverse une frontière de semaine.
- **D-07:** Bottom sheet — panel qui remonte depuis le bas de l'écran.
- **D-08:** Fermeture du bottom sheet par tap sur le fond sombre OU par bouton "Annuler" / "×". Pas de geste swipe-bas pour fermer.
- **D-09:** Contenu du bottom sheet = `RecipeCombobox` existant réutilisé tel quel.
- **D-10:** Label complet du jour courant affiché au-dessus des slots (ex : "Mercredi 16 septembre").
- **D-11:** Swipe seul pour la navigation de semaine sur mobile. Pas de flèches prev/next semaine affichées sur mobile.
- **D-12:** Bouton "Créer une liste de courses" visible en bas de la vue jour (sous les slots Midi/Soir), pas dans l'en-tête.

### Claude's Discretion

- Sub-component extraction (local variables vs inline JSX) within PlanningWeek.tsx — executor's judgment.
- Touch handler implementation detail (ref-based stale closure vs deps array reattachment) — executor's choice.

### Deferred Ideas (OUT OF SCOPE)

- PLH-01: Bouton Aujourd'hui
- PLH-02: Jours passés en opacité réduite
- PLH-03: Point indicateur repas planifiés
- Animation slide du swipe — swap instantané décidé
- Navigation semaine explicite par flèches sur mobile
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOB-01 | L'utilisateur voit un seul jour à la fois sur mobile, aujourd'hui par défaut | New `selectedDay` state initialized to `todayStr`; mobile layout uses `block md:hidden` |
| MOB-02 | Mini-barre en haut affiche les 7 jours en pills ; tap pour sélectionner | `grid grid-cols-7` strip derived from `currentMonday + weekOffset`; DAY_LABELS already exists |
| MOB-03 | Swipe gauche/droite pour naviguer entre jours ; passage automatique de semaine aux limites | Imperative useEffect + passive:false touchmove + 30px threshold + week boundary logic |
| MOB-04 | Bouton + ouvre une modale de recherche de recette | New `bottomSheet` state; bottom sheet renders RecipeCombobox with fixed/z-50 overlay |
| SHR-02 (mobile) | Ajout de recette via bottom sheet | RecipeCombobox drop-in into bottom sheet; calls existing `handleAdd` |
| SHR-03 (mobile) | Suppression de recette depuis la vue mobile | "Retirer" button in mobile recipe row; `deletingKey` state prevents double-tap |
</phase_requirements>

---

## Summary

This phase adds a mobile day-view layer to the existing `PlanningWeek.tsx` component. No new packages are required. No new Server Actions are needed. The page.tsx RSC, the `addMealPlan`/`deleteMealPlan` actions, and all date utilities are already correct and stable from Phase 1.

The work is entirely in `PlanningWeek.tsx`: add three state variables (`selectedDay`, `bottomSheet`, `deletingKey`), attach imperative touch event listeners with `{ passive: false }` to enable gesture discrimination, and render a mobile layout branch (`block md:hidden`) alongside the existing desktop grid (`hidden md:block`). The `RecipeCombobox` component drops into the bottom sheet without modification.

The single highest-risk implementation detail is the touch handler stale closure problem. Touch event listeners are attached once in a `useEffect` and capture state values at the time of attachment. Since `selectedDay` and `weekOffset` must be read accurately inside those handlers, they must be exposed via `useRef` rather than read directly from state.

**Primary recommendation:** Extend `PlanningWeek.tsx` in a single plan. Add state, refs, touch logic, and both layout branches in one coherent pass. Do not split into sub-components in separate files — everything stays in `PlanningWeek.tsx` per CONTEXT.md canonical_refs.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mobile day view rendering | Browser / Client (`PlanningWeek.tsx`) | — | Interactive state (selectedDay, bottomSheet), touch events |
| Mini-bar week strip | Browser / Client | — | Derived from weekOffset state, no server round-trip |
| Swipe gesture detection | Browser / Client | — | Native touch events; server cannot participate |
| Bottom sheet overlay | Browser / Client | — | Conditional rendering gated on `bottomSheet` state |
| Recipe add (mobile) | API / Backend (`addMealPlan`) | Browser (optimistic setMealPlans) | Existing server action; optimistic UI already implemented |
| Recipe remove (mobile) | API / Backend (`deleteMealPlan`) | Browser (optimistic setMealPlans) | Existing server action; same pattern |
| Data fetch | Frontend Server (page.tsx RSC) | — | Unchanged — RSC passes props to PlanningWeek |

---

## Standard Stack

### Core (no new packages)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React | 19.2.4 | Component rendering, useState, useRef, useEffect | Already installed [VERIFIED: codebase] |
| Next.js | 16.2.4 | App Router, RSC, Server Actions | Already installed [VERIFIED: codebase] |
| Tailwind CSS | 4.x | Utility classes for layout, color, spacing, touch targets | Already installed [VERIFIED: codebase] |
| TypeScript | 5.x | Type safety | Already installed [VERIFIED: codebase] |

**No new packages are required for this phase.** The constraint "React + Tailwind uniquement" is fully respected — all gesture handling uses native DOM touch events exposed through React's `useRef` + imperative `addEventListener`.

### Package Legitimacy Audit

Not applicable — no new packages are installed in this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
RSC page.tsx (server)
  → props: { initialMealPlans, recipes, today }
       ↓
PlanningWeek.tsx (client)
  ├── [block md:hidden] Mobile Layer
  │     ├── MobileWeekStrip (7 pills from currentMonday)
  │     │     → tap pill → setSelectedDay
  │     ├── Day heading ("Mercredi 16 septembre")
  │     ├── Slot: Midi
  │     │     ├── RecipeRow × N → "Retirer" → deleteMealPlan (Server Action)
  │     │     └── "+" button → setBottomSheet({ date, mealType: "lunch" })
  │     ├── Slot: Soir
  │     │     ├── RecipeRow × N → "Retirer" → deleteMealPlan (Server Action)
  │     │     └── "+" button → setBottomSheet({ date, mealType: "dinner" })
  │     ├── "Créer une liste de courses" → openListModal()
  │     └── [bottomSheet !== null] Bottom Sheet Overlay
  │           ├── Backdrop → setBottomSheet(null)
  │           ├── RecipeCombobox → onAdd → handleAdd → addMealPlan (Server Action)
  │           └── "Fermer" / "×" → setBottomSheet(null)
  │
  └── [hidden md:block] Desktop Layer (Phase 1, untouched)
        └── 7-column grid (existing)
```

Data flows: touch events → selectedDay/weekOffset state → derived `currentMonday` → 7 pills + day content for `selectedDay`

### Recommended State Additions in PlanningWeek.tsx

Three new state variables are needed. All other state (`weekOffset`, `mealPlans`, `savingKey`, `showListModal`, etc.) is reused without modification. [VERIFIED: codebase]

```typescript
// Add alongside existing state declarations
const [selectedDay, setSelectedDay] = useState<string>(todayStr);
const [bottomSheet, setBottomSheet] = useState<{ date: string; mealType: MealType } | null>(null);
const [deletingKey, setDeletingKey] = useState<string | null>(null);
```

### Pattern 1: Touch Gesture with Axis Lock and Stale Closure Prevention

This is the core technical pattern. The handler reads `selectedDay` and `weekOffset` via refs to avoid stale closures.

```typescript
// Source: React docs + MDN EventTarget.addEventListener (passive option)
// [ASSUMED] - pattern based on training knowledge of React + DOM touch events

const selectedDayRef = useRef(selectedDay);
const weekOffsetRef = useRef(weekOffset);
useEffect(() => { selectedDayRef.current = selectedDay; }, [selectedDay]);
useEffect(() => { weekOffsetRef.current = weekOffset; }, [weekOffset]);

const dayContentRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = dayContentRef.current;
  if (!el) return;

  let startX = 0;
  let startY = 0;
  let lockAxis: "h" | "v" | null = null;

  function onTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    lockAxis = null;
  }

  function onTouchMove(e: TouchEvent) {
    if (lockAxis === null) {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 5 || dy > 5) {
        lockAxis = dx > dy ? "h" : "v";
      }
    }
    if (lockAxis === "h") {
      e.preventDefault(); // requires { passive: false }
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (lockAxis !== "h") return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 30) return; // below threshold — no navigation

    const currentSelectedDay = selectedDayRef.current;
    const currentWeekOffset = weekOffsetRef.current;
    const [y, m, d] = currentSelectedDay.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...6=Sat
    const weekIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Mon...6=Sun

    if (dx < 0) {
      // Swipe left → next day
      if (weekIndex === 6) {
        // Sunday → Monday of next week
        setWeekOffset(currentWeekOffset + 1);
        const nextMonday = addDays(getMondayOf(currentSelectedDay), 7);
        setSelectedDay(toDateStr(nextMonday));
      } else {
        setSelectedDay(toDateStr(addDays(date, 1)));
      }
    } else {
      // Swipe right → previous day
      if (weekIndex === 0) {
        // Monday → Sunday of previous week
        setWeekOffset(currentWeekOffset - 1);
        const prevSunday = addDays(getMondayOf(currentSelectedDay), -1);
        setSelectedDay(toDateStr(prevSunday));
      } else {
        setSelectedDay(toDateStr(addDays(date, -1)));
      }
    }
  }

  el.addEventListener("touchstart", onTouchStart, { passive: true });
  el.addEventListener("touchmove", onTouchMove, { passive: false }); // passive: false REQUIRED
  el.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
  };
}, []); // empty deps — handler reads state via refs, not captured state
```

### Pattern 2: Day Heading Formatter (fr-FR locale, capitalized)

```typescript
// Source: MDN Intl.DateTimeFormat
// [ASSUMED] - standard JS/TypeScript pattern

function formatDayHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const label = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
  // e.g. "Mercredi 16 septembre"
}
```

### Pattern 3: Mobile Week Strip (7 Pills)

The strip is derived from the same `currentMonday` already computed for the desktop grid. [VERIFIED: codebase]

```tsx
// All 7 days come from existing `days` array (Array.from({ length: 7 }, ...) from currentMonday)
// Pill rendering:
{days.map((day, i) => {
  const dateStr = toDateStr(day);
  const isToday = dateStr === todayStr;
  const isSelected = dateStr === selectedDay;
  const hasBadge = isToday || isSelected;
  const badgeClass = isToday
    ? "bg-stone-900 text-white"
    : "bg-stone-200 text-stone-900";
  const labelClass = hasBadge
    ? "font-semibold"
    : "text-stone-500";

  return (
    <button
      key={dateStr}
      onClick={() => setSelectedDay(dateStr)}
      className="flex flex-col items-center justify-center min-h-[44px] gap-0.5"
    >
      <span className={`text-xs font-medium ${labelClass}`}>
        {DAY_LABELS[i]}
      </span>
      {hasBadge && (
        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${badgeClass}`}>
          {day.getDate()}
        </span>
      )}
    </button>
  );
})}
```

Note: D-04 states pills show day abbreviation only, no date number. The badge circle confirms selection visually but does NOT add a date number inside the pill. The `day.getDate()` shown inside the badge in the pattern above contradicts D-04. Per D-04 the badge is empty — it is just a visual indicator circle, and the label above shows "Lun"/"Mar" etc. The badge circle contains no text. Adjust accordingly: `<span className={`w-7 h-7 rounded-full ${badgeClass}`} />` (empty span for circle).

### Pattern 4: Bottom Sheet Overlay

```tsx
// Source: UI-SPEC.md Component Inventory [VERIFIED: codebase]
{bottomSheet !== null && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 z-40 bg-black/40"
      onClick={() => setBottomSheet(null)}
    />
    {/* Sheet */}
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl p-6 max-h-[80vh] flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">Ajouter un repas</h3>
        <button
          onClick={() => setBottomSheet(null)}
          className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-stone-900"
        >
          ×
        </button>
      </div>
      <RecipeCombobox
        recipes={recipes}
        onAdd={(id) => {
          handleAdd(bottomSheet.date, bottomSheet.mealType, id);
          setBottomSheet(null);
        }}
        disabled={savingKey === `${bottomSheet.date}-${bottomSheet.mealType}`}
        excludeIds={getSlotPlans(bottomSheet.date, bottomSheet.mealType).map((p) => p.recipe_id)}
      />
      <button
        onClick={() => setBottomSheet(null)}
        className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-500 transition-colors"
      >
        Fermer
      </button>
    </div>
  </>
)}
```

### Pattern 5: handleRemove with deletingKey Guard (mobile)

The existing `handleRemove` has no loading guard. Mobile "Retirer" must show disabled state during deletion. [VERIFIED: codebase — current handleRemove lacks this guard]

```typescript
async function handleRemove(mealPlanId: string) {
  setDeletingKey(mealPlanId);
  try {
    await deleteMealPlan(mealPlanId);
    setMealPlans((prev) => prev.filter((mp) => mp.id !== mealPlanId));
  } finally {
    setDeletingKey(null);
  }
}
```

Usage on mobile recipe row button:
```tsx
<button
  type="button"
  onClick={() => handleRemove(plan.id)}
  disabled={deletingKey === plan.id}
  className="min-h-[44px] text-sm text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  Retirer
</button>
```

**Note:** The desktop `handleRemove` call should also be updated to use `deletingKey` for consistency, though the desktop "Retirer" button is smaller (`text-xs`) and the guard was not required in Phase 1. The planner should include this desktop update as part of the same plan to avoid inconsistency.

### Pattern 6: Layout Branching with Tailwind md: Breakpoint

```tsx
return (
  <div className="flex flex-col gap-6">
    {/* Shopping list modal — shared, unchanged */}
    {showListModal && ( ... )}

    {/* Mobile layer — new */}
    <div className="block md:hidden">
      {/* MobileWeekStrip, day content, bottom sheet */}
    </div>

    {/* Desktop layer — Phase 1, untouched */}
    <div className="hidden md:block">
      {/* Existing week navigation header + grid */}
    </div>
  </div>
);
```

[VERIFIED: codebase — existing PlanningWeek.tsx outer `div` is `flex flex-col gap-6`]

### Anti-Patterns to Avoid

- **Reading state inside imperative touch handlers without refs:** Handler closures capture state at attachment time. `selectedDay` read inside `onTouchEnd` without a ref will always show the initial value. Always use `selectedDayRef.current` and `weekOffsetRef.current` inside touch handlers.
- **Attaching touchmove with `{ passive: true }`:** Default since Chrome 51. If `passive: true` (or omitted), `preventDefault()` has no effect and the browser scrolls. The `{ passive: false }` flag on `touchmove` is mandatory for the axis-lock to block scroll.
- **Using React synthetic events (onTouchMove) for preventDefault:** React 17+ attaches delegated events to the root element. `e.preventDefault()` in a React `onTouchMove` handler does NOT prevent native scroll. Must use imperative `addEventListener`.
- **Opening bottom sheet via React `onTouchEnd` synthetic event:** This conflicts with the imperative touch handler. Use a separate `<button onClick={...}>` for the "+" button. The swipe touch events are on the day content div, not the "+" button.
- **Bottom sheet dropdown clipping:** `RecipeCombobox` renders a dropdown `ul` with `absolute z-10 mt-1`. Inside the bottom sheet's `overflow-y-auto` container, the dropdown may be clipped by the overflow boundary. If clipping occurs, move the combobox outside the scrollable area or set `overflow: visible` on the sheet when the dropdown is open.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal swipe detection | Custom gesture library | Native `touchstart/touchmove/touchend` with imperative `addEventListener` | Tech constraint; native events are sufficient for a single threshold-based gesture |
| Day/week date arithmetic | Custom date math | Existing `addDays()`, `getMondayOf()`, `toDateStr()` already in PlanningWeek.tsx | Already implemented and timezone-corrected in Phase 1 |
| Recipe search in bottom sheet | Custom search input | `RecipeCombobox` component — drop-in via `recipes`, `onAdd`, `disabled`, `excludeIds` props | Already built, tested in Phase 1 desktop view |
| Shopping list CTA (mobile) | New button/action | Reuse existing `openListModal()` and `showListModal` state | Same button, same action — just repositioned at bottom of mobile day view |

**Key insight:** This phase adds zero new abstractions. All building blocks exist. The implementation is purely assembly: connect existing state → new layout branch → existing actions.

---

## Common Pitfalls

### Pitfall 1: Stale Closure in Touch Event Handlers

**What goes wrong:** `selectedDay` inside `onTouchEnd` always shows the value at the time the `useEffect` ran — typically the initial render value (`todayStr`). Navigation appears to work once, then breaks.

**Why it happens:** `useEffect(() => { ... }, [])` captures state values at first render. Touch handlers are not recreated when state changes.

**How to avoid:** Expose mutable state via `useRef`. Keep refs in sync:
```typescript
useEffect(() => { selectedDayRef.current = selectedDay; }, [selectedDay]);
useEffect(() => { weekOffsetRef.current = weekOffset; }, [weekOffset]);
```
Read `selectedDayRef.current` (not `selectedDay`) inside touch handlers.

**Warning signs:** Swipe right from any day always navigates to the same "previous" day regardless of current position; or navigating forward appears stuck.

### Pitfall 2: passive: true Silently Disables preventDefault

**What goes wrong:** The page scrolls vertically even during horizontal swipes. The axis-lock appears to do nothing.

**Why it happens:** Browsers default touch listeners to `passive: true` since Chrome 56. `preventDefault()` in a passive listener is ignored silently — no error thrown.

**How to avoid:** Explicitly pass `{ passive: false }` on the `touchmove` listener only:
```typescript
el.addEventListener("touchmove", onTouchMove, { passive: false });
```

**Warning signs:** No scroll blocking during swipe; dev console warning "Unable to preventDefault inside passive event listener".

### Pitfall 3: React onTouchMove Synthetic Event Does Not Block Scroll

**What goes wrong:** Developer uses `<div onTouchMove={(e) => e.preventDefault()} />`. Scroll still occurs.

**Why it happens:** React 17+ attaches all synthetic events as non-passive listeners on the root `#__next` element, not the target element. `preventDefault()` on a delegated event does not reliably prevent scroll.

**How to avoid:** Always use imperative `useRef` + `addEventListener` for touch scroll blocking. Do not use React synthetic `onTouchMove` for this purpose.

### Pitfall 4: weekOffset and selectedDay Desync

**What goes wrong:** After a week-boundary swipe, `weekOffset` is updated but `currentMonday` still reflects the old week for one render cycle, causing the mini-bar to show the wrong week briefly or the day heading to show the wrong date.

**Why it happens:** Both `setWeekOffset` and `setSelectedDay` are called separately; React may batch or sequence them differently.

**How to avoid:** Call both state setters in the same synchronous block within the touch handler. React batches state updates within the same event handler:
```typescript
// Both called together — React batches into a single re-render
setWeekOffset(currentWeekOffset + 1);
setSelectedDay(toDateStr(nextMonday));
```

**Warning signs:** Mini-bar flickers to wrong week for one frame after week boundary crossing.

### Pitfall 5: Bottom Sheet RecipeCombobox Dropdown Clipping

**What goes wrong:** The recipe dropdown in the bottom sheet is cut off by `overflow-y-auto` on the sheet container.

**Why it happens:** `RecipeCombobox` positions its dropdown `ul` with `absolute z-10`. An ancestor with `overflow: hidden` or `overflow-y: auto` clips positioned children.

**How to avoid:** Verify by testing with many recipes. If clipped, either: (a) use `overflow-visible` on the sheet and scroll the outer window, or (b) ensure the combobox appears high enough in the sheet that the dropdown opens downward within the visible area. The sheet's `max-h-[80vh]` provides ample room in practice.

---

## Existing Code Inventory (VERIFIED from codebase reads)

[VERIFIED: codebase]

### State Variables in PlanningWeek.tsx (existing, no change)

| Variable | Type | Purpose |
|----------|------|---------|
| `weekOffset` | `number` | Which week is displayed (0 = current week) |
| `mealPlans` | `MealPlan[]` | All meal plans for ±28 days |
| `savingKey` | `string \| null` | Prevents double-add; key = `${date}-${mealType}` |
| `showListModal` | `boolean` | Shopping list creation modal |
| `listTitle` | `string` | Shopping list name input |
| `selectedPlanningRecipeIds` | `string[]` | Recipes selected for shopping list |
| `creatingList` | `boolean` | Shopping list creation in-flight |

### Date Utilities (existing, no change)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `getMondayOf(dateStr)` | `(string) => Date` | Returns Monday of the week containing dateStr (UTC-safe) |
| `addDays(date, n)` | `(Date, number) => Date` | Returns new Date n days from date |
| `toDateStr(date)` | `(Date) => string` | Returns "YYYY-MM-DD" string (local time, not UTC) |
| `formatWeekLabel(monday)` | `(Date) => string` | Returns "dd mmm – dd mmm" fr-FR range label |

### Server Actions (existing, no change)

| Action | Signature | Return |
|--------|-----------|--------|
| `addMealPlan` | `(date, mealType, recipeId) => Promise<string>` | Returns new meal_plan UUID |
| `deleteMealPlan` | `(id) => Promise<void>` | Deletes and revalidates /planning |

### Handlers (existing, compatible)

| Handler | Signature | Reuse on mobile |
|---------|-----------|-----------------|
| `handleAdd` | `(date, mealType, recipeId) => void` | YES — call from bottom sheet onAdd |
| `handleRemove` | `(mealPlanId) => void` | YES — but must add `deletingKey` guard for mobile |
| `getSlotPlans` | `(date, mealType) => MealPlan[]` | YES — used to compute excludeIds for RecipeCombobox |
| `openListModal` | `() => void` | YES — same CTA on mobile |

### RecipeCombobox Props Interface (existing)

```typescript
type Props = {
  recipes: Recipe[];           // { id: string; title: string }[]
  onAdd: (recipeId: string) => void;
  disabled?: boolean;
  excludeIds?: string[];
};
```

[VERIFIED: codebase — src/components/RecipeCombobox.tsx]

---

## Runtime State Inventory

Not applicable — this is a greenfield addition to an existing component. No renames, refactors, or migrations. No stored data is affected. Phase does not change data schema, column names, or stored keys.

---

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js 24.11.1 | Next.js dev server | ✓ | Confirmed via CLAUDE.md |
| npm | Package management | ✓ | lockfile present |
| Supabase local | Data (meal_plans, recipes) | ✓ | Running on port 54321 per config.toml |
| Browser with touch events | Mobile swipe testing | ✓ | All modern browsers; Chrome DevTools touch emulation sufficient for development |

**No missing dependencies.** This phase requires no new installs. The only external dependency is a browser for manual touch testing — Chrome DevTools device emulation is sufficient during development; real device testing is recommended before phase sign-off.

---

## Validation Architecture

### Test Framework

No test framework is present in this project. [VERIFIED: codebase — no jest.config, vitest.config, or *.test.* files found]

| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | None |
| Quick run command | `npm run lint` (only automated check available) |
| Full suite command | `npm run build` (type-check + build) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOB-01 | Today is selected by default | manual | — | ❌ No test framework |
| MOB-02 | Mini-bar shows 7 pills, tap selects day | manual | — | ❌ No test framework |
| MOB-03 | Swipe left/right navigates days; week boundary crossing works | manual (touch device or Chrome DevTools) | — | ❌ No test framework |
| MOB-04 | "+" opens bottom sheet with RecipeCombobox | manual | — | ❌ No test framework |
| SHR-02 (mobile) | Select recipe in bottom sheet adds it to slot | manual | — | ❌ No test framework |
| SHR-03 (mobile) | "Retirer" removes recipe from slot | manual | — | ❌ No test framework |

### Sampling Rate

- **Per task commit:** `npm run lint` — catches TypeScript errors and ESLint violations
- **Per wave merge:** `npm run build` — full type-check + Next.js build
- **Phase gate:** `npm run build` green + manual touch test on Chrome DevTools device emulation

### Wave 0 Gaps

No test framework exists. Installing one (vitest + @testing-library/react) is out of scope for this phase per the CONTEXT.md constraint ("React + Tailwind uniquement" — no new libraries). Manual verification against the requirement list is the validation strategy for this phase.

- [ ] Manual test checklist: MOB-01 through MOB-04, SHR-02 (mobile), SHR-03 (mobile) — to be verified via `/gsd-verify-work`

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase adds no new auth surfaces |
| V3 Session Management | No | No new session logic |
| V4 Access Control | Existing | Server actions already guard with `auth.getUser()` |
| V5 Input Validation | Minimal | `recipeId` passed to Server Action comes from the recipes list — not free text input |
| V6 Cryptography | No | No new crypto |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Double-tap race on add/remove | Tampering | `savingKey`/`deletingKey` guard — disable button while action is in-flight |
| XSS via recipe name in UI | Tampering | React escapes all text by default; no `dangerouslySetInnerHTML` used |
| Unauthorized recipe add/remove | Elevation of Privilege | `auth.getUser()` in Server Actions; user_id enforced at DB level |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React batches `setWeekOffset` + `setSelectedDay` calls made in the same synchronous event handler into a single re-render | Pitfall 4 | Mini-bar flickers; easily fixed by using `useReducer` instead |
| A2 | Chrome DevTools touch emulation accurately reflects `preventDefault` behavior for axis-lock testing | Environment Availability | Axis-lock may not work on real iOS Safari; requires real device smoke test before sign-off |
| A3 | `RecipeCombobox` dropdown does not clip under the bottom sheet's `overflow-y-auto` in practice (few recipes scenario is fine; many recipes scenario needs spot-check) | Pitfall 5 | Dropdown hidden; user cannot select recipes in bottom sheet |
| A4 | The `passive: false` requirement applies to `touchmove` only; `touchstart` and `touchend` can remain passive | Pattern 1: Touch Gesture | Low risk — passive handlers for start/end do not call preventDefault |

---

## Open Questions

1. **deletingKey on desktop recipe rows**
   - What we know: Desktop `handleRemove` currently has no loading guard (`deletingKey` does not exist yet)
   - What's unclear: Does the planner add `deletingKey` support to desktop "Retirer" in the same plan, or only mobile?
   - Recommendation: Include desktop `handleRemove` update in the same plan — it is a 3-line change and prevents inconsistency between breakpoints.

2. **weekOffset bounds on mobile**
   - What we know: `canGoPrev = weekOffset > -4` and `canGoNext = weekOffset < 4` exist for desktop arrow navigation
   - What's unclear: Should swipe navigation also respect these bounds? Currently week limit is ±4 weeks.
   - Recommendation: Yes — swipe should check the same bounds before crossing a week boundary. If at the limit, the swipe that would exceed it should be ignored (no day change). Easy to add to the boundary-crossing logic.

---

## Sources

### Primary (HIGH confidence)
- `src/app/(app)/planning/PlanningWeek.tsx` — Full component read; all state, handlers, utilities, and rendering patterns confirmed
- `src/components/RecipeCombobox.tsx` — Props interface and rendering confirmed
- `src/app/(app)/planning/actions.ts` — Server action signatures confirmed
- `src/lib/types.ts` — `MealPlan`, `MealType` types confirmed
- `.planning/phases/02-mobile-day-view-swipe-navigation/02-CONTEXT.md` — All implementation decisions (D-01 to D-12)
- `.planning/phases/02-mobile-day-view-swipe-navigation/02-UI-SPEC.md` — Full component inventory, interaction contract, color/spacing contract

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — MOB-01 to MOB-04, SHR-02/SHR-03 requirement definitions

### Tertiary (LOW confidence)
- Touch event patterns (imperative addEventListener, passive:false, stale closure via ref) — [ASSUMED] from training knowledge; standard React + DOM pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed from codebase reads
- Architecture: HIGH — all patterns derived from existing code + locked CONTEXT.md decisions
- Touch gesture implementation: MEDIUM — core pattern is standard, but stale closure behavior and passive event handling are assumptions from training knowledge
- Pitfalls: MEDIUM — derived from training knowledge of React touch event gotchas

**Research date:** 2026-09-16
**Valid until:** 2026-10-16 (stable stack; no fast-moving dependencies)
