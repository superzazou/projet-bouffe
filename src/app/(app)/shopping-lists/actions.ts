"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ShoppingItem, RecipeIngredient } from "@/lib/types";

export async function createShoppingList(title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ title, items: [], user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/shopping-lists");
  return data;
}

export async function archiveShoppingList(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/shopping-lists");
}

export async function deleteShoppingList(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", id)
    .eq("status", "archived");
  if (error) throw new Error(error.message);
  revalidatePath("/shopping-lists");
}

export async function updateShoppingListItems(
  id: string,
  items: { id: string; label: string; status: string; position: number }[]
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ items })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/shopping-lists/${id}`);
}

export async function updateShoppingListTitle(id: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ title })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/shopping-lists/${id}`);
  revalidatePath("/shopping-lists");
}

function normalize(str: string): string {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function ingredientsToItems(
  existingItems: ShoppingItem[],
  ingredients: RecipeIngredient[]
): ShoppingItem[] {
  const items = [...existingItems];

  for (const ingredient of ingredients) {
    const label = `${ingredient.text} (${ingredient.quantity} ${ingredient.unit})`;
    const existingIndex = items.findIndex((item) => {
      const match = item.label.match(/^(.+) \((\d+) (\w+)\)$/);
      if (!match) return false;
      return (
        normalize(match[1]) === normalize(ingredient.text) &&
        match[3] === ingredient.unit
      );
    });

    if (existingIndex !== -1) {
      const existing = items[existingIndex];
      const match = existing.label.match(/\((\d+) \w+\)$/);
      if (match) {
        const existingQty = parseInt(match[1], 10);
        const newLabel = `${ingredient.text} (${existingQty + ingredient.quantity} ${ingredient.unit})`;
        items[existingIndex] = { ...existing, label: newLabel };
      }
    } else {
      const maxPosition = items.length > 0 ? Math.max(...items.map((i) => i.position)) : -1;
      items.push({
        id: crypto.randomUUID(),
        label,
        status: "to_buy",
        position: maxPosition + 1,
      });
    }
  }

  return items;
}

export async function addRecipesToShoppingList(
  listId: string,
  recipeIds: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [{ data: listData }, { data: ingredientsData }] = await Promise.all([
    supabase.from("shopping_lists").select("items").eq("id", listId).single(),
    supabase
      .from("recipe_ingredients")
      .select("id, recipe_id, text, quantity, unit")
      .in("recipe_id", recipeIds),
  ]);

  if (!listData) throw new Error("List not found");

  const updatedItems = ingredientsToItems(
    listData.items as ShoppingItem[],
    (ingredientsData ?? []) as RecipeIngredient[]
  );

  const { error } = await supabase
    .from("shopping_lists")
    .update({ items: updatedItems })
    .eq("id", listId);
  if (error) throw new Error(error.message);
  revalidatePath(`/shopping-lists/${listId}`);
}

export async function createShoppingListFromPlanning(
  title: string,
  recipeIds: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: ingredientsData } = await supabase
    .from("recipe_ingredients")
    .select("id, recipe_id, text, quantity, unit")
    .in("recipe_id", recipeIds);

  const items = ingredientsToItems([], (ingredientsData ?? []) as RecipeIngredient[]);

  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ title, items, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/shopping-lists");
  return data;
}
