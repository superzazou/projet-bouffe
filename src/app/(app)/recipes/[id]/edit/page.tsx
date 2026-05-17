import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecipeForm from "@/components/RecipeForm";
import type { RecipeIngredient, RecipeStep } from "@/lib/types";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: recipe }, { data: allTags }] = await Promise.all([
    supabase
      .from("recipes")
      .select(`
        id,
        title,
        steps,
        recipe_ingredients(id, text, quantity, unit),
        recipe_tags(tags(id, name))
      `)
      .eq("id", id)
      .single(),
    supabase.from("tags").select("name").order("name", { ascending: true }),
  ]);

  if (!recipe) notFound();

  const initialTags = (recipe.recipe_tags as { tags: { id: string; name: string } }[])
    .map((rt) => rt.tags.name);
  const allTagNames = (allTags ?? []).map((t) => t.name);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-xl font-semibold mb-6">Modifier la recette</h2>
      <RecipeForm
        recipeId={recipe.id}
        initialTitle={recipe.title}
        initialSteps={(recipe.steps as unknown as RecipeStep[]) ?? []}
        initialIngredients={recipe.recipe_ingredients as RecipeIngredient[]}
        initialTags={initialTags}
        allTags={allTagNames}
      />
    </div>
  );
}
