import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INGREDIENT_UNITS } from "@/lib/types";
import LogoutButton from "@/components/LogoutButton";

const UNIT_LABELS = Object.fromEntries(INGREDIENT_UNITS.map((u) => [u.value, u.label]));

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
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Projet Bouffe</h1>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
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
                      <p className="text-sm text-stone-900">{step.text}</p>
                    </li>
                  ))}
              </ol>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
