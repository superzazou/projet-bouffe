<!-- refreshed: 2026-07-23 -->
# Architecture

**Analysis Date:** 2026-07-23

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser / Client                              │
│  Login page `src/app/page.tsx`                                       │
│  Client components: AppLayout, RecipeList, PlanningWeek, etc.        │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js App Router                               │
│  Route group: `src/app/(app)/`  (auth-gated via layout.tsx)         │
│  Pages (RSC): recipes, planning, shopping-lists                      │
│  Server Actions: actions.ts per feature                              │
└──────────┬──────────────────────────────────────┬───────────────────┘
           │                                      │
           ▼                                      ▼
┌─────────────────────────┐            ┌──────────────────────────────┐
│   Supabase Server SDK   │            │   Supabase Browser SDK       │
│  `src/lib/supabase/     │            │  `src/lib/supabase/          │
│   server.ts`            │            │   client.ts`                 │
└──────────┬──────────────┘            └──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL + Auth)                       │
│  Tables: recipes, recipe_ingredients, recipe_tags, tags,             │
│          meal_plans, shopping_lists                                   │
│  Migrations: `supabase/migrations/`                                  │
└─────────────────────────────────────────────────────────────────────┘
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

**Overall:** Next.js App Router with React Server Components + Server Actions

**Key Characteristics:**
- Pages are async React Server Components that fetch data directly from Supabase — no API routes
- Mutations go through `"use server"` Server Actions co-located with their feature in `actions.ts` files
- Client components (`"use client"`) are used only for interactivity (forms, navigation, drag-drop)
- Auth is enforced at the route-group layout level (`src/app/(app)/layout.tsx`)
- No global client-side state management library — server state via RSC revalidation, local state via `useState`

## Layers

**Presentation (Client Components):**
- Purpose: Handle user interaction, local UI state
- Location: `src/components/`, `src/app/(app)/*/*.tsx` (non-page files)
- Contains: Interactive forms, lists, calendars, navigation shell
- Depends on: Server Actions (called directly), Supabase browser client (for auth logout)
- Used by: RSC page components

**Data Fetching (React Server Components):**
- Purpose: Fetch data at request time, pass as props
- Location: `src/app/(app)/*/page.tsx`
- Contains: `async` page components with direct `supabase` calls
- Depends on: `src/lib/supabase/server.ts`
- Used by: Next.js router

**Mutations (Server Actions):**
- Purpose: Handle writes, tag syncing, item merging, revalidation
- Location: `src/app/(app)/*/actions.ts` (each marked `"use server"`)
- Contains: Supabase writes, `revalidatePath`, `redirect`
- Depends on: `src/lib/supabase/server.ts`, `src/lib/types.ts`
- Used by: Client components

**Data Access:**
- Purpose: Create typed Supabase clients for server or browser context
- Location: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- Contains: `createClient()` factory using `@supabase/ssr`
- Depends on: `src/lib/supabase/database.types.ts` (auto-generated)
- Used by: Pages (RSC), Server Actions, Client components (browser client only)

**Domain Types:**
- Purpose: Shared TypeScript type definitions
- Location: `src/lib/types.ts`
- Contains: `Recipe`, `MealPlan`, `ShoppingList`, `Tag`, `IngredientUnit`, etc.
- Depends on: Nothing
- Used by: All layers

## Data Flow

### Page Load (read)

1. Browser requests route (e.g. `/recipes`)
2. Next.js executes `src/app/(app)/layout.tsx` — creates Supabase server client, calls `auth.getUser()`, redirects if unauthenticated
3. RSC page (`src/app/(app)/recipes/page.tsx`) executes — queries Supabase directly, maps result
4. Props passed to client component (`RecipeList`) for rendering

### Mutation (write)

1. Client component calls Server Action (e.g. `createRecipe(...)` from `src/app/(app)/recipes/actions.ts`)
2. Server Action creates Supabase server client, validates auth, writes to DB
3. `revalidatePath(...)` invalidates cached RSC data
4. Optional `redirect(...)` navigates user to updated page

### Session Refresh

1. Every HTTP request passes through `src/proxy.ts`
2. `supabase.auth.getUser()` refreshes the session token in cookies

## Key Abstractions

**Server Action files (`actions.ts`):**
- Purpose: All writes for a feature domain in one file
- Examples: `src/app/(app)/recipes/actions.ts`, `src/app/(app)/shopping-lists/actions.ts`
- Pattern: Each exported async function is `"use server"`, creates its own client, guards with `auth.getUser()`

**Supabase client factories:**
- Purpose: Return correctly-scoped typed clients
- Server: `src/lib/supabase/server.ts` — uses `cookies()` from `next/headers`
- Browser: `src/lib/supabase/client.ts` — uses `createBrowserClient`

**Route group `(app)`:**
- Purpose: Groups all authenticated routes under a single auth-checking layout
- Location: `src/app/(app)/`
- Pattern: Layout redirects to `/` if no session; all child pages inherit auth guarantee

## Entry Points

**Login:**
- Location: `src/app/page.tsx`
- Triggers: Unauthenticated root visit
- Responsibilities: Email/password form, calls `supabase.auth.signInWithPassword`, pushes to `/recipes`

**App Shell:**
- Location: `src/app/(app)/layout.tsx`
- Triggers: Any route under `/(app)/`
- Responsibilities: Session validation, renders `AppLayout` wrapper

**Middleware proxy:**
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

**Strategy:** Throw-on-error in Server Actions; error boundary in layout

**Patterns:**
- Server Actions throw `new Error(message)` on Supabase errors — surfaces to error.tsx boundary
- Auth failures throw `"Not authenticated"` or redirect via `redirect("/")`
- Error boundary: `src/app/(app)/error.tsx`

## Cross-Cutting Concerns

**Logging:** None — no structured logging in place
**Validation:** Input types enforced via TypeScript; no runtime schema validation library
**Authentication:** Supabase Auth via `@supabase/ssr`; session enforced in layout + refreshed in middleware

---

*Architecture analysis: 2026-07-23*
