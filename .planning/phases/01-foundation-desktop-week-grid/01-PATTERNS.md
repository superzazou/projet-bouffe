# Phase 01: Foundation + Desktop Week Grid - Pattern Map

**Mapped:** 2026-09-15
**Files analyzed:** 1 (single-component refactor)
**Analogs found:** 1 / 1 (the file being modified is its own analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/(app)/planning/PlanningWeek.tsx` | component (client) | request-response + optimistic mutation | itself (refactor) | exact — in-place rewrite |

---

## Pattern Assignments

### `src/app/(app)/planning/PlanningWeek.tsx` (client component, optimistic CRUD)

This is a full in-place rewrite. The analog is the current file itself. All patterns below are extracted directly from it and should be preserved or upgraded as noted.

---

**Directive + imports pattern** (lines 1–9):
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MealPlan, MealType } from "@/lib/types";
import RecipeCombobox from "@/components/RecipeCombobox";
import { createShoppingListFromPlanning } from "../shopping-lists/actions";
import { addMealPlan, deleteMealPlan } from "./actions";
```
Keep unchanged.

---

**Local type + constants pattern** (lines 11–21):
```typescript
type Recipe = { id: string; title: string };

type Props = {
  initialMealPlans: MealPlan[];
  recipes: Recipe[];
  today: string;
};

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MEAL_LABELS: Record<MealType, string> = { lunch: "Midi", dinner: "Soir" };
const MEAL_TYPES: MealType[] = ["lunch", "dinner"];
```
Keep unchanged. `today` prop signature stays the same (RSC interface).

---

**Date utility — FND-01 fix (getMondayOf):**
Replace lines 23–29 (UTC-parsing bug) with local-date parsing:
```typescript
// BEFORE (buggy — UTC midnight, wrong weekday in UTC-N)
function getMondayOf(dateStr: string): Date {
  const d = new Date(dateStr);
  ...
}

// AFTER (correct — local midnight)
function getMondayOf(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d); // local midnight
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}
```

---

**Date utility — FND-01 fix (toDateStr):**
Replace lines 37–39 (UTC-formatting bug) with local date parts:
```typescript
// BEFORE (buggy — UTC date string)
function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

// AFTER (correct — local date string)
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```

---

**Client-local todayStr derivation (Pattern 3 from RESEARCH.md):**
Add at top of component body to replace usage of the server `today` prop in display logic:
```typescript
// Derive local today string — do NOT use `today` prop for client-side comparisons
const localNow = new Date();
const todayStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
```
Then replace every `=== today` / `>= today` comparison in the component body with `todayStr`. Keep `today` prop in signature (RSC interface contract).

---

**State management pattern** (lines 48–55) — keep unchanged:
```typescript
const [weekOffset, setWeekOffset] = useState(0);
const [mealPlans, setMealPlans] = useState<MealPlan[]>(initialMealPlans);
const [savingKey, setSavingKey] = useState<string | null>(null);
const [showListModal, setShowListModal] = useState(false);
const [listTitle, setListTitle] = useState("");
const [selectedPlanningRecipeIds, setSelectedPlanningRecipeIds] = useState<string[]>([]);
const [creatingList, setCreatingList] = useState(false);
const router = useRouter();
```

---

**Week derivation pattern** (lines 57–59) — keep unchanged, but use `todayStr`:
```typescript
const baseMonday = getMondayOf(todayStr);   // was: getMondayOf(today)
const currentMonday = addDays(baseMonday, weekOffset * 7);
const days = Array.from({ length: 7 }, (_, i) => addDays(currentMonday, i));
```

---

**Optimistic add pattern** (lines 87–99):
```typescript
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
Keep unchanged.

---

**Optimistic remove pattern** (lines 101–104):
```typescript
async function handleRemove(mealPlanId: string) {
  await deleteMealPlan(mealPlanId);
  setMealPlans((prev) => prev.filter((mp) => mp.id !== mealPlanId));
}
```
Keep unchanged.

---

**Navigation row pattern** (lines 174–192) — merge with shopping list button per D-06:
```typescript
// NEW: single flex row with shopping list button on left, nav controls on right
<div className="flex items-center justify-between gap-4 flex-wrap">
  {/* Left: shopping list button (was its own div at lines 111–119) */}
  <button
    onClick={openListModal}
    disabled={upcomingRecipes.length === 0}
    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  >
    Créer une liste de courses
  </button>
  {/* Right: week navigation (was lines 174–192) */}
  <div className="flex items-center gap-4">
    <button
      onClick={() => setWeekOffset((o) => o - 1)}
      disabled={!canGoPrev}
      className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      ← Semaine précédente
    </button>
    <span className="text-sm font-medium text-stone-700 min-w-[180px] text-center">
      {weekOffset === 0 ? "Cette semaine" : formatWeekLabel(currentMonday)}
    </span>
    <button
      onClick={() => setWeekOffset((o) => o + 1)}
      disabled={!canGoNext}
      className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      Semaine suivante →
    </button>
  </div>
</div>
```

---

**Grid layout pattern** (replaces lines 194–251 vertical flex-col):
```typescript
// Outer scroll guard — overflow-x-auto ONLY; do NOT add overflow-hidden (clips RecipeCombobox dropdown)
<div className="overflow-x-auto">
  <div className="grid grid-cols-7 min-w-[900px] border border-stone-200 rounded-lg divide-x divide-stone-200">
    {days.map((day, i) => {
      const dateStr = toDateStr(day);
      const isToday = dateStr === todayStr;
      return (
        <div key={dateStr} className="flex flex-col">
          {/* Column header — D-01, D-02, D-04 */}
          <div className="flex flex-col items-center gap-1 py-2 border-b border-stone-200">
            <span className={`text-xs font-medium ${isToday ? "text-stone-900 font-semibold" : "text-stone-400"}`}>
              {DAY_LABELS[i]}
            </span>
            {/* D-01: badge circle on date number for today */}
            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? "bg-stone-900 text-white" : "text-stone-700"}`}>
              {day.getDate()}
            </span>
          </div>
          {/* Column body — SHR-01, SHR-02, SHR-03 */}
          <div className="flex flex-col gap-3 p-2">
            {MEAL_TYPES.map((mealType) => {
              const key = `${dateStr}-${mealType}`;
              const slotPlans = getSlotPlans(dateStr, mealType);
              const isSaving = savingKey === key;
              const addedRecipeIds = slotPlans.map((p) => p.recipe_id);
              return (
                <div key={mealType} className="flex flex-col gap-1.5">
                  <span className="text-xs text-stone-400">{MEAL_LABELS[mealType]}</span>
                  {slotPlans.map((plan) => {
                    const recipe = recipes.find((r) => r.id === plan.recipe_id);
                    if (!recipe) return null;
                    return (
                      <div key={plan.id} className="flex items-center gap-2">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="flex-1 truncate text-sm font-medium text-stone-800 hover:underline min-w-0"
                        >
                          {recipe.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemove(plan.id)}
                          className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Retirer
                        </button>
                      </div>
                    );
                  })}
                  <RecipeCombobox
                    recipes={recipes}
                    onAdd={(id) => handleAdd(dateStr, mealType, id)}
                    disabled={isSaving}
                    excludeIds={addedRecipeIds}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
</div>
```

---

**Shopping list modal pattern** (lines 121–172) — keep entirely unchanged:
```typescript
{showListModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    {/* ... full modal content unchanged ... */}
  </div>
)}
```
The modal JSX is correct as-is; only `today` → `todayStr` in the `upcomingRecipes` filter.

---

## Shared Patterns

### Stone palette
**Apply to:** all new Tailwind classes added in the rewrite
- Use only `stone-*` tokens (stone-50, stone-100, stone-200, stone-300, stone-400, stone-500, stone-700, stone-800, stone-900)
- No new color tokens introduced

### Error handling
**Apply to:** `handleAdd`, `handleRemove`, `handleCreateList`
- Pattern: `try { ... } finally { setSavingState(null/false); }` — already present, keep unchanged
- No `catch` block needed for UI errors — failures surface via thrown exceptions to error boundary

### "use client" directive
**Apply to:** `PlanningWeek.tsx` (line 1)
- Must remain as line 1 — no change

---

## No Analog Found

None. This is a single-component in-place refactor. All patterns come from the component itself.

---

## Metadata

**Analog search scope:** `src/app/(app)/planning/PlanningWeek.tsx` (the only file being modified)
**Files scanned:** 1
**Pattern extraction date:** 2026-09-15
