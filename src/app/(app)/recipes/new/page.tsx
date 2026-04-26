import NewRecipeForm from "./NewRecipeForm";

export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-xl font-semibold mb-6">Nouvelle recette</h2>
      <NewRecipeForm />
    </div>
  );
}
