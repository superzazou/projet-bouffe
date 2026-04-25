import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewRecipeForm from "./NewRecipeForm";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Projet Bouffe</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Nouvelle recette</h2>
        <NewRecipeForm />
      </main>
    </div>
  );
}
