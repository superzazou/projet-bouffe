"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { IngredientUnit, RecipeIngredient, RecipeStep } from "@/lib/types";
import { INGREDIENT_UNITS } from "@/lib/types";

type IngredientForm = {
  id?: string;
  text: string;
  quantity: string;
  unit: IngredientUnit;
};

type Props = {
  recipeId?: string;
  initialTitle?: string;
  initialSteps?: RecipeStep[];
  initialIngredients?: RecipeIngredient[];
};

export default function RecipeForm({
  recipeId,
  initialTitle = "",
  initialSteps = [],
  initialIngredients = [],
}: Props) {
  const router = useRouter();
  const isEditing = !!recipeId;

  const [title, setTitle] = useState(initialTitle);
  const [steps, setSteps] = useState<string[]>(
    initialSteps.length > 0
      ? initialSteps.sort((a, b) => a.order - b.order).map((s) => s.text)
      : [""]
  );
  const [ingredients, setIngredients] = useState<IngredientForm[]>(
    initialIngredients.length > 0
      ? initialIngredients.map((ing) => ({
          id: ing.id,
          text: ing.text,
          quantity: String(ing.quantity),
          unit: ing.unit,
        }))
      : [{ text: "", quantity: "", unit: "pieces" }]
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stepRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const ingredientRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusStepIndex = useRef<number | null>(null);
  const focusIngredientIndex = useRef<number | null>(null);

  useEffect(() => {
    if (focusStepIndex.current !== null) {
      stepRefs.current[focusStepIndex.current]?.focus();
      focusStepIndex.current = null;
    }
  }, [steps]);

  useEffect(() => {
    if (focusIngredientIndex.current !== null) {
      ingredientRefs.current[focusIngredientIndex.current]?.focus();
      focusIngredientIndex.current = null;
    }
  }, [ingredients]);

  function addStep() {
    focusStepIndex.current = steps.length;
    setSteps((prev) => [...prev, ""]);
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function addIngredient() {
    focusIngredientIndex.current = ingredients.length;
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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const filledSteps = steps.filter((s) => s.trim() !== "");
    const filledIngredients = ingredients.filter(
      (ing) => ing.text.trim() !== "" && ing.quantity !== ""
    );
    const supabase = createClient();

    if (isEditing) {
      const { error: recipeError } = await supabase
        .from("recipes")
        .update({
          title: title.trim(),
          steps: filledSteps.map((text, i): RecipeStep => ({ order: i + 1, text })),
          updated_at: new Date().toISOString(),
        })
        .eq("id", recipeId);

      if (recipeError) {
        setError("Erreur lors de la mise à jour de la recette.");
        setLoading(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipeId);

      if (deleteError) {
        setError("Erreur lors de la mise à jour des ingrédients.");
        setLoading(false);
        return;
      }

      if (filledIngredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .insert(
            filledIngredients.map((ing) => ({
              recipe_id: recipeId,
              text: ing.text.trim(),
              quantity: parseInt(ing.quantity, 10),
              unit: ing.unit,
            }))
          );

        if (ingredientsError) {
          setError("Erreur lors de la mise à jour des ingrédients.");
          setLoading(false);
          return;
        }
      }

      router.push(`/recipes/${recipeId}`);
    } else {
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
              ref={(el) => { stepRefs.current[index] = el; }}
              value={step}
              onChange={(e) => updateStep(index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStep();
                }
              }}
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
              ref={(el) => { ingredientRefs.current[index] = el; }}
              type="text"
              placeholder="Ingrédient"
              value={ing.text}
              onChange={(e) => updateIngredient(index, "text", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIngredient(); } }}
              className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            />
            <input
              type="number"
              placeholder="Qté"
              min="1"
              value={ing.quantity}
              onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIngredient(); } }}
              className="w-20 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            />
            <select
              value={ing.unit}
              onChange={(e) => updateIngredient(index, "unit", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIngredient(); } }}
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
          {loading
            ? isEditing ? "Enregistrement..." : "Création..."
            : isEditing ? "Enregistrer" : "Créer la recette"}
        </button>
        <button
          type="button"
          onClick={() => router.push(isEditing ? `/recipes/${recipeId}` : "/recipes")}
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
