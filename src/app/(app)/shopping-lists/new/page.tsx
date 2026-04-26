"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createShoppingList } from "../actions";

export default function NewShoppingListPage() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const list = await createShoppingList(title.trim());
    router.push(`/shopping-lists/${list.id}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h2 className="text-xl font-semibold mb-6">Nouvelle liste de courses</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">
            Titre
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Courses semaine"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.push("/shopping-lists")}
            className="rounded-md px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
