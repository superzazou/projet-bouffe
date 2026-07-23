# Codebase Structure

**Analysis Date:** 2026-07-23

## Directory Layout

```
sourcecode/
├── src/
│   ├── app/
│   │   ├── (app)/                    # Auth-gated route group
│   │   │   ├── layout.tsx            # Auth check + AppLayout wrapper
│   │   │   ├── error.tsx             # Error boundary for all (app) routes
│   │   │   ├── loading.tsx           # Loading state
│   │   │   ├── planning/
│   │   │   │   ├── page.tsx          # RSC — fetches meal plans + recipes
│   │   │   │   ├── PlanningWeek.tsx  # Client component — interactive calendar
│   │   │   │   └── actions.ts        # Server Actions: addMealPlan, deleteMealPlan
│   │   │   ├── recipes/
│   │   │   │   ├── page.tsx          # RSC — fetches recipe list
│   │   │   │   ├── RecipeList.tsx    # Client component — searchable list
│   │   │   │   ├── actions.ts        # Server Actions: createRecipe, updateRecipe
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # RSC shell for new recipe form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # RSC — recipe detail
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # RSC shell for edit recipe form
│   │   │   └── shopping-lists/
│   │   │       ├── page.tsx          # RSC — fetches shopping list summaries
│   │   │       ├── ShoppingListActions.tsx  # Client component — list-level actions
│   │   │       ├── actions.ts        # Server Actions: CRUD + ingredient merge
│   │   │       ├── new/
│   │   │       │   └── page.tsx      # RSC shell for new list form
│   │   │       └── [id]/
│   │   │           ├── page.tsx      # RSC — fetches single list
│   │   │           └── ShoppingListDetail.tsx  # Client component — item check-off
│   │   ├── layout.tsx                # Root HTML layout, global CSS
│   │   ├── page.tsx                  # Login page (client component)
│   │   ├── globals.css               # Tailwind base styles
│   │   └── favicon.ico
│   ├── components/
│   │   ├── AppLayout.tsx             # Sidebar + mobile drawer shell
│   │   ├── RecipeCombobox.tsx        # Reusable recipe picker (client)
│   │   ├── RecipeForm.tsx            # Shared create/edit recipe form (client)
│   │   └── TagInput.tsx              # Tag input widget (client)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts             # Supabase SSR client factory
│   │   │   ├── client.ts             # Supabase browser client factory
│   │   │   └── database.types.ts     # Auto-generated DB types
│   │   └── types.ts                  # Domain TypeScript types
│   └── proxy.ts                      # Middleware: session refresh
├── supabase/
│   ├── config.toml                   # Supabase project config
│   └── migrations/                   # Timestamped SQL migration files
├── public/                           # Static assets
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json
└── eslint.config.mjs
```

## Directory Purposes

**`src/app/(app)/`:**
- Purpose: All authenticated application routes
- Contains: RSC page files, co-located client components, feature `actions.ts` files
- Key files: `layout.tsx` (auth gate)

**`src/components/`:**
- Purpose: Shared client components used across multiple routes
- Contains: Layout shell (`AppLayout`), reusable form widgets
- Key files: `AppLayout.tsx`, `RecipeForm.tsx`, `RecipeCombobox.tsx`, `TagInput.tsx`

**`src/lib/`:**
- Purpose: Shared utilities, client factories, and domain types
- Contains: Supabase client factories, generated DB types, domain type definitions
- Key files: `types.ts`, `supabase/server.ts`, `supabase/client.ts`

**`supabase/migrations/`:**
- Purpose: Version-controlled database schema changes
- Contains: Timestamped `.sql` files applied in order
- Key files: `20260425084836_create_recipes.sql`, `20260517000001_create_tags.sql`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Login page — first page unauthenticated users see
- `src/app/(app)/layout.tsx`: Auth boundary for all app routes
- `src/proxy.ts`: Next.js middleware for session refresh

**Configuration:**
- `next.config.ts`: Next.js build/runtime config
- `tsconfig.json`: TypeScript paths (`@/` alias → `src/`)
- `supabase/config.toml`: Supabase project settings

**Core Logic:**
- `src/lib/types.ts`: All domain types — start here to understand data model
- `src/lib/supabase/server.ts`: Server-side Supabase client (used in RSC + Server Actions)
- `src/lib/supabase/client.ts`: Browser Supabase client (used in `"use client"` components)
- `src/app/(app)/shopping-lists/actions.ts`: Most complex business logic (ingredient merging)

**Database:**
- `src/lib/supabase/database.types.ts`: Auto-generated — do not edit manually; regenerate with `supabase gen types typescript`

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Server Actions: `actions.ts` (one per feature directory)
- Client components: `PascalCase.tsx` (e.g., `PlanningWeek.tsx`, `RecipeList.tsx`)
- Utilities/factories: `camelCase.ts` (e.g., `server.ts`, `client.ts`)

**Directories:**
- Route segments: `kebab-case` (e.g., `shopping-lists`, `recipes`)
- Dynamic segments: `[id]` bracket notation
- Route groups: `(app)` parentheses notation (no URL segment)

**React components:** PascalCase exports, matching filename
**TypeScript types:** PascalCase (e.g., `Recipe`, `MealPlan`, `ShoppingList`)
**Server Actions:** camelCase verb-noun (e.g., `createRecipe`, `addMealPlan`, `archiveShoppingList`)

## Where to Add New Code

**New feature/domain (e.g., "meal suggestions"):**
- Route pages: `src/app/(app)/meal-suggestions/page.tsx`
- Server Actions: `src/app/(app)/meal-suggestions/actions.ts`
- Client components: `src/app/(app)/meal-suggestions/ComponentName.tsx`
- Shared components (if reused): `src/components/ComponentName.tsx`
- Domain types: add to `src/lib/types.ts`
- DB schema: new migration in `supabase/migrations/` with timestamp prefix

**New shared component:**
- Place in `src/components/ComponentName.tsx`
- Must be a `"use client"` component if interactive

**New utility:**
- Place in `src/lib/` — named to reflect its purpose

**New Server Action in existing feature:**
- Add exported async function to the existing `actions.ts` in that feature directory
- Ensure file has `"use server"` directive at the top

## Special Directories

**`supabase/migrations/`:**
- Purpose: SQL schema migrations tracked in git
- Generated: Manually authored or via `supabase migration new`
- Committed: Yes

**`supabase/.temp/`:**
- Purpose: Supabase CLI cache (linked project ref, versions)
- Committed: No (gitignored)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`src/lib/supabase/database.types.ts`:**
- Purpose: TypeScript types auto-generated from Supabase schema
- Generated: Yes (`supabase gen types typescript --local > src/lib/supabase/database.types.ts`)
- Committed: Yes — regenerate after each migration

---

*Structure analysis: 2026-07-23*
