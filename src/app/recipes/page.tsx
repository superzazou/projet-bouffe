import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RecipeWithCounts } from "@/lib/types";
import AppLayout from "@/components/AppLayout";

export default async function RecipesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: recipes } = await supabase
    .from("recipes")
    .select(`
      id,
      title,
      steps,
      created_at,
      updated_at,
      user_id,
      recipe_ingredients(count)
    `)
    .order("title", { ascending: true });

  const typedRecipes = (recipes ?? []) as unknown as (Omit<RecipeWithCounts, "ingredient_count"> & {
    recipe_ingredients: [{ count: number }];
  })[];

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Mes recettes</h2>
          <Link
            href="/recipes/new"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
          >
            Nouvelle recette
          </Link>
        </div>

        {typedRecipes.length === 0 ? (
          <p className="text-stone-500 text-sm">Aucune recette pour l&apos;instant.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {typedRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="rounded-lg border border-stone-200 bg-white p-4 flex flex-col gap-1 hover:border-stone-400 transition-colors"
              >
                <p className="font-medium text-stone-900">{recipe.title}</p>
                <p className="text-sm text-stone-500">
                  {recipe.steps.length} étape{recipe.steps.length !== 1 ? "s" : ""} · {recipe.recipe_ingredients[0]?.count ?? 0} ingrédient{(recipe.recipe_ingredients[0]?.count ?? 0) !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
