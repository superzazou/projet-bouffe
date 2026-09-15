"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MealPlan, MealType } from "@/lib/types";
import RecipeCombobox from "@/components/RecipeCombobox";
import { createShoppingListFromPlanning } from "../shopping-lists/actions";
import { addMealPlan, deleteMealPlan } from "./actions";

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
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("fr-FR", opts)} – ${sunday.toLocaleDateString("fr-FR", opts)}`;
}

export default function PlanningWeek({ initialMealPlans, recipes, today: _today }: Props) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [weekOffset, setWeekOffset] = useState(0);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(initialMealPlans);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [selectedPlanningRecipeIds, setSelectedPlanningRecipeIds] = useState<string[]>([]);
  const [creatingList, setCreatingList] = useState(false);
  const router = useRouter();

  const baseMonday = getMondayOf(todayStr);
  const currentMonday = addDays(baseMonday, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentMonday, i));

  const upcomingRecipes = recipes.filter((r) =>
    mealPlans.some((mp) => mp.recipe_id === r.id && mp.date >= todayStr)
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

  function getSlotPlans(date: string, mealType: MealType): MealPlan[] {
    return mealPlans.filter((mp) => mp.date === date && mp.meal_type === mealType);
  }

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

  async function handleRemove(mealPlanId: string) {
    await deleteMealPlan(mealPlanId);
    setMealPlans((prev) => prev.filter((mp) => mp.id !== mealPlanId));
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
          const isToday = dateStr === todayStr;
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
                  const slotPlans = getSlotPlans(dateStr, mealType);
                  const isSaving = savingKey === key;
                  const addedRecipeIds = slotPlans.map((p) => p.recipe_id);
                  return (
                    <div key={mealType} className="flex-1 flex flex-col gap-1.5">
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
  );
}
