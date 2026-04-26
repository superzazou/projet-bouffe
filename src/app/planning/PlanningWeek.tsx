"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MealPlan, MealType } from "@/lib/types";

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

  const baseMonday = getMondayOf(today);
  const currentMonday = addDays(baseMonday, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentMonday, i));

  function getMealPlan(date: string, mealType: MealType): MealPlan | undefined {
    return mealPlans.find((mp) => mp.date === date && mp.meal_type === mealType);
  }

  async function handleChange(date: string, mealType: MealType, recipeId: string) {
    const key = `${date}-${mealType}`;
    setSavingKey(key);
    const supabase = createClient();
    const existing = getMealPlan(date, mealType);

    if (recipeId === "") {
      if (existing) {
        await supabase.from("meal_plans").delete().eq("id", existing.id);
        setMealPlans((prev) => prev.filter((mp) => mp.id !== existing.id));
      }
    } else if (existing) {
      const { data } = await supabase
        .from("meal_plans")
        .update({ recipe_id: recipeId })
        .eq("id", existing.id)
        .select("id, date, meal_type, recipe_id, user_id, created_at")
        .single();
      if (data) {
        setMealPlans((prev) => prev.map((mp) => (mp.id === existing.id ? (data as MealPlan) : mp)));
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("meal_plans")
        .insert({ user_id: user.id, date, meal_type: mealType, recipe_id: recipeId })
        .select("id, date, meal_type, recipe_id, user_id, created_at")
        .single();
      if (data) {
        setMealPlans((prev) => [...prev, data as MealPlan]);
      }
    }

    setSavingKey(null);
  }

  const canGoPrev = weekOffset > -4;
  const canGoNext = weekOffset < 4;

  return (
    <div className="flex flex-col gap-6">
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
                      <select
                        disabled={isSaving}
                        value={plan?.recipe_id ?? ""}
                        onChange={(e) => handleChange(dateStr, mealType, e.target.value)}
                        className="flex-1 rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 disabled:opacity-50 bg-white"
                      >
                        <option value="">— Pas de repas prévu —</option>
                        {recipes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
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
