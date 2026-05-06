"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MealPlan, MealType } from "@/lib/types";
import RecipeCombobox from "@/components/RecipeCombobox";
import { createShoppingListFromPlanning } from "../shopping-lists/actions";
import { deleteMealPlan, upsertMealPlan } from "./actions";

type Recipe = { id: string; title: string };

type Props = {
  initialMealPlans: MealPlan[];
  recipes: Recipe[];
  today: string;
};

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MEAL_LABELS: Record<MealType, string> = { lunch: "Midi", dinner: "Soir" };
const MEAL_TYPES: MealType[] = ["lunch", "dinner"];

function getMondayOf(dateStr: string): Date {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("fr-FR", opts)} – ${sunday.toLocaleDateString("fr-FR", opts)}`;
}

export default function PlanningWeek({ initialMealPlans, recipes, today }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(initialMealPlans);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [selectedPlanningRecipeIds, setSelectedPlanningRecipeIds] = useState<string[]>([]);
  const [creatingList, setCreatingList] = useState(false);
  const router = useRouter();

  const baseMonday = getMondayOf(today);
  const currentMonday = addDays(baseMonday, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentMonday, i));

  const upcomingRecipes = recipes.filter((r) =>
    mealPlans.some((mp) => mp.recipe_id === r.id && mp.date >= today)
  );

  function openListModal() {
    setListTitle("");
    setSelectedPlanningRecipeIds(upcomingRecipes.map((r) => r.id));
    setShowListModal(true);
  }

  async function handleCreateList() {
    if (!listTitle.trim() || selectedPlanningRecipeIds.length === 0) return;
    setCreatingList(true);
    try {
      const list = await createShoppingListFromPlanning(listTitle.trim(), selectedPlanningRecipeIds);
      setShowListModal(false);
      router.push(`/shopping-lists/${list.id}`);
    } finally {
      setCreatingList(false);
    }
  }

  function getMealPlan(date: string, mealType: MealType): MealPlan | undefined {
    return mealPlans.find((mp) => mp.date === date && mp.meal_type === mealType);
  }

  async function handleChange(date: string, mealType: MealType, recipeId: string) {
    const key = `${date}-${mealType}`;
    setSavingKey(key);
    const existing = getMealPlan(date, mealType);

    try {
      if (recipeId === "") {
        if (existing) {
          await deleteMealPlan(existing.id);
          setMealPlans((prev) => prev.filter((mp) => mp.id !== existing.id));
        }
      } else if (existing) {
        await upsertMealPlan(date, mealType, recipeId, existing.id);
        setMealPlans((prev) =>
          prev.map((mp) => (mp.id === existing.id ? { ...mp, recipe_id: recipeId } : mp))
        );
      } else {
        const newId = await upsertMealPlan(date, mealType, recipeId);
        setMealPlans((prev) => [
          ...prev,
          { id: newId, date, meal_type: mealType, recipe_id: recipeId, user_id: "", created_at: "" },
        ]);
      }
    } finally {
      setSavingKey(null);
    }
  }

  const canGoPrev = weekOffset > -4;
  const canGoNext = weekOffset < 4;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={openListModal}
          disabled={upcomingRecipes.length === 0}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Créer une liste de courses
        </button>
      </div>

      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-stone-900">Créer une liste de courses</h3>
            <input
              autoFocus
              type="text"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateList(); if (e.key === "Escape") setShowListModal(false); }}
              placeholder="Nom de la liste..."
              className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Recettes à inclure</p>
              {upcomingRecipes.map((recipe) => {
                const checked = selectedPlanningRecipeIds.includes(recipe.id);
                return (
                  <label key={recipe.id} className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedPlanningRecipeIds((ids) =>
                          checked ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id]
                        )
                      }
                      className="w-4 h-4 accent-stone-900"
                    />
                    <span className="text-sm text-stone-800">{recipe.title}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowListModal(false)}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-500 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateList}
                disabled={!listTitle.trim() || selectedPlanningRecipeIds.length === 0 || creatingList}
                className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {creatingList ? "Création..." : `Créer (${selectedPlanningRecipeIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <div className="flex flex-col gap-3">
        {days.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === today;
          return (
            <div
              key={dateStr}
              className={`rounded-lg border bg-white p-4 ${isToday ? "border-stone-500" : "border-stone-200"}`}
            >
              <p className={`text-sm font-semibold mb-3 ${isToday ? "text-stone-900" : "text-stone-500"}`}>
                {DAY_LABELS[i]}{" "}
                {day.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                {isToday && <span className="ml-2 text-xs font-normal text-stone-400">aujourd&apos;hui</span>}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                {MEAL_TYPES.map((mealType) => {
                  const key = `${dateStr}-${mealType}`;
                  const plan = getMealPlan(dateStr, mealType);
                  const isSaving = savingKey === key;
                  return (
                    <div key={mealType} className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-stone-400 w-8 shrink-0">{MEAL_LABELS[mealType]}</span>
                      <RecipeCombobox
                        recipes={recipes}
                        value={plan?.recipe_id ?? ""}
                        onChange={(id) => handleChange(dateStr, mealType, id)}
                        disabled={isSaving}
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
  );
}
