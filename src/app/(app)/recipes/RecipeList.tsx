"use client";

import { useState } from "react";
import Link from "next/link";

type RecipeItem = {
  id: string;
  title: string;
  stepCount: number;
  ingredientCount: number;
  ingredientNames: string[];
  tags: string[];
};

type Props = {
  recipes: RecipeItem[];
};

export default function RecipeList({ recipes }: Props) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q === ""
    ? recipes
    : recipes.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredientNames.some((name) => name.toLowerCase().includes(q)) ||
        r.tags.some((tag) => tag.toLowerCase().includes(q))
      );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par titre, ingrédient ou tag..."
        className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
      />

      {filtered.length === 0 ? (
        <p className="text-stone-500 text-sm">Aucune recette trouvée.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="rounded-lg border border-stone-200 bg-white p-4 flex flex-col gap-2 hover:border-stone-400 transition-colors"
            >
              <p className="font-medium text-stone-900">{recipe.title}</p>
              <p className="text-sm text-stone-500">
                {recipe.stepCount} étape{recipe.stepCount !== 1 ? "s" : ""} · {recipe.ingredientCount} ingrédient{recipe.ingredientCount !== 1 ? "s" : ""}
              </p>
              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
