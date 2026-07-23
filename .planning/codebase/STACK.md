# Technology Stack

**Analysis Date:** 2026-07-23

## Languages

**Primary:**
- TypeScript 5.x - All application code in `src/`

**Secondary:**
- CSS (Tailwind utility classes) - Styling via `src/app/globals.css`

## Runtime

**Environment:**
- Node.js v24.11.1

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.4 - Full-stack React framework (App Router)
- React 19.2.4 - UI rendering

**Build/Dev:**
- Tailwind CSS 4.x - Utility-first CSS via PostCSS (`postcss.config.mjs`)
- TypeScript 5.x - Type checking (`tsconfig.json`)
- ESLint 9 - Linting (`eslint.config.mjs`)

**Testing:**
- Not detected

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.104.1 - Supabase JS client for database/auth queries
- `@supabase/ssr` ^0.10.2 - Supabase SSR helpers for Next.js (browser + server clients, cookie-based sessions)
- `next` 16.2.4 - Core framework

**UI/Interaction:**
- `@dnd-kit/core` ^6.3.1 - Drag-and-drop primitives
- `@dnd-kit/sortable` ^10.0.0 - Sortable drag-and-drop lists
- `@dnd-kit/utilities` ^3.2.2 - DnD Kit utility helpers

**Dev:**
- `@tailwindcss/postcss` ^4 - Tailwind PostCSS plugin
- `eslint-config-next` 16.2.4 - Next.js ESLint ruleset (core-web-vitals + TypeScript)

## Configuration

**Environment:**
- Configured via `.env.local` (gitignored)
- `.env.local.example` present as template
- Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Build:**
- `next.config.ts` - Minimal Next.js config (no custom options set)
- `tsconfig.json` - Target ES2017, strict mode, path alias `@/*` → `./src/*`
- `postcss.config.mjs` - Tailwind CSS PostCSS plugin only

## Platform Requirements

**Development:**
- Node.js >=20 (devDep types target @types/node ^20)
- Supabase CLI for local DB (`supabase/config.toml`, local port 54321)
- PostgreSQL 17 (local Supabase Docker)

**Production:**
- Next.js-compatible hosting (Vercel recommended by default)
- Supabase hosted project (cloud)

---

*Stack analysis: 2026-07-23*
