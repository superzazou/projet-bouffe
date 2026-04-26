"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ShoppingList } from "@/lib/types";
import { archiveShoppingList, deleteShoppingList } from "./actions";

export default function ShoppingListActions({ list }: { list: ShoppingList }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleArchive() {
    setLoading(true);
    setOpen(false);
    await archiveShoppingList(list.id);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    setShowConfirm(false);
    await deleteShoppingList(list.id);
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
          disabled={loading}
          className="rounded p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Actions"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="8" cy="13" r="1.2" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-7 z-10 w-44 rounded-md border border-stone-200 bg-white shadow-md py-1">
            {list.status === "active" && (
              <button
                onClick={handleArchive}
                className="w-full px-3 py-2 text-sm text-left text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Archiver
              </button>
            )}
            {list.status === "archived" && (
              <button
                onClick={() => { setOpen(false); setShowConfirm(true); }}
                className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-stone-900">Supprimer la liste</h3>
            <p className="text-sm text-stone-600">
              Cette action est irréversible. La liste <span className="font-medium">{list.title}</span> sera définitivement supprimée.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-500 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
