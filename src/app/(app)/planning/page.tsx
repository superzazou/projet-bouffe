import { createClient } from "@/lib/supabase/server";
import PlanningWeek from "./PlanningWeek";

export default async function PlanningPage() {
  const supabase = await createClient();

  const today = new Date();
  const startOfRange = new Date(today);
  startOfRange.setDate(today.getDate() - 28);
  const endOfRange = new Date(today);
  endOfRange.setDate(today.getDate() + 28);

  const [{ data: mealPlans }, { data: recipes }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("id, date, meal_type, recipe_id, user_id, created_at")
      .gte("date", startOfRange.toISOString().split("T")[0])
      .lte("date", endOfRange.toISOString().split("T")[0]),
    supabase
      .from("recipes")
      .select("id, title")
      .order("title", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="text-xl font-semibold mb-6">Planning des repas</h2>
      <PlanningWeek
        initialMealPlans={mealPlans ?? []}
        recipes={recipes ?? []}
        today={today.toISOString().split("T")[0]}
      />
    </div>
  );
}
