# Architecture Research

**Domain:** Responsive meal-planning calendar (Next.js 14 App Router, brownfield)
**Researched:** 2026-09-15
**Confidence:** HIGH

## Standard Architecture

### System Overview

The new planning view replaces the single `PlanningWeek.tsx` monolith with a thin state-controller root and separate layout subtrees for mobile and desktop. The RSC page (`page.tsx`) is untouched — it continues to fetch and pass `initialMealPlans`, `recipes`, and `today` as props.

```
page.tsx (RSC — unchanged)
  └─ PlanningWeek (root client — state controller)
       ├─ PlanningHeader (week nav + shopping list)
       │    └─ ShoppingListModal
       │
       ├─ PlanningDesktop (hidden on mobile: "md:grid")
       │    └─ DayColumn × 7
       │         └─ MealSlot × 2  [variant="desktop"]
       │               ├─ RecipeEntry × n
       │               └─ RecipeCombobox
       │
       └─ PlanningMobile ("md:hidden")
            ├─ WeekMiniBar
            └─ DayView  (swipe touch events)
                 └─ MealSlot × 2  [variant="mobile"]
                       ├─ RecipeEntry × n
                       └─ AddButton → AddRecipeModal
```

### Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `PlanningWeek` | Root state controller: mealPlans, weekOffset, selectedDate, savingKey. Derives days array and week label. Owns handleAdd / handleRemove calling Server Actions. | `PlanningWeek.tsx` |
| `PlanningHeader` | Renders week label, prev/next buttons, "Créer une liste de courses" button. Triggers ShoppingListModal. Shared by both layouts. | `PlanningHeader.tsx` |
| `ShoppingListModal` | Modal for shopping list creation (title input + recipe checkbox list). Self-contained UI state (listTitle, selectedIds). Calls `createShoppingListFromPlanning` and redirects. | `ShoppingListModal.tsx` |
| `PlanningDesktop` | Stateless. Renders 7 `DayColumn` in a `grid grid-cols-7` layout. Receives days, mealPlans, recipes, callbacks. Visible only at `md:` and above. | `PlanningDesktop.tsx` |
| `DayColumn` | Stateless. One column in the desktop grid: day header + 2 `MealSlot` components stacked vertically. Highlights today. | `DayColumn.tsx` |
| `PlanningMobile` | Stateless layout. Renders `WeekMiniBar` + `DayView` for the currently selected day. Visible only below `md:`. | `PlanningMobile.tsx` |
| `WeekMiniBar` | 7-item horizontal strip showing abbreviated day labels. Highlights today and selectedDate. Tap to select a day. | `WeekMiniBar.tsx` |
| `DayView` | Renders one day's two `MealSlot` components. Attaches `onTouchStart`/`onTouchEnd` handlers to detect swipe; calls `onSwipe('prev' \| 'next')` on threshold. | `DayView.tsx` |
| `MealSlot` | Renders one meal slot (Midi or Soir) for a given date+mealType. Accepts `variant="desktop"` (shows RecipeCombobox inline) or `variant="mobile"` (shows AddButton that triggers AddRecipeModal). | `MealSlot.tsx` |
| `RecipeEntry` | Pure display: recipe title as link + "Retirer" button. Shared between desktop and mobile. | `RecipeEntry.tsx` |
| `AddRecipeModal` | Mobile-only. Bottom-sheet / centered modal containing `RecipeCombobox`. Opens per-slot; closing resets selection. | `AddRecipeModal.tsx` |

## Recommended Project Structure

```
src/app/(app)/planning/
├── page.tsx                  # RSC — unchanged
├── actions.ts                # Server Actions — unchanged
├── PlanningWeek.tsx          # Root state controller (replaces old monolith)
├── PlanningHeader.tsx        # Week navigation + shopping list trigger
├── ShoppingListModal.tsx     # Shopping list creation modal (extracted from old monolith)
├── PlanningDesktop.tsx       # Desktop layout (7-col grid)
├── DayColumn.tsx             # One column in the desktop grid
├── PlanningMobile.tsx        # Mobile layout container
├── WeekMiniBar.tsx           # 7-dot week selector (mobile)
├── DayView.tsx               # Single-day view with swipe logic (mobile)
├── MealSlot.tsx              # Shared slot (desktop/mobile variant prop)
├── RecipeEntry.tsx           # Recipe link + remove button (shared)
└── AddRecipeModal.tsx        # Recipe search modal (mobile only)
```

### Structure Rationale

- **Co-located in `/planning/`:** All components serve a single route. Avoids cross-feature coupling. Consistent with the project's existing convention (`RecipeList.tsx` lives next to its page).
- **Shared `MealSlot` and `RecipeEntry`:** The data props are identical for desktop and mobile slots. A single component with a `variant` prop avoids duplicating recipe-entry rendering logic and keeps the remove/add callbacks in one place.
- **`ShoppingListModal` extracted:** Currently inlined in the monolith; it has independent state and enough lines to justify its own file.

## Architectural Patterns

### Pattern 1: State-Controller Root + Stateless Layout Children

**What:** `PlanningWeek` owns all data state and exposes stable callbacks (`onAdd`, `onRemove`, `onWeekChange`, `onDayChange`). All child components (`PlanningDesktop`, `PlanningMobile`, `MealSlot`, etc.) are stateless — they receive props and call callbacks.

**When to use:** When two or more sibling layout subtrees (mobile/desktop) share the same data but render differently. A single source of truth prevents state desync between the two views.

**Trade-offs:** Prop drilling reaches 3–4 levels (PlanningWeek → PlanningDesktop → DayColumn → MealSlot). This is acceptable here because the tree is bounded to one feature screen. React Context would add boilerplate without benefit at this scale.

**Example:**
```typescript
// PlanningWeek.tsx (root — owns all state)
export default function PlanningWeek({ initialMealPlans, recipes, today }: Props) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(initialMealPlans);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const baseMonday = getMondayOf(today);
  const currentMonday = addDays(baseMonday, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentMonday, i));

  async function handleAdd(date: string, mealType: MealType, recipeId: string) { ... }
  async function handleRemove(mealPlanId: string) { ... }

  return (
    <>
      <PlanningHeader ... />
      <PlanningDesktop
        days={days} mealPlans={mealPlans} recipes={recipes}
        today={today} savingKey={savingKey}
        onAdd={handleAdd} onRemove={handleRemove}
        className="hidden md:grid"
      />
      <PlanningMobile
        days={days} selectedDate={selectedDate} mealPlans={mealPlans}
        recipes={recipes} today={today} savingKey={savingKey}
        onAdd={handleAdd} onRemove={handleRemove}
        onDayChange={setSelectedDate}
        className="md:hidden"
      />
    </>
  );
}
```

### Pattern 2: CSS Breakpoint Toggle (no JS media query)

**What:** Desktop and mobile subtrees both exist in the DOM at all times. Visibility is controlled by Tailwind classes: `hidden md:grid` on `PlanningDesktop`, `md:hidden` on `PlanningMobile`. No `useMediaQuery` hook, no `window.innerWidth` reads.

**When to use:** When the two layouts share props from the same parent and the DOM overhead is small. The planning view renders 7 day columns (desktop) or 1 day view (mobile) — both are lightweight.

**Trade-offs:** Both subtrees render on the server and are sent to the client (minor HTML size increase). No layout shift or flash of wrong content — correct layout is visible immediately. Avoids `useEffect` + resize-listener complexity. The `md:` breakpoint (768px) is appropriate for a 7-column calendar grid.

**When NOT to use this:** If the desktop subtree were expensive (long lists, heavy images). In that case, use `useMediaQuery` and only render the active subtree. Not the case here.

### Pattern 3: Native Touch Swipe in DayView

**What:** `DayView` captures `onTouchStart` and `onTouchEnd` to detect horizontal swipe. On swipe past a 50px threshold, calls `onSwipe('prev' | 'next')` to the parent. No library dependency.

**When to use:** Simple directional swipe on a single element. More than this (multi-touch, velocity, momentum scrolling) would warrant a library.

**Trade-offs:** ~20 lines of code, zero dependencies. Touch events do not fire on desktop, so desktop behavior is unaffected.

**Example:**
```typescript
// DayView.tsx
export function DayView({ onSwipe, ... }: Props) {
  const startX = useRef<number | null>(null);

  return (
    <div
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (startX.current === null) return;
        const delta = e.changedTouches[0].clientX - startX.current;
        if (Math.abs(delta) > 50) onSwipe(delta < 0 ? 'next' : 'prev');
        startX.current = null;
      }}
    >
      {/* day content */}
    </div>
  );
}
```

### Pattern 4: MealSlot Variant Prop

**What:** `MealSlot` accepts a `variant` prop (`"desktop"` | `"mobile"`). Desktop variant renders `RecipeCombobox` inline. Mobile variant renders an `AddButton` that opens `AddRecipeModal`. The `RecipeEntry` list and remove logic is identical in both variants.

**When to use:** Two sibling views need to render the same data with different add-recipe UI. A single component avoids duplicating the recipe-entry rendering and the `onRemove` wiring.

**Example:**
```typescript
// MealSlot.tsx
export function MealSlot({ variant, date, mealType, plans, recipes, isSaving, onAdd, onRemove }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div>
      <span className="text-xs text-stone-400">{MEAL_LABELS[mealType]}</span>
      {plans.map((plan) => <RecipeEntry key={plan.id} plan={plan} recipes={recipes} onRemove={onRemove} />)}
      {variant === "desktop" && (
        <RecipeCombobox recipes={recipes} onAdd={(id) => onAdd(date, mealType, id)}
          disabled={isSaving} excludeIds={plans.map(p => p.recipe_id)} />
      )}
      {variant === "mobile" && (
        <>
          <button onClick={() => setModalOpen(true)}>+</button>
          {modalOpen && (
            <AddRecipeModal recipes={recipes} excludeIds={plans.map(p => p.recipe_id)}
              onAdd={(id) => { onAdd(date, mealType, id); setModalOpen(false); }}
              onClose={() => setModalOpen(false)} />
          )}
        </>
      )}
    </div>
  );
}
```

## Data Flow

### Request Flow

```
[User swipes or taps day]
    ↓
DayView.onTouchEnd / WeekMiniBar.onSelect
    ↓
PlanningMobile.onDayChange(newDate)
    ↓
PlanningWeek.setSelectedDate(newDate)     ← single state update, both layouts re-render
```

```
[User adds recipe (desktop)]
    ↓
RecipeCombobox.onAdd(recipeId)
    ↓
MealSlot → onAdd(date, mealType, recipeId)
    ↓
DayColumn → onAdd(date, mealType, recipeId)
    ↓
PlanningDesktop → onAdd(date, mealType, recipeId)
    ↓
PlanningWeek.handleAdd(date, mealType, recipeId)
    ↓ calls Server Action
addMealPlan(date, mealType, recipeId)     ← Supabase write
    ↓ returns newId
setMealPlans(prev => [...prev, newEntry]) ← optimistic local update
```

```
[User adds recipe (mobile)]
    ↓
AddButton tap → MealSlot opens AddRecipeModal
    ↓
RecipeCombobox.onAdd(recipeId) inside modal
    ↓
Same onAdd callback chain as desktop → PlanningWeek.handleAdd
Modal closes
```

### State Management

```
PlanningWeek (useState)
  mealPlans      ← initialMealPlans; mutated by handleAdd / handleRemove
  weekOffset     ← 0; changed by PlanningHeader prev/next buttons
  selectedDate   ← today; changed by WeekMiniBar tap or DayView swipe
  savingKey      ← null; set during async Server Action calls
  
No React Context.
No global state library.
Ephemeral modal state (listTitle, selectedIds, modalOpen) lives in 
ShoppingListModal and MealSlot respectively — not hoisted.
```

### Key Data Flows

1. **Week navigation:** PlanningHeader calls `onWeekChange(offset)` → PlanningWeek sets `weekOffset` → `currentMonday` re-derives → new `days[7]` array → both desktop and mobile subtrees receive updated days props.

2. **Day selection (mobile):** WeekMiniBar tap or DayView swipe → `onDayChange(dateStr)` → PlanningWeek sets `selectedDate` → PlanningMobile receives new `selectedDate` → DayView renders that day's MealSlots.

3. **Cross-week day navigation (mobile swipe):** When `selectedDate` is day 0 (Monday) and user swipes to prev, PlanningWeek decrements `weekOffset` and sets `selectedDate` to the new week's Sunday. When on day 6 (Sunday) and swipes next, increments `weekOffset` and sets `selectedDate` to new Monday. This keeps selectedDate always within the displayed week.

4. **Optimistic mutation:** Server Action returns the new `id`. `setMealPlans` appends a locally-constructed `MealPlan` object immediately. On error, re-throw surfacing the error boundary.

## Build Order

Build bottom-up: leaf components first, then compose upward.

| Step | Component | Why First |
|------|-----------|-----------|
| 1 | `RecipeEntry` | No dependencies. Pure display. |
| 2 | `AddRecipeModal` | Depends on `RecipeCombobox` (existing). Needed by MealSlot mobile variant. |
| 3 | `MealSlot` | Depends on `RecipeEntry` + `AddRecipeModal` + `RecipeCombobox`. Core shared unit. |
| 4 | `DayColumn` | Depends on `MealSlot`. Desktop-only. |
| 5 | `WeekMiniBar` | Standalone. Mobile week selector. |
| 6 | `DayView` | Depends on `MealSlot`. Contains swipe logic. |
| 7 | `PlanningDesktop` | Depends on `DayColumn`. |
| 8 | `PlanningMobile` | Depends on `WeekMiniBar` + `DayView`. |
| 9 | `ShoppingListModal` | Extracted from old monolith. Depends on Server Action only. |
| 10 | `PlanningHeader` | Depends on `ShoppingListModal`. |
| 11 | `PlanningWeek` | Root: wires all children together. Replaces old monolith. |

This order means each component can be built and tested independently before the root orchestrates them.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (personal app, 1 user) | Current approach is correct. All state in root, no global store needed. |
| Multi-user SaaS | Add React Query or SWR for server state sync (e.g. real-time collaboration on shared planning). useState-based optimistic updates become complex at that point. |
| Multiple planning views | Extract state to a `usePlanningState` custom hook so it can be reused across views without restructuring the component tree. |

## Anti-Patterns

### Anti-Pattern 1: Duplicating Slot Logic for Mobile vs Desktop

**What people do:** Create `MealSlotDesktop` and `MealSlotMobile` as two entirely separate components with near-identical recipe-entry rendering.

**Why it's wrong:** Any change to RecipeEntry display (styling, remove button behavior) must be applied in two places. They drift apart over time.

**Do this instead:** Single `MealSlot` with a `variant` prop. Only the add-recipe affordance differs (combobox vs modal button).

### Anti-Pattern 2: useMediaQuery + Conditional Rendering in Root

**What people do:** Use a `useMediaQuery('(min-width: 768px)')` hook in `PlanningWeek` to conditionally render `<PlanningDesktop>` or `<PlanningMobile>` — not both.

**Why it's wrong:** Causes a flash of the wrong layout on first render (before JS hydrates and the hook evaluates). Requires `useEffect` to read `window.innerWidth`. More code for no benefit here.

**Do this instead:** Render both subtrees, toggle visibility with Tailwind's `hidden md:grid` / `md:hidden`. Both exist in the DOM; the correct one is always visible immediately from CSS alone.

### Anti-Pattern 3: Hoisting Modal State to Root

**What people do:** Track which slot's AddRecipeModal is open in `PlanningWeek` state (e.g. `addingSlotKey: string | null`).

**Why it's wrong:** Unnecessary prop drilling of open/close callbacks through PlanningMobile → DayView → MealSlot. Modal open/close is purely local UI state.

**Do this instead:** Modal open state lives in `MealSlot` itself (just `useState(false)`). Only the result of the user's recipe selection (the `recipeId`) bubbles up via `onAdd`.

### Anti-Pattern 4: Adding a Swipe Library Dependency

**What people do:** Install `react-swipeable` or a touch gesture library for the mobile day swipe.

**Why it's wrong:** The requirement is a simple horizontal swipe on one element. That is 20 lines of native touch events. A library adds a dependency for trivial functionality and may conflict with scroll behavior.

**Do this instead:** Native `onTouchStart`/`onTouchEnd` in `DayView`. Implement the threshold check inline.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase | Via existing Server Actions (`addMealPlan`, `deleteMealPlan`) — no changes | Do not bypass Server Actions by calling Supabase browser client from new components |
| RecipeCombobox | Existing shared component (`src/components/RecipeCombobox.tsx`) | Reused as-is in both MealSlot desktop variant and AddRecipeModal |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `page.tsx` → `PlanningWeek` | Props: `initialMealPlans`, `recipes`, `today` | page.tsx interface is unchanged |
| `PlanningWeek` → layout children | Props + callbacks: days array, mealPlans slice, savingKey, onAdd, onRemove | Callbacks are stable function references (no useCallback needed at this scale) |
| `MealSlot` → `AddRecipeModal` | Local state: `modalOpen`. Passes `onAdd` callback | Modal result flows up via callback, not context |
| `DayView` → `PlanningWeek` | `onSwipe('prev' \| 'next')` → parent computes new selectedDate and weekOffset | Swipe logic is pure detection; day arithmetic stays in root |

## Sources

- Codebase analysis: `src/app/(app)/planning/PlanningWeek.tsx` (direct read, HIGH confidence)
- Codebase analysis: `src/app/(app)/planning/page.tsx` (direct read, HIGH confidence)
- Project requirements: `.planning/PROJECT.md` (direct read, HIGH confidence)
- Codebase architecture: `.planning/codebase/ARCHITECTURE.md` (direct read, HIGH confidence)
- Pattern: Next.js docs — Client Components and RSC boundaries (standard App Router pattern, HIGH confidence)

---
*Architecture research for: Responsive meal-planning calendar view (projet-bouffe)*
*Researched: 2026-09-15*
