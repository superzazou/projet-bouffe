import { createClient } from "@/lib/supabase/server";
import RecipeForm from "@/components/RecipeForm";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("name").order("name", { ascending: true });
  const allTagNames = (tags ?? []).map((t) => t.name);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-xl font-semibold mb-6">Nouvelle recette</h2>
      <RecipeForm allTags={allTagNames} />
    </div>
  );
}
