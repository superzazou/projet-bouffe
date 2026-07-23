# Coding Conventions

**Analysis Date:** 2026-07-23

## Naming Patterns

**Files:**
- React components: PascalCase, `.tsx` extension (e.g., `RecipeForm.tsx`, `TagInput.tsx`, `ShoppingListDetail.tsx`)
- Next.js route files: lowercase reserved names (`page.tsx`, `layout.tsx`, `actions.ts`, `error.tsx`, `loading.tsx`)
- Utility/library modules: camelCase (e.g., `client.ts`, `server.ts`, `database.types.ts`)
- Type definition file: `src/lib/types.ts`

**Functions:**
- React components: PascalCase default exports (`export default function RecipeForm`)
- Server actions: camelCase named exports (`export async function createRecipe`, `export async function updateRecipe`)
- Helper/internal functions: camelCase without export (`async function syncTags`)
- Event handlers: `handle` prefix + noun (`handleSubmit`)
- State mutators: verb + noun (`addStep`, `removeStep`, `updateStep`, `addIngredient`)

**Variables:**
- camelCase throughout (`recipeId`, `tagNames`, `mealType`)
- Boolean state: verb-based (`loading`, `isEditing`)
- Error state: `error` (string or null)

**Types:**
- `type` keyword for all custom types (not `interface`)
- PascalCase type names (`Recipe`, `MealType`, `ShoppingList`, `IngredientUnit`)
- String union types for enums (`'lunch' | 'dinner'`, `'active' | 'archived'`, `'to_buy' | 'in_cart'`)
- Local form/input types defined inline in the file that uses them (`type IngredientForm`, `type IngredientInput`, `type Props`)
- Intersection types for extensions: `Recipe & { ingredient_count: number }` pattern
- `Omit<T, K>` for derived types (`ShoppingListSummary`)
- Exported constant arrays for unit values: `INGREDIENT_UNITS` in `src/lib/types.ts`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is handled by ESLint rules
- 2-space indentation (consistent throughout)
- Double quotes for JSX attributes; double quotes for strings in `.ts` files
- Trailing commas in multi-line objects/arrays
- Arrow functions preferred in inline callbacks; named `function` declarations for component and action definitions

**Linting:**
- ESLint v9 flat config at `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- TypeScript strict mode enabled in `tsconfig.json` (`"strict": true`)

## Import Organization

**Order:**
1. React and Next.js framework imports (`react`, `next/navigation`, `next/cache`)
2. Third-party packages (`@supabase/ssr`)
3. Internal path-aliased imports (`@/lib/...`, `@/app/...`, `@/components/...`)
4. Type-only imports use `import type` keyword

**Path Aliases:**
- `@/*` maps to `src/*` (configured in `tsconfig.json`)
- Used consistently: `@/lib/supabase/server`, `@/lib/types`, `@/components/TagInput`

## Directives

**`"use client"` / `"use server"`:**
- Every Server Action file starts with `"use server"` at line 1
- Every interactive component file starts with `"use client"` at line 1
- Server Components (pages that fetch data) have no directive

## Error Handling

**Server Actions:**
- Supabase errors are checked immediately after each query
- Pattern: `if (error) throw new Error(error.message);`
- Combined null check: `if (recipeError || !recipe) throw new Error(recipeError?.message ?? "Erreur création recette");`
- Errors bubble up as thrown exceptions to be caught by client callers

**Client Components:**
- `try/catch` wraps server action calls in `handleSubmit`
- Catch block discards the caught value (`catch { ... }`) — no error object typed
- Error displayed via `error` state string: `setError("Erreur lors de...")`
- Error messages are in French

**Authentication:**
- Checked at the top of every server action: `if (!user) throw new Error("Not authenticated");`
- Uses `supabase.auth.getUser()` destructured inline

## Logging

- No logging framework used
- No `console.log`/`console.error` calls detected in source
- Errors surfaced to the user via UI state only

## Comments

- Minimal comments in production code
- Single explanatory inline comment found in `src/lib/supabase/server.ts` explaining a `catch {}` block
- No JSDoc/TSDoc blocks used

## Function Design

**Size:** Functions are concise and single-purpose. Server actions handle one operation (create, update, delete).

**Parameters:** Named parameters (not objects) for simple cases; typed tuples for server actions.

**Return Values:**
- Server actions: `void` (fire-and-redirect) or `Promise<string>` (return ID)
- Supabase helpers return typed data or throw

## Module Design

**Exports:**
- React components: `export default function ComponentName`
- Server actions: named `export async function`
- Types: named `export type`

**Barrel Files:** Not used — imports reference specific files directly.

## State Management

- Local `useState` for all component state (no global store)
- `useRef` used for DOM focus management (index-based ref arrays)
- `useRouter` for programmatic navigation after mutation

---

*Convention analysis: 2026-07-23*
