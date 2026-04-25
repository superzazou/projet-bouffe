import { notFound, redirect } from "next/navigation";
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: recipe } = await supabase
    .from("recipes")
    .select(`
      id,
      title,
      steps,
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
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Modifier la recette</h2>
        <RecipeForm
          recipeId={recipe.id}
          initialTitle={recipe.title}
          initialSteps={recipe.steps as RecipeStep[]}
          initialIngredients={recipe.recipe_ingredients as RecipeIngredient[]}
        />
      </main>
    </div>
  );
}
