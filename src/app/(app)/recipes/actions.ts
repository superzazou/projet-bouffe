"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RecipeStep, IngredientUnit } from "@/lib/types";

type IngredientInput = {
  id?: string;
  text: string;
  quantity: number;
  unit: IngredientUnit;
};

export async function createRecipe(
  title: string,
  steps: RecipeStep[],
  ingredients: IngredientInput[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({ user_id: user.id, title, steps })
    .select("id")
    .single();

  if (recipeError || !recipe) throw new Error(recipeError?.message ?? "Erreur création recette");

  if (ingredients.length > 0) {
    const { error } = await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing) => ({ recipe_id: recipe.id, text: ing.text, quantity: ing.quantity, unit: ing.unit }))
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function updateRecipe(
  recipeId: string,
  title: string,
  steps: RecipeStep[],
  ingredients: IngredientInput[]
) {
  const supabase = await createClient();

  const { error: recipeError } = await supabase
    .from("recipes")
    .update({ title, steps })
    .eq("id", recipeId);

  if (recipeError) throw new Error(recipeError.message);

  const { error: deleteError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId);

  if (deleteError) throw new Error(deleteError.message);

  if (ingredients.length > 0) {
    const { error } = await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing) => ({ recipe_id: recipeId, text: ing.text, quantity: ing.quantity, unit: ing.unit }))
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
  redirect(`/recipes/${recipeId}`);
}

