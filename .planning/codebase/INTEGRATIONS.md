# External Integrations

**Analysis Date:** 2026-07-23

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - Database (PostgreSQL), Auth, and auto-generated REST API
  - SDK/Client: `@supabase/supabase-js`, `@supabase/ssr`
  - Browser client: `src/lib/supabase/client.ts` — `createBrowserClient`
  - Server client: `src/lib/supabase/server.ts` — `createServerClient` with cookie store
  - Middleware proxy: `src/proxy.ts` — refreshes session on every request
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Data Storage

**Databases:**
- PostgreSQL 17 via Supabase
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`
  - Client: Supabase JS client (no ORM — raw Supabase query builder)
  - Schema managed via migrations in `supabase/migrations/`
  - Migrations present:
    - `20260425084836_create_recipes.sql`
    - `20260426000000_create_meal_plans.sql`
    - `20260426120000_create_shopping_lists.sql`
    - `20260517000000_meal_plans_multi_recipes.sql`
    - `20260517000001_create_tags.sql`
  - Generated TypeScript types: `src/lib/supabase/database.types.ts`

**File Storage:**
- Not detected (no Supabase Storage usage found)

**Caching:**
- None (Next.js default fetch caching only)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Cookie-based sessions via `@supabase/ssr`
  - Session refresh middleware in `src/proxy.ts` (runs on every non-static request)
  - Server-side auth via `supabase.auth.getUser()` in middleware

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console logging only (no structured logging service)

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured — Next.js default implies Vercel or similar

**CI Pipeline:**
- None detected (no `.github/workflows/`, no CI config files found)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public anon key

**Secrets location:**
- `.env.local` (gitignored, must be created from `.env.local.example`)

## Local Development

**Supabase local stack:**
- Config: `supabase/config.toml`
- Local API port: 54321
- Local DB port: 54322
- PostgreSQL major version: 17

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

---

*Integration audit: 2026-07-23*
