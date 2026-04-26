import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import PlanningWeek from "./PlanningWeek";
import type { MealPlan } from "@/lib/types";

export default async function PlanningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const today = new Date();
  const startOfRange = new Date(today);
  startOfRange.setDate(today.getDate() - 28);
  const endOfRange = new Date(today);
  endOfRange.setDate(today.getDate() + 28);

  const [{ data: mealPlans }, { data: recipes }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("id, date, meal_type, recipe_id")
      .gte("date", startOfRange.toISOString().split("T")[0])
      .lte("date", endOfRange.toISOString().split("T")[0]),
    supabase
      .from("recipes")
      .select("id, title")
      .order("title", { ascending: true }),
  ]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Projet Bouffe</h1>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Planning des repas</h2>
        <PlanningWeek
          initialMealPlans={(mealPlans ?? []) as MealPlan[]}
          recipes={recipes ?? []}
          today={today.toISOString().split("T")[0]}
        />
      </main>
    </div>
  );
}
