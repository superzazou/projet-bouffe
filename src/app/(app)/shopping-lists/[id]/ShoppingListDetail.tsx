"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ShoppingList, ShoppingItem } from "@/lib/types";
import { updateShoppingListItems, archiveShoppingList, updateShoppingListTitle, addRecipesToShoppingList } from "../actions";
import { useRouter } from "next/navigation";

type Recipe = { id: string; title: string };

function SortableItem({
  item,
  archived,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  archived: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: archived,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 py-2 px-3 rounded-md bg-white border border-stone-200 group"
    >
      {!archived && (
        <button
          {...attributes}
          {...listeners}
          className="text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Réordonner"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="4" cy="3" r="1" />
            <circle cx="10" cy="3" r="1" />
            <circle cx="4" cy="7" r="1" />
            <circle cx="10" cy="7" r="1" />
            <circle cx="4" cy="11" r="1" />
            <circle cx="10" cy="11" r="1" />
          </svg>
        </button>
      )}
      <button
        onClick={() => !archived && onToggle(item.id)}
        disabled={archived}
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          item.status === "in_cart"
            ? "bg-stone-900 border-stone-900"
            : "border-stone-300 hover:border-stone-500"
        } ${archived ? "opacity-60 cursor-default" : "cursor-pointer"}`}
        aria-label={item.status === "in_cart" ? "Décocher" : "Cocher"}
      >
        {item.status === "in_cart" && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,5 4,7.5 8.5,2.5" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-sm ${item.status === "in_cart" ? "line-through text-stone-400" : "text-stone-800"}`}>
        {item.label}
      </span>
      {!archived && (
        <button
          onClick={() => onDelete(item.id)}
          className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Supprimer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function ShoppingListDetail({ list: initialList, recipes }: { list: ShoppingList; recipes: Recipe[] }) {
  const [list, setList] = useState(initialList);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialList.title);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [addingRecipes, setAddingRecipes] = useState(false);
  const router = useRouter();
  const archived = list.status === "archived";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const toBuyItems = list.items.filter((i) => i.status === "to_buy").sort((a, b) => a.position - b.position);
  const inCartItems = list.items.filter((i) => i.status === "in_cart").sort((a, b) => a.position - b.position);

  async function saveItems(items: ShoppingItem[]) {
    setSaving(true);
    try {
      await updateShoppingListItems(list.id, items);
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(id: string) {
    const updated = list.items.map((item) =>
      item.id === id
        ? { ...item, status: item.status === "to_buy" ? "in_cart" as const : "to_buy" as const }
        : item
    );
    setList((l) => ({ ...l, items: updated }));
    saveItems(updated);
  }

  function handleDelete(id: string) {
    const updated = list.items.filter((item) => item.id !== id);
    setList((l) => ({ ...l, items: updated }));
    saveItems(updated);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const maxPosition = toBuyItems.length > 0 ? Math.max(...toBuyItems.map((i) => i.position)) : -1;
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      status: "to_buy",
      position: maxPosition + 1,
    };
    const updated = [...list.items, newItem];
    setList((l) => ({ ...l, items: updated }));
    setNewLabel("");
    saveItems(updated);
  }

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = toBuyItems.findIndex((i) => i.id === active.id);
    const newIndex = toBuyItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(toBuyItems, oldIndex, newIndex).map((item, index) => ({
      ...item,
      position: index,
    }));

    const updated = [...inCartItems, ...reordered];
    setList((l) => ({ ...l, items: updated }));
    saveItems(updated);
  }, [toBuyItems, inCartItems]);

  async function handleArchive() {
    try {
      await archiveShoppingList(list.id);
      router.push("/shopping-lists");
    } catch {
      setError("Erreur lors de l'archivage.");
    }
  }

  async function handleAddRecipes() {
    if (selectedRecipeIds.length === 0) return;
    setAddingRecipes(true);
    try {
      await addRecipesToShoppingList(list.id, selectedRecipeIds);
      setShowRecipePicker(false);
      setSelectedRecipeIds([]);
      router.refresh();
    } catch {
      setError("Erreur lors de l'ajout des recettes.");
    } finally {
      setAddingRecipes(false);
    }
  }

  async function handleTitleSave() {
    if (!titleDraft.trim() || titleDraft === list.title) {
      setTitleDraft(list.title);
      setEditingTitle(false);
      return;
    }
    try {
      await updateShoppingListTitle(list.id, titleDraft.trim());
      setList((l) => ({ ...l, title: titleDraft.trim() }));
    } catch {
      setError("Erreur lors de la mise à jour du titre.");
      setTitleDraft(list.title);
    } finally {
      setEditingTitle(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-red-600 rounded-md bg-red-50 px-3 py-2">{error}</p>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => { if (e.key === "Enter") handleTitleSave(); if (e.key === "Escape") { setTitleDraft(list.title); setEditingTitle(false); } }}
              className="text-xl font-semibold w-full border-b border-stone-400 focus:outline-none bg-transparent pb-0.5"
            />
          ) : (
            <h2
              className={`text-xl font-semibold ${!archived ? "cursor-pointer hover:text-stone-600" : ""}`}
              onClick={() => !archived && setEditingTitle(true)}
            >
              {list.title}
            </h2>
          )}
          {archived && (
            <span className="inline-block mt-1 text-xs font-medium text-stone-500 bg-stone-100 rounded px-2 py-0.5">
              Archivée
            </span>
          )}
        </div>
        {!archived && (
          <button
            onClick={handleArchive}
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors whitespace-nowrap"
          >
            Archiver
          </button>
        )}
        {saving && <span className="text-xs text-stone-400">Sauvegarde...</span>}
      </div>

      {/* Add item form */}
      {!archived && (
        <div className="flex flex-col gap-2">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ajouter un élément..."
              className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <button
              type="submit"
              disabled={!newLabel.trim()}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              Ajouter
            </button>
          </form>
          <button
            onClick={() => setShowRecipePicker(true)}
            className="self-start text-sm text-stone-500 hover:text-stone-800 underline underline-offset-2 transition-colors"
          >
            + Ajouter des recettes
          </button>
        </div>
      )}

      {/* Recipe picker modal */}
      {showRecipePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-stone-900">Ajouter des recettes</h3>
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {recipes.length === 0 && (
                <p className="text-sm text-stone-400">Aucune recette disponible.</p>
              )}
              {recipes.map((recipe) => {
                const checked = selectedRecipeIds.includes(recipe.id);
                return (
                  <label key={recipe.id} className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedRecipeIds((ids) =>
                          checked ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id]
                        )
                      }
                      className="w-4 h-4 accent-stone-900"
                    />
                    <span className="text-sm text-stone-800">{recipe.title}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRecipePicker(false); setSelectedRecipeIds([]); }}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-500 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddRecipes}
                disabled={selectedRecipeIds.length === 0 || addingRecipes}
                className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {addingRecipes ? "Ajout..." : `Ajouter (${selectedRecipeIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* À acheter */}
      {toBuyItems.length > 0 && (
        <section>
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
            À acheter ({toBuyItems.length})
          </h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={toBuyItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1.5">
                {toBuyItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    archived={archived}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {/* Dans le panier */}
      {inCartItems.length > 0 && (
        <section>
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
            Dans le panier ({inCartItems.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {inCartItems.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                archived={archived}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {list.items.length === 0 && !archived && (
        <p className="text-stone-400 text-sm">Aucun élément. Ajoutez-en un ci-dessus.</p>
      )}
    </div>
  );
}
