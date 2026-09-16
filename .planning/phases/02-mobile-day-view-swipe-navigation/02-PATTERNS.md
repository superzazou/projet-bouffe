# Phase 02: Mobile Day View + Swipe Navigation — Pattern Map

**Mapped:** 2026-09-16
**Files analyzed:** 1 modified file (PlanningWeek.tsx — all mobile work lives here)
**Analogs found:** 1 / 1 (self-analog — mobile layer extends the same file)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/(app)/planning/PlanningWeek.tsx` | component (client) | request-response + event-driven | Self (existing desktop layer in same file) | exact |

No new files are created in this phase. All work is an additive extension of the existing `PlanningWeek.tsx`.

---

## Pattern Assignments

### `src/app/(app)/planning/PlanningWeek.tsx` (mobile layer addition)

**Analog:** Same file — existing desktop layer starting at line 116.

---

### Pattern 1: State Declaration Block

**Source:** `PlanningWeek.tsx` lines 55–62 (existing state)

```typescript
// Existing state — do NOT change:
const [weekOffset, setWeekOffset] = useState(0);
const [mealPlans, setMealPlans] = useState<MealPlan[]>(initialMealPlans);
const [savingKey, setSavingKey] = useState<string | null>(null);
const [showListModal, setShowListModal] = useState(false);
const [listTitle, setListTitle] = useState("");
const [selectedPlanningRecipeIds, setSelectedPlanningRecipeIds] = useState<string[]>([]);
const [creatingList, setCreatingList] = useState(false);

// New state — add after existing declarations:
const [selectedDay, setSelectedDay] = useState<string>(todayStr);
const [bottomSheet, setBottomSheet] = useState<{ date: string; mealType: MealType } | null>(null);
const [deletingKey, setDeletingKey] = useState<string | null>(null);
```

**Why:** Matches the project's `useState` local state pattern (no global store). All state in PascalCase component, boolean states verb-based (`creatingList`, not `isCreatingList`).

---

### Pattern 2: Stale Closure Prevention via useRef

**Source:** No existing analog — this is new. Follows React `useRef` convention already used in other components.

```typescript
// Add after state declarations, before any handlers:
const selectedDayRef = useRef(selectedDay);
const weekOffsetRef = useRef(weekOffset);
useEffect(() => { selectedDayRef.current = selectedDay; }, [selectedDay]);
useEffect(() => { weekOffsetRef.current = weekOffset; }, [weekOffset]);
const dayContentRef = useRef<HTMLDivElement>(null);
```

**Why:** Touch event listeners attached in a `useEffect([], [])` capture state at mount time. Refs expose mutable current values inside handlers without re-attaching listeners.

---

### Pattern 3: Imperative Touch Event Handler (useEffect, passive: false)

**Source:** No existing analog in codebase. Follows React + DOM imperative pattern. `{ passive: false }` is mandatory on `touchmove` only.

```typescript
// Add after the ref declarations:
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
    if (Math.abs(dx) < 30) return;

    const currentDay = selectedDayRef.current;
    const currentOffset = weekOffsetRef.current;
    const [y, m, d] = currentDay.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay();
    const weekIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Mon…6=Sun

    if (dx < 0) {
      // Swipe left → next day
      if (weekIndex === 6 && currentOffset < 4) {
        setWeekOffset(currentOffset + 1);
        setSelectedDay(toDateStr(addDays(getMondayOf(currentDay), 7)));
      } else if (weekIndex < 6) {
        setSelectedDay(toDateStr(addDays(date, 1)));
      }
    } else {
      // Swipe right → previous day
      if (weekIndex === 0 && currentOffset > -4) {
        setWeekOffset(currentOffset - 1);
        setSelectedDay(toDateStr(addDays(getMondayOf(currentDay), -1)));
      } else if (weekIndex > 0) {
        setSelectedDay(toDateStr(addDays(date, -1)));
      }
    }
  }

  el.addEventListener("touchstart", onTouchStart, { passive: true });
  el.addEventListener("touchmove", onTouchMove, { passive: false });
  el.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
  };
}, []); // empty deps — reads state via refs
```

**Critical:** React synthetic `onTouchMove` does NOT block scroll (React 17+ delegates to root). Must use imperative `addEventListener`. `passive: false` is required on `touchmove` for `preventDefault` to work.

---

### Pattern 4: handleRemove with deletingKey Guard

**Source:** `PlanningWeek.tsx` lines 108–111 (existing handleRemove — no guard)

```typescript
// Current (lines 108–111) — replace with:
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

**Why:** Matches the `handleAdd` guard pattern (lines 94–106) which uses `setSavingKey` as an in-flight guard. Same shape: set key → try/await action + optimistic update → finally clear key.

Desktop "Retirer" button should also gain `disabled={deletingKey === plan.id}` for consistency.

---

### Pattern 5: Layout Branching (mobile/desktop visibility)

**Source:** `AppLayout.tsx` lines 52–85 — `hidden md:flex` for desktop sidebar, `md:hidden` for mobile header/drawer.

```tsx
// Exact pattern from AppLayout.tsx:
<aside className="hidden md:flex ...">    {/* desktop only */}
<header className="md:hidden ...">        {/* mobile only */}

// Apply to PlanningWeek.tsx return value:
return (
  <div className="flex flex-col gap-6">
    {showListModal && ( /* existing modal — unchanged */ )}

    {/* Mobile layer — new */}
    <div className="block md:hidden">
      {/* MobileWeekStrip + day heading + slots + bottom sheet */}
    </div>

    {/* Desktop layer — Phase 1, untouched */}
    <div className="hidden md:block">
      {/* existing overflow-x-auto grid */}
    </div>
  </div>
);
```

**Source:** `PlanningWeek.tsx` line 117 — existing outer `div` is already `flex flex-col gap-6`. Wrap existing desktop grid in `hidden md:block`.

---

### Pattern 6: Today Badge Circle (stone-900)

**Source:** `PlanningWeek.tsx` lines 210–213 (desktop day header badge)

```tsx
// Desktop pattern — exact classes to reuse on mobile mini-bar pills:
<span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
  isToday ? "bg-stone-900 text-white" : "text-stone-700"
}`}>
  {day.getDate()}
</span>
```

**Apply on mobile mini-bar pills (D-05):**
- Today: `w-7 h-7 rounded-full bg-stone-900` (empty span — D-04 says no date number in pill)
- Selected, not today: `w-7 h-7 rounded-full bg-stone-200`
- Neither: no badge span rendered

```tsx
// Mobile pill pattern:
{days.map((day, i) => {
  const dateStr = toDateStr(day);
  const isToday = dateStr === todayStr;
  const isSelected = dateStr === selectedDay;
  const hasBadge = isToday || isSelected;
  const badgeClass = isToday ? "bg-stone-900" : "bg-stone-200";
  return (
    <button
      key={dateStr}
      onClick={() => setSelectedDay(dateStr)}
      className="flex flex-col items-center justify-center min-h-[44px] gap-0.5"
    >
      <span className={`text-xs font-medium ${isSelected || isToday ? "text-stone-900 font-semibold" : "text-stone-500"}`}>
        {DAY_LABELS[i]}
      </span>
      {hasBadge && (
        <span className={`w-7 h-7 rounded-full ${badgeClass}`} />
      )}
    </button>
  );
})}
```

---

### Pattern 7: Modal Overlay (fixed inset-0 + backdrop)

**Source:** `PlanningWeek.tsx` lines 148–198 (shopping list modal)

```tsx
// Shopping list modal — lines 148–149:
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
  <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">

// Bottom sheet uses same fixed/z-50/bg-black/40 backdrop, but different inner panel:
{bottomSheet !== null && (
  <>
    <div
      className="fixed inset-0 z-40 bg-black/40"
      onClick={() => setBottomSheet(null)}
    />
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

**Close buttons copy pattern from shopping list modal (lines 186–194):** `border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-500 transition-colors`.

---

### Pattern 8: RecipeCombobox Usage

**Source:** `PlanningWeek.tsx` lines 245–249 (desktop slot)

```tsx
// Desktop usage — copy this pattern for the bottom sheet:
<RecipeCombobox
  recipes={recipes}
  onAdd={(id) => handleAdd(dateStr, mealType, id)}
  disabled={isSaving}
  excludeIds={addedRecipeIds}
/>
```

Props interface (from `src/components/RecipeCombobox.tsx`):
```typescript
type Props = {
  recipes: Recipe[];           // { id: string; title: string }[]
  onAdd: (recipeId: string) => void;
  disabled?: boolean;
  excludeIds?: string[];
};
```

The `"+"` button on mobile must use `onClick` (not `onTouchEnd`) to avoid conflicting with the swipe gesture handlers.

---

### Pattern 9: Server Actions Call Pattern

**Source:** `PlanningWeek.tsx` lines 94–111 — `handleAdd` and `handleRemove`.

```typescript
// handleAdd (lines 94–106) — optimistic add:
async function handleAdd(date: string, mealType: MealType, recipeId: string) {
  const key = `${date}-${mealType}`;
  setSavingKey(key);
  try {
    const newId = await addMealPlan(date, mealType, recipeId);
    setMealPlans((prev) => [
      ...prev,
      { id: newId, date, meal_type: mealType, recipe_id: recipeId, user_id: "", created_at: "" },
    ]);
  } finally {
    setSavingKey(null);
  }
}
```

Both `handleAdd` and `handleRemove` are reused as-is on mobile — no new server action calls needed.

---

### Pattern 10: Day Heading Formatter

**Source:** `PlanningWeek.tsx` line 48 — `formatWeekLabel` uses `fr-FR` locale for date formatting.

```typescript
// formatWeekLabel pattern (lines 45–49):
function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("fr-FR", opts)} – ${sunday.toLocaleDateString("fr-FR", opts)}`;
}

// New formatDayHeading — same locale convention:
function formatDayHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);  // local parse, same as getMondayOf
  const label = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
  // e.g. "Mercredi 16 septembre"
}
```

---

## Shared Patterns

### Authentication
**Not applicable to this phase.** Auth is enforced at layout level (`src/app/(app)/layout.tsx`). Server Actions already guard with `auth.getUser()` — no change needed.

### Error Handling
**Source:** `PlanningWeek.tsx` lines 94–111 — `try/finally` with loading state; no `catch` block (errors propagate).

Pattern to copy:
```typescript
// No catch block — errors propagate to error.tsx boundary
try {
  const result = await serverAction(...);
  setLocalState(/* update */);
} finally {
  setLoadingKey(null);
}
```

### Tailwind Responsive Breakpoint
**Source:** `AppLayout.tsx` lines 52, 72, 89 — `hidden md:flex`, `md:hidden`, `md:hidden`.

Rule: `md:` prefix = "desktop only". No prefix = "all sizes" (override with `md:hidden` to hide on desktop).

| Mobile only | `md:hidden` |
| Desktop only | `hidden md:block` or `hidden md:flex` |

### Color Palette
**Source:** `PlanningWeek.tsx` throughout — `stone-*` only.

| Token | Usage |
|-------|-------|
| `stone-900` | Primary text, today badge background, confirm buttons |
| `stone-700` | Secondary text, nav labels |
| `stone-500` | Muted text, placeholders |
| `stone-400` | Disabled/dim labels |
| `stone-200` | Selected-not-today badge background, borders |
| `stone-100` | Hover backgrounds |
| `white` | Card backgrounds, badge text on dark |

No new color tokens are introduced in this phase.

### Touch Target Minimum Size
**Source:** `AppLayout.tsx` line 74 — `p-2` on icon button (≥ 44px effective tap target).

All mobile interactive elements must have `min-h-[44px]` or equivalent padding. The "+" button, pills, and "Retirer" button must all meet this threshold.

---

## No Analog Found

No files in this phase have zero analog. All patterns either self-reference `PlanningWeek.tsx` or reference `AppLayout.tsx`.

---

## Metadata

**Analog search scope:** `src/app/(app)/planning/`, `src/components/`, `src/app/(app)/`
**Files scanned:** 5 (PlanningWeek.tsx, page.tsx, actions.ts, AppLayout.tsx, types.ts)
**Pattern extraction date:** 2026-09-16
