import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INGREDIENT_UNITS } from "@/lib/types";
import AppLayout from "@/components/AppLayout";

const UNIT_LABELS = Object.fromEntries(INGREDIENT_UNITS.map((u) => [u.value, u.label]));

function highlightIngredients(text: string, ingredients: { text: string }[]) {
  if (ingredients.length === 0) return text;

  const sorted = [...ingredients].map((i) => i.text).sort((a, b) => b.length - a.length);
  const pattern = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? <strong key={i} className="font-semibold">{part}</strong> : part
  );
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: recipe } = await supabase
    .from("recipes")
    .select(`
      id,
      title,
      steps,
      created_at,
      updated_at,
      recipe_ingredients(id, text, quantity, unit)
    `)
    .eq("id", id)
    .single();

  if (!recipe) notFound();

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/recipes" className="text-sm text-stone-500 hover:text-stone-800">
            ← Mes recettes
          </Link>
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-500 transition-colors"
          >
            Modifier
          </Link>
        </div>

        <h2 className="text-2xl font-semibold mb-8">{recipe.title}</h2>

        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">
              Ingrédients
            </h3>
            {recipe.recipe_ingredients.length === 0 ? (
              <p className="text-sm text-stone-400">Aucun ingrédient.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recipe.recipe_ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-center gap-2 text-sm">
                    <span className="text-stone-900">{ing.text}</span>
                    <span className="text-stone-400">—</span>
                    <span className="text-stone-600">
                      {ing.quantity} {UNIT_LABELS[ing.unit] ?? ing.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">
              Étapes
            </h3>
            {recipe.steps.length === 0 ? (
              <p className="text-sm text-stone-400">Aucune étape.</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {(recipe.steps as { order: number; text: string }[])
                  .sort((a, b) => a.order - b.order)
                  .map((step) => (
                    <li key={step.order} className="flex gap-3">
                      <span className="text-stone-400 text-sm shrink-0 mt-0.5">{step.order}.</span>
                      <p className="text-sm text-stone-900">
                        {highlightIngredients(step.text, recipe.recipe_ingredients)}
                      </p>
                    </li>
                  ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
