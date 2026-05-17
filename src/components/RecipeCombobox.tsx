"use client";

import { useEffect, useRef, useState } from "react";

type Recipe = { id: string; title: string };

type Props = {
  recipes: Recipe[];
  onAdd: (recipeId: string) => void;
  disabled?: boolean;
  excludeIds?: string[];
};

export default function RecipeCombobox({ recipes, onAdd, disabled, excludeIds = [] }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const available = recipes.filter((r) => !excludeIds.includes(r.id));
  const filtered = query.trim() === ""
    ? available
    : available.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  function handleSelect(id: string) {
    onAdd(id);
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center rounded-md border border-stone-200 bg-white focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-500">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder="— Ajouter une recette —"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent px-3 py-1.5 text-sm text-stone-700 placeholder:text-stone-400 outline-none disabled:opacity-50"
        />
        {query && (
          <button
            type="button"
            onMouseDown={() => { setOpen(false); setQuery(""); }}
            className="px-2 text-stone-300 hover:text-stone-600"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-stone-200 bg-white shadow-md">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-stone-400">Aucune recette trouvée</li>
          ) : (
            filtered.map((r) => (
              <li
                key={r.id}
                onMouseDown={() => handleSelect(r.id)}
                className="cursor-pointer px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
              >
                {r.title}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
