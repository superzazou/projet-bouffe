"use client";

import { useState, useRef, useEffect } from "react";
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

function formatDayHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const label = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
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
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [bottomSheet, setBottomSheet] = useState<{ date: string; mealType: MealType } | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const selectedDayRef = useRef(selectedDay);
  const weekOffsetRef = useRef(weekOffset);
  const dayContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => { selectedDayRef.current = selectedDay; }, [selectedDay]);
  useEffect(() => { weekOffsetRef.current = weekOffset; }, [weekOffset]);

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
    setDeletingKey(mealPlanId);
    try {
      await deleteMealPlan(mealPlanId);
      setMealPlans((prev) => prev.filter((mp) => mp.id !== mealPlanId));
    } finally {
      setDeletingKey(null);
    }
  }

  const canGoPrev = weekOffset > -4;
  const canGoNext = weekOffset < 4;

  return (
    <div className="flex flex-col gap-6">
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

      {/* Mobile layout — visible below md breakpoint */}
      <div className="block md:hidden flex flex-col">
        {/* Week strip */}
        <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-200">
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
        </div>

        {/* Day heading */}
        <h2 className="text-lg font-semibold text-stone-900 px-4 pt-4 pb-2">{formatDayHeading(selectedDay)}</h2>

        {/* Day content — touch target for swipe */}
        <div ref={dayContentRef} className="flex flex-col gap-6 px-4 pb-4">
          {MEAL_TYPES.map((mealType) => {
            const slotPlans = getSlotPlans(selectedDay, mealType);
            return (
              <div key={mealType} className="flex flex-col gap-2">
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">{MEAL_LABELS[mealType]}</span>
                {slotPlans.map((plan) => {
                  const recipe = recipes.find((r) => r.id === plan.recipe_id);
                  if (!recipe) return null;
                  return (
                    <div key={plan.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-stone-800 flex-1 truncate min-w-0">{recipe.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(plan.id)}
                        disabled={deletingKey === plan.id}
                        className="shrink-0 min-h-[44px] px-3 text-sm text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                      >
                        Retirer
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setBottomSheet({ date: selectedDay, mealType })}
                  disabled={savingKey === `${selectedDay}-${mealType}`}
                  className="w-11 h-11 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg font-medium"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-4 pb-4">
          <button
            onClick={openListModal}
            disabled={upcomingRecipes.length === 0}
            className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Créer une liste de courses
          </button>
        </div>

        {/* Bottom sheet overlay */}
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
      </div>

      {/* Desktop layout — visible at md+ breakpoint */}
      <div className="hidden md:block flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={openListModal}
            disabled={upcomingRecipes.length === 0}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Créer une liste de courses
          </button>
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

        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[900px] border border-stone-200 rounded-lg divide-x divide-stone-200">
            {days.map((day, i) => {
              const dateStr = toDateStr(day);
              const isToday = dateStr === todayStr;
              return (
                <div key={dateStr} className="flex flex-col">
                  <div className="flex flex-col items-center gap-1 py-2 border-b border-stone-200">
                    <span className={`text-xs font-medium ${isToday ? "text-stone-900 font-semibold" : "text-stone-400"}`}>
                      {DAY_LABELS[i]}
                    </span>
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? "bg-stone-900 text-white" : "text-stone-700"}`}>
                      {day.getDate()}
                    </span>
                  </div>
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
                                  disabled={deletingKey === plan.id}
                                  className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>
    </div>
  );
}
