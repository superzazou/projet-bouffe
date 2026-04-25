"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { IngredientUnit, RecipeStep } from "@/lib/types";
import { INGREDIENT_UNITS } from "@/lib/types";

type IngredientForm = {
  text: string;
  quantity: string;
  unit: IngredientUnit;
};

export default function NewRecipeForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [ingredients, setIngredients] = useState<IngredientForm[]>([
    { text: "", quantity: "", unit: "pieces" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addStep() {
    setSteps((prev) => [...prev, ""]);
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { text: "", quantity: "", unit: "pieces" }]);
  }

  function updateIngredient(index: number, field: keyof IngredientForm, value: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const filledSteps = steps.filter((s) => s.trim() !== "");
    const filledIngredients = ingredients.filter(
      (ing) => ing.text.trim() !== "" && ing.quantity !== ""
    );

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expirée, veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: title.trim(),
        steps: filledSteps.map((text, i): RecipeStep => ({ order: i + 1, text })),
      })
      .select("id")
      .single();

    if (recipeError || !recipe) {
      setError("Erreur lors de la création de la recette.");
      setLoading(false);
      return;
    }

    if (filledIngredients.length > 0) {
      const { error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .insert(
          filledIngredients.map((ing) => ({
            recipe_id: recipe.id,
            text: ing.text.trim(),
            quantity: parseInt(ing.quantity, 10),
            unit: ing.unit,
          }))
        );

      if (ingredientsError) {
        setError("Erreur lors de l'ajout des ingrédients.");
        setLoading(false);
        return;
      }
    }

    router.push(`/recipes/${recipe.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-stone-700">
          Titre
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-stone-700">Étapes</p>
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-2 text-sm text-stone-400 w-5 shrink-0">{index + 1}.</span>
            <textarea
              value={step}
              onChange={(e) => updateStep(index, e.target.value)}
              rows={2}
              className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 resize-none"
            />
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="mt-2 text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addStep}
          className="self-start text-sm text-stone-500 hover:text-stone-800 underline"
        >
          + Ajouter une étape
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-stone-700">Ingrédients</p>
        {ingredients.map((ing, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ingrédient"
              value={ing.text}
              onChange={(e) => updateIngredient(index, "text", e.target.value)}
              className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            />
            <input
              type="number"
              placeholder="Qté"
              min="1"
              value={ing.quantity}
              onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
              className="w-20 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            />
            <select
              value={ing.unit}
              onChange={(e) => updateIngredient(index, "unit", e.target.value)}
              className="rounded-md border border-stone-300 px-2 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            >
              {INGREDIENT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            {ingredients.length > 1 && (
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addIngredient}
          className="self-start text-sm text-stone-500 hover:text-stone-800 underline"
        >
          + Ajouter un ingrédient
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Enregistrement..." : "Créer la recette"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/recipes")}
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
