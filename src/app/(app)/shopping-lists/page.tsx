import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ShoppingList } from "@/lib/types";
import ShoppingListActions from "./ShoppingListActions";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

function ShoppingListCard({ list }: { list: ShoppingList }) {
  const totalItems = list.items.length;
  const inCartItems = list.items.filter((i) => i.status === "in_cart").length;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/shopping-lists/${list.id}`}
          className="font-medium text-stone-900 hover:text-stone-600 transition-colors line-clamp-1"
        >
          {list.title}
        </Link>
        <ShoppingListActions list={list} />
      </div>
      <div className="flex items-center gap-3 text-sm text-stone-500">
        <span>{inCartItems}/{totalItems} dans le panier</span>
        <span>·</span>
        <span>modifiée le {formatDate(list.updated_at)}</span>
      </div>
    </div>
  );
}

export default async function ShoppingListsPage() {
  const supabase = await createClient();

  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("*")
    .order("updated_at", { ascending: false });

  const allLists = (lists ?? []) as ShoppingList[];
  const activeLists = allLists.filter((l) => l.status === "active");
  const archivedLists = allLists.filter((l) => l.status === "archived");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Listes de courses</h2>
        <Link
          href="/shopping-lists/new"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
        >
          Nouvelle liste
        </Link>
      </div>

      {allLists.length === 0 ? (
        <p className="text-stone-500 text-sm">Aucune liste de courses pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {activeLists.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">Actives</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeLists.map((list) => (
                  <ShoppingListCard key={list.id} list={list} />
                ))}
              </div>
            </section>
          )}

          {archivedLists.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">Archivées</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {archivedLists.map((list) => (
                  <ShoppingListCard key={list.id} list={list} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
