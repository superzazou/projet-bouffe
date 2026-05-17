import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RecipeList from "./RecipeList";

export default async function RecipesPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select(`
      id,
      title,
      steps,
      recipe_ingredients(text),
      recipe_tags(tags(name))
    `)
    .order("title", { ascending: true });

  type RawRecipe = NonNullable<typeof recipes>[number] & {
    steps: unknown[];
    recipe_ingredients: { text: string }[];
    recipe_tags: { tags: { name: string } }[];
  };

  const items = ((recipes ?? []) as RawRecipe[]).map((r) => ({
    id: r.id,
    title: r.title,
    stepCount: r.steps.length,
    ingredientCount: r.recipe_ingredients.length,
    ingredientNames: r.recipe_ingredients.map((i) => i.text),
    tags: r.recipe_tags.map((rt) => rt.tags.name),
  }));

  return (
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

      {items.length === 0 ? (
        <p className="text-stone-500 text-sm">Aucune recette pour l&apos;instant.</p>
      ) : (
        <RecipeList recipes={items} />
      )}
    </div>
  );
}
