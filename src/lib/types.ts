export type IngredientUnit = 'pieces' | 'grammes' | 'millilitres';

export const INGREDIENT_UNITS: { value: IngredientUnit; label: string }[] = [
  { value: 'pieces', label: 'pièces' },
  { value: 'grammes', label: 'grammes' },
  { value: 'millilitres', label: 'millilitres' },
];

export type RecipeStep = {
  order: number;
  text: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  text: string;
  quantity: number;
  unit: IngredientUnit;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  steps: RecipeStep[];
  created_at: string;
  updated_at: string;
};

export type RecipeWithCounts = Recipe & {
  ingredient_count: number;
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
};
