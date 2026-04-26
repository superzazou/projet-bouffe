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

export type ShoppingItemStatus = 'to_buy' | 'in_cart';

export type ShoppingItem = {
  id: string;
  label: string;
  status: ShoppingItemStatus;
  position: number;
};

export type ShoppingListStatus = 'active' | 'archived';

export type ShoppingList = {
  id: string;
  user_id: string;
  title: string;
  status: ShoppingListStatus;
  items: ShoppingItem[];
  created_at: string;
  updated_at: string;
};

export type ShoppingListSummary = Omit<ShoppingList, 'items'> & {
  total_items: number;
  in_cart_items: number;
};

export type MealType = 'lunch' | 'dinner';

export type MealPlan = {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  recipe_id: string | null;
  created_at: string;
};
