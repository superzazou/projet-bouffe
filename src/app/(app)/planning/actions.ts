"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MealType } from "@/lib/types";

export async function addMealPlan(
  date: string,
  mealType: MealType,
  recipeId: string
): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("meal_plans")
    .insert({ user_id: user.id, date, meal_type: mealType, recipe_id: recipeId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/planning");
  return data.id;
}

export async function deleteMealPlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/planning");
}
