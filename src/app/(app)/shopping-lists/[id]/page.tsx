import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ShoppingList, ShoppingItem } from "@/lib/types";
import ShoppingListDetail from "./ShoppingListDetail";

export default async function ShoppingListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, { data: recipes }] = await Promise.all([
    supabase.from("shopping_lists").select("*").eq("id", id).single(),
    supabase.from("recipes").select("id, title").order("title", { ascending: true }),
  ]);

  if (!data) notFound();

  const list: ShoppingList = {
    ...data,
    status: data.status as ShoppingList["status"],
    items: data.items as ShoppingItem[],
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/shopping-lists"
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          ← Listes de courses
        </Link>
      </div>
      <ShoppingListDetail list={list} recipes={recipes ?? []} />
    </div>
  );
}
