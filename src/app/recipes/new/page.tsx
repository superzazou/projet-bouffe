import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewRecipeForm from "./NewRecipeForm";
import AppLayout from "@/components/AppLayout";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Nouvelle recette</h2>
        <NewRecipeForm />
      </div>
    </AppLayout>
  );
}
