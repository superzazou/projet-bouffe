"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
