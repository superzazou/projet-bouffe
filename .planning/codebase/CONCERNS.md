# Codebase Concerns

**Analysis Date:** 2026-07-23

## Tech Debt

**Shopping items stored as a JSON column:**
- Issue: `shopping_lists.items` stores a JSON array of `ShoppingItem` objects rather than a relational child table. Reordering, toggling, and adding items all require fetching the full list, mutating the array in memory, and writing the entire array back as one update.
- Files: `src/app/(app)/shopping-lists/actions.ts`, `src/lib/types.ts`
- Impact: No ability to filter/search/aggregate items at the DB level; full replacement writes create race conditions under concurrent edits (see below); difficult to add per-item metadata later (e.g., aisle, quantity unit).
- Fix approach: Migrate items to a `shopping_list_items` relational table. Provides proper CRUD per item and eliminates the read-modify-write pattern.

**Ingredient merging relies on label-string regex parsing:**
- Issue: `ingredientsToItems()` detects duplicate ingredients by parsing the stored display label with a regex (`/^(.+) \((\d+) \w+\)$/`), then sums quantities by re-parsing the matched string. If an ingredient label is edited manually or contains parentheses, the merge silently fails and creates a duplicate entry.
- Files: `src/app/(app)/shopping-lists/actions.ts` lines 66–107
- Impact: Silent data duplication when adding recipes with ingredients that were previously modified by hand. No error is surfaced to the user.
- Fix approach: Store quantity and unit as structured fields (possible once items are a relational table). Merge on `(normalized_name, unit)` from structured data rather than parsing a label string.

**Unsafe type casts on JSON columns:**
- Issue: Supabase returns `steps` and `items` as `Json` type. Multiple pages cast them with `as unknown as RecipeStep[]` or `as ShoppingItem[]` without runtime validation. If the DB contains malformed data the app silently fails with a runtime error.
- Files: `src/app/(app)/recipes/[id]/page.tsx` lines 101, 105; `src/app/(app)/recipes/[id]/edit/page.tsx` lines 41–42; `src/app/(app)/shopping-lists/page.tsx` line 45; `src/app/(app)/shopping-lists/actions.ts` lines 128–129; `src/app/(app)/shopping-lists/[id]/page.tsx` line 21
- Impact: Any schema mismatch between code types and actual stored JSON causes silent breakage or runtime crashes with no useful error message.
- Fix approach: Add a Zod (or similar) parse step at the boundary when reading JSON columns. For `steps` specifically, migrating to a relational `recipe_steps` table would eliminate the need entirely.

**Week navigation is hardcoded to ±4 weeks:**
- Issue: Navigation range in `PlanningWeek.tsx` is hardcoded (`weekOffset > -4` / `< 4`). There is no explicit product decision recorded for this limit.
- Files: `src/app/(app)/planning/PlanningWeek.tsx` lines 106–107
- Impact: Users cannot view or plan more than 4 weeks out or back. Workaround requires a code change.
- Fix approach: Make the constraint configurable via a constant or user setting.

## Known Bugs

**Race condition on rapid shopping list edits:**
- Symptoms: Toggling items quickly or adding an item while a previous save is in flight can result in the later server response overwriting the earlier one, causing an item state to revert.
- Files: `src/app/(app)/shopping-lists/[id]/ShoppingListDetail.tsx` (`saveItems` called from `handleToggle`, `handleDelete`, `handleAdd`, `handleDragEnd`)
- Trigger: Any two mutations fired within the same network round-trip window.
- Workaround: None; the last completed request wins, which may not be the last issued request.
- Fix approach: Debounce `saveItems`, or queue mutations sequentially, or move items to a relational table where each operation targets a single row.

**No error surfaced when creating list from planning fails:**
- Symptoms: `handleCreateList` in `PlanningWeek.tsx` catches nothing — the `finally` block only clears `creatingList`. If `createShoppingListFromPlanning` throws, the modal stays open and the user sees no feedback.
- Files: `src/app/(app)/planning/PlanningWeek.tsx` lines 71–80
- Trigger: Any server-side error during list creation (network issue, DB error).
- Workaround: None visible.
- Fix approach: Add a try/catch around the `createShoppingListFromPlanning` call and surface an error state in the modal, consistent with how other components handle this (e.g., `ShoppingListDetail` uses a `setError` state).

## Security Considerations

**No Next.js middleware for route protection:**
- Risk: `src/proxy.ts` exports a `proxy` function and a `config` matcher, but there is no `src/middleware.ts` file. Next.js only executes middleware from the canonical `middleware.ts` file. The proxy is not active, meaning unauthenticated requests to `/(app)/*` routes are not blocked at the edge.
- Files: `src/proxy.ts` (defines the function but is never wired in)
- Current mitigation: Server components and server actions call `supabase.auth.getUser()` and throw/redirect on missing auth. Supabase RLS may also enforce this at the DB layer.
- Recommendations: Create `src/middleware.ts` that calls the proxy function to enforce auth at the edge and avoid unnecessary DB calls for unauthenticated requests. Example: `export { proxy as middleware } from './proxy'`.

**Mutation actions do not verify record ownership:**
- Risk: Several server actions mutate records by `id` alone without asserting that the record belongs to the authenticated user. A user who knows another user's record UUID can archive, delete, or update it if Supabase RLS is not configured or has a gap.
  - `archiveShoppingList(id)` — updates with `.eq("id", id)` only
  - `deleteShoppingList(id)` — deletes with `.eq("id", id)` and `.eq("status", "archived")` only
  - `updateShoppingListItems(id, items)` — updates with `.eq("id", id)` only
  - `updateShoppingListTitle(id, title)` — updates with `.eq("id", id)` only
  - `deleteMealPlan(id)` — deletes with `.eq("id", id)` only
  - `updateRecipe` / `deleteRecipe` ingredients — `.eq("recipe_id", recipeId)` only
- Files: `src/app/(app)/shopping-lists/actions.ts`, `src/app/(app)/planning/actions.ts`, `src/app/(app)/recipes/actions.ts`
- Current mitigation: Supabase RLS (Row Level Security) is assumed to be configured on the database side, but this is not visible in the codebase.
- Recommendations: Add `.eq("user_id", user.id)` to all mutating queries as a defence-in-depth measure independent of RLS configuration.

## Performance Bottlenecks

**No pagination on list pages:**
- Problem: `shopping-lists/page.tsx` and `recipes/page.tsx` fetch all records for the user with no `limit`/`range`. `planning/page.tsx` fetches all meal plans within a ±28 day window.
- Files: `src/app/(app)/shopping-lists/page.tsx` line 37; `src/app/(app)/recipes/page.tsx`; `src/app/(app)/planning/page.tsx`
- Cause: No cursor-based or offset pagination implemented.
- Improvement path: Add server-side pagination for recipes and shopping lists. Planning already has a date-range filter which is acceptable.

**Full recipe list passed to PlanningWeek and RecipeCombobox:**
- Problem: All recipes are fetched and passed as a prop to `PlanningWeek`, which forwards them to each `RecipeCombobox` instance (one per meal slot, 14 per week view). All recipe titles are rendered in each combobox's DOM.
- Files: `src/app/(app)/planning/PlanningWeek.tsx` line 239; `src/components/RecipeCombobox.tsx`
- Cause: No server-side search; all filtering is client-side.
- Improvement path: Add a search endpoint for recipes and switch `RecipeCombobox` to fetch on input rather than filter a pre-loaded list.

## Fragile Areas

**`ingredientsToItems` function:**
- Files: `src/app/(app)/shopping-lists/actions.ts` lines 66–107
- Why fragile: Logic depends on the display label format `"name (qty unit)"`. Any change to the label format (e.g., adding a note, changing punctuation) silently breaks deduplication. The regex `[̀-ͯ]` for accent stripping is a non-standard Unicode range literal that may behave inconsistently across JS engines.
- Safe modification: Always update the label format and the parsing regex together. Add integration tests covering the merging logic before changing it.
- Test coverage: Zero — no test files exist in the project.

**`SortableItem` drag handle in `ShoppingListDetail`:**
- Files: `src/app/(app)/shopping-lists/[id]/ShoppingListDetail.tsx` lines 36–102
- Why fragile: The `handleDragEnd` callback captures `toBuyItems` and `inCartItems` via `useCallback` with those as dependencies. If a toggle or delete fires between drag start and drag end, the stale closure may reorder items based on an outdated list snapshot.
- Safe modification: Consider using a ref for the items array during active drag, or disable toggle/delete during an active drag session.

## Test Coverage Gaps

**No tests exist:**
- What's not tested: The entire application — all server actions, all client components, all data-transformation utilities.
- Files: All files under `src/`
- Risk: Any refactor to business logic (especially `ingredientsToItems`, recipe CRUD, planning actions) can break silently. No regression safety net.
- Priority: High — the ingredient merging logic in `src/app/(app)/shopping-lists/actions.ts` and the planning date utilities in `src/app/(app)/planning/PlanningWeek.tsx` are the highest-risk areas to add tests first.

---

*Concerns audit: 2026-07-23*
