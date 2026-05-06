"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MealType } from "@/lib/types";

export async function deleteMealPlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/planning");
}

export async function upsertMealPlan(
  date: string,
  mealType: MealType,
  recipeId: string,
  existingId?: string
): Promise<string> {
  const supabase = await createClient();

  if (existingId) {
    const { data, error } = await supabase
      .from("meal_plans")
      .update({ recipe_id: recipeId })
      .eq("id", existingId)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data.id;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("meal_plans")
    .insert({ user_id: user.id, date, meal_type: mealType, recipe_id: recipeId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}
