import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

const MOCK_RECETTES = [
  { id: 1, titre: "Poulet rôti aux herbes", duree: "1h20", portions: 4 },
  { id: 2, titre: "Pasta carbonara", duree: "25 min", portions: 2 },
  { id: 3, titre: "Soupe à l'oignon gratinée", duree: "45 min", portions: 4 },
  { id: 4, titre: "Tarte aux pommes", duree: "1h", portions: 6 },
  { id: 5, titre: "Salade niçoise", duree: "20 min", portions: 2 },
  { id: 6, titre: "Bœuf bourguignon", duree: "3h", portions: 6 },
];

export default async function RecettesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Projet Bouffe</h1>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Mes recettes</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_RECETTES.map((recette) => (
            <div
              key={recette.id}
              className="rounded-lg border border-stone-200 bg-white p-4 flex flex-col gap-1"
            >
              <p className="font-medium text-stone-900">{recette.titre}</p>
              <p className="text-sm text-stone-500">
                {recette.duree} · {recette.portions} portions
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
