"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Recipe = { id: string; title: string };

type Props = {
  recipes: Recipe[];
  value: string;
  onChange: (recipeId: string) => void;
  disabled?: boolean;
};

export default function RecipeCombobox({ recipes, value, onChange, disabled }: Props) {
  const selected = recipes.find((r) => r.id === value) ?? null;
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim() === ""
    ? recipes
    : recipes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setEditing(false);
    setQuery("");
  }

  function handleClear() {
    onChange("");
    setOpen(false);
    setEditing(false);
    setQuery("");
  }

  function startEditing() {
    setEditing(true);
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (selected && !editing) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Link
          href={`/recipes/${selected.id}`}
          className="flex-1 truncate text-sm font-medium text-stone-800 hover:underline min-w-0"
        >
          {selected.title}
        </Link>
        {!disabled && (
          <>
            <button
              type="button"
              onClick={startEditing}
              className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200 transition-colors"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Retirer
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center rounded-md border border-stone-200 bg-white focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-500">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder="— Pas de repas prévu —"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent px-3 py-1.5 text-sm text-stone-700 placeholder:text-stone-400 outline-none disabled:opacity-50"
        />
        {editing && (
          <button
            type="button"
            onMouseDown={() => { setEditing(false); setOpen(false); setQuery(""); }}
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
