<!-- GSD:project-start source:PROJECT.md -->

## Project

**Projet Bouffe — Refonte du planning des repas**

Application web de gestion de repas familiaux permettant de planifier les repas de la semaine, gérer des recettes et générer des listes de courses. La prochaine étape est la refonte de la vue planning avec une expérience calquée sur Google Calendar : vue semaine horizontale sur desktop, vue jour unique avec navigation tactile sur mobile.

**Core Value:** L'utilisateur peut voir et modifier son planning de la semaine en un coup d'œil, depuis n'importe quel appareil.

### Constraints

- **Tech stack** : React + Tailwind uniquement — pas de librairie de calendrier externe
- **Responsive** : breakpoint mobile/desktop via Tailwind (ex: `md:`)
- **Accessibilité tactile** : le swipe mobile doit fonctionner avec les événements touch natifs

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.x - All application code in `src/`
- CSS (Tailwind utility classes) - Styling via `src/app/globals.css`

## Runtime

- Node.js v24.11.1
- npm
- Lockfile: `package-lock.json` present

## Frameworks

- Next.js 16.2.4 - Full-stack React framework (App Router)
- React 19.2.4 - UI rendering
- Tailwind CSS 4.x - Utility-first CSS via PostCSS (`postcss.config.mjs`)
- TypeScript 5.x - Type checking (`tsconfig.json`)
- ESLint 9 - Linting (`eslint.config.mjs`)
- Not detected

## Key Dependencies

- `@supabase/supabase-js` ^2.104.1 - Supabase JS client for database/auth queries
- `@supabase/ssr` ^0.10.2 - Supabase SSR helpers for Next.js (browser + server clients, cookie-based sessions)
- `next` 16.2.4 - Core framework
- `@dnd-kit/core` ^6.3.1 - Drag-and-drop primitives
- `@dnd-kit/sortable` ^10.0.0 - Sortable drag-and-drop lists
- `@dnd-kit/utilities` ^3.2.2 - DnD Kit utility helpers
- `@tailwindcss/postcss` ^4 - Tailwind PostCSS plugin
- `eslint-config-next` 16.2.4 - Next.js ESLint ruleset (core-web-vitals + TypeScript)

## Configuration

- Configured via `.env.local` (gitignored)
- `.env.local.example` present as template
- Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `next.config.ts` - Minimal Next.js config (no custom options set)
- `tsconfig.json` - Target ES2017, strict mode, path alias `@/*` → `./src/*`
- `postcss.config.mjs` - Tailwind CSS PostCSS plugin only

## Platform Requirements

- Node.js >=20 (devDep types target @types/node ^20)
- Supabase CLI for local DB (`supabase/config.toml`, local port 54321)
- PostgreSQL 17 (local Supabase Docker)
- Next.js-compatible hosting (Vercel recommended by default)
- Supabase hosted project (cloud)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- React components: PascalCase, `.tsx` extension (e.g., `RecipeForm.tsx`, `TagInput.tsx`, `ShoppingListDetail.tsx`)
- Next.js route files: lowercase reserved names (`page.tsx`, `layout.tsx`, `actions.ts`, `error.tsx`, `loading.tsx`)
- Utility/library modules: camelCase (e.g., `client.ts`, `server.ts`, `database.types.ts`)
- Type definition file: `src/lib/types.ts`
- React components: PascalCase default exports (`export default function RecipeForm`)
- Server actions: camelCase named exports (`export async function createRecipe`, `export async function updateRecipe`)
- Helper/internal functions: camelCase without export (`async function syncTags`)
- Event handlers: `handle` prefix + noun (`handleSubmit`)
- State mutators: verb + noun (`addStep`, `removeStep`, `updateStep`, `addIngredient`)
- camelCase throughout (`recipeId`, `tagNames`, `mealType`)
- Boolean state: verb-based (`loading`, `isEditing`)
- Error state: `error` (string or null)
- `type` keyword for all custom types (not `interface`)
- PascalCase type names (`Recipe`, `MealType`, `ShoppingList`, `IngredientUnit`)
- String union types for enums (`'lunch' | 'dinner'`, `'active' | 'archived'`, `'to_buy' | 'in_cart'`)
- Local form/input types defined inline in the file that uses them (`type IngredientForm`, `type IngredientInput`, `type Props`)
- Intersection types for extensions: `Recipe & { ingredient_count: number }` pattern
- `Omit<T, K>` for derived types (`ShoppingListSummary`)
- Exported constant arrays for unit values: `INGREDIENT_UNITS` in `src/lib/types.ts`

## Code Style

- No Prettier config detected — formatting is handled by ESLint rules
- 2-space indentation (consistent throughout)
- Double quotes for JSX attributes; double quotes for strings in `.ts` files
- Trailing commas in multi-line objects/arrays
- Arrow functions preferred in inline callbacks; named `function` declarations for component and action definitions
- ESLint v9 flat config at `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- TypeScript strict mode enabled in `tsconfig.json` (`"strict": true`)

## Import Organization

- `@/*` maps to `src/*` (configured in `tsconfig.json`)
- Used consistently: `@/lib/supabase/server`, `@/lib/types`, `@/components/TagInput`

## Directives

- Every Server Action file starts with `"use server"` at line 1
- Every interactive component file starts with `"use client"` at line 1
- Server Components (pages that fetch data) have no directive

## Error Handling

- Supabase errors are checked immediately after each query
- Pattern: `if (error) throw new Error(error.message);`
- Combined null check: `if (recipeError || !recipe) throw new Error(recipeError?.message ?? "Erreur création recette");`
- Errors bubble up as thrown exceptions to be caught by client callers
- `try/catch` wraps server action calls in `handleSubmit`
- Catch block discards the caught value (`catch { ... }`) — no error object typed
- Error displayed via `error` state string: `setError("Erreur lors de...")`
- Error messages are in French
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

- Server actions: `void` (fire-and-redirect) or `Promise<string>` (return ID)
- Supabase helpers return typed data or throw

## Module Design

- React components: `export default function ComponentName`
- Server actions: named `export async function`
- Types: named `export type`

## State Management

- Local `useState` for all component state (no global store)
- `useRef` used for DOM focus management (index-based ref arrays)
- `useRouter` for programmatic navigation after mutation

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Global HTML shell, CSS | `src/app/layout.tsx` |
| Login page | Auth form (client component) | `src/app/page.tsx` |
| Auth gate layout | Session check, redirect, wraps AppLayout | `src/app/(app)/layout.tsx` |
| AppLayout | Sidebar nav, mobile drawer, logout | `src/components/AppLayout.tsx` |
| Recipes page (RSC) | Fetch + pass data to RecipeList | `src/app/(app)/recipes/page.tsx` |
| RecipeList | Client-side search/filter over recipe data | `src/app/(app)/recipes/RecipeList.tsx` |
| RecipeForm | Shared create/edit form (client) | `src/components/RecipeForm.tsx` |
| Planning page (RSC) | Fetch meal plans + recipes for ±28 days | `src/app/(app)/planning/page.tsx` |
| PlanningWeek | Interactive weekly calendar (client) | `src/app/(app)/planning/PlanningWeek.tsx` |
| ShoppingListDetail | Item check-off, drag/reorder (client) | `src/app/(app)/shopping-lists/[id]/ShoppingListDetail.tsx` |
| Recipes actions | createRecipe, updateRecipe (server actions) | `src/app/(app)/recipes/actions.ts` |
| Planning actions | addMealPlan, deleteMealPlan (server actions) | `src/app/(app)/planning/actions.ts` |
| Shopping actions | CRUD + ingredient-merge logic (server actions) | `src/app/(app)/shopping-lists/actions.ts` |
| Supabase server client | Cookie-based SSR client factory | `src/lib/supabase/server.ts` |
| Supabase browser client | Client-side singleton factory | `src/lib/supabase/client.ts` |
| Domain types | All shared TypeScript types | `src/lib/types.ts` |
| Middleware proxy | Session refresh on every request | `src/proxy.ts` |

## Pattern Overview

- Pages are async React Server Components that fetch data directly from Supabase — no API routes
- Mutations go through `"use server"` Server Actions co-located with their feature in `actions.ts` files
- Client components (`"use client"`) are used only for interactivity (forms, navigation, drag-drop)
- Auth is enforced at the route-group layout level (`src/app/(app)/layout.tsx`)
- No global client-side state management library — server state via RSC revalidation, local state via `useState`

## Layers

- Purpose: Handle user interaction, local UI state
- Location: `src/components/`, `src/app/(app)/*/*.tsx` (non-page files)
- Contains: Interactive forms, lists, calendars, navigation shell
- Depends on: Server Actions (called directly), Supabase browser client (for auth logout)
- Used by: RSC page components
- Purpose: Fetch data at request time, pass as props
- Location: `src/app/(app)/*/page.tsx`
- Contains: `async` page components with direct `supabase` calls
- Depends on: `src/lib/supabase/server.ts`
- Used by: Next.js router
- Purpose: Handle writes, tag syncing, item merging, revalidation
- Location: `src/app/(app)/*/actions.ts` (each marked `"use server"`)
- Contains: Supabase writes, `revalidatePath`, `redirect`
- Depends on: `src/lib/supabase/server.ts`, `src/lib/types.ts`
- Used by: Client components
- Purpose: Create typed Supabase clients for server or browser context
- Location: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- Contains: `createClient()` factory using `@supabase/ssr`
- Depends on: `src/lib/supabase/database.types.ts` (auto-generated)
- Used by: Pages (RSC), Server Actions, Client components (browser client only)
- Purpose: Shared TypeScript type definitions
- Location: `src/lib/types.ts`
- Contains: `Recipe`, `MealPlan`, `ShoppingList`, `Tag`, `IngredientUnit`, etc.
- Depends on: Nothing
- Used by: All layers

## Data Flow

### Page Load (read)

### Mutation (write)

### Session Refresh

## Key Abstractions

- Purpose: All writes for a feature domain in one file
- Examples: `src/app/(app)/recipes/actions.ts`, `src/app/(app)/shopping-lists/actions.ts`
- Pattern: Each exported async function is `"use server"`, creates its own client, guards with `auth.getUser()`
- Purpose: Return correctly-scoped typed clients
- Server: `src/lib/supabase/server.ts` — uses `cookies()` from `next/headers`
- Browser: `src/lib/supabase/client.ts` — uses `createBrowserClient`
- Purpose: Groups all authenticated routes under a single auth-checking layout
- Location: `src/app/(app)/`
- Pattern: Layout redirects to `/` if no session; all child pages inherit auth guarantee

## Entry Points

- Location: `src/app/page.tsx`
- Triggers: Unauthenticated root visit
- Responsibilities: Email/password form, calls `supabase.auth.signInWithPassword`, pushes to `/recipes`
- Location: `src/app/(app)/layout.tsx`
- Triggers: Any route under `/(app)/`
- Responsibilities: Session validation, renders `AppLayout` wrapper
- Location: `src/proxy.ts`
- Triggers: Every request (via Next.js middleware matcher)
- Responsibilities: Session token refresh, passes request through unchanged

## Architectural Constraints

- **Rendering model:** React Server Components for pages; client components kept minimal for interactivity only
- **Auth scope:** All authenticated logic lives under `src/app/(app)/` — the layout is the single auth boundary
- **No API routes:** Data access is direct from RSC pages or Server Actions — no `app/api/` layer exists
- **Global state:** None — no Redux, Zustand, or Context for server state; `useState` for ephemeral UI state
- **Supabase client scope:** Server client MUST be created in server context only; browser client MUST be used in `"use client"` components only

## Error Handling

- Server Actions throw `new Error(message)` on Supabase errors — surfaces to error.tsx boundary
- Auth failures throw `"Not authenticated"` or redirect via `redirect("/")`
- Error boundary: `src/app/(app)/error.tsx`

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
