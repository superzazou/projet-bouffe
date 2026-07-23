# Testing Patterns

**Analysis Date:** 2026-07-23

## Test Framework

**Runner:** None configured

No test framework is installed. The `package.json` contains no test runner (no Jest, Vitest, Playwright, Cypress, or similar). The `scripts` block has no `test` command.

**Assertion Library:** None

**Run Commands:**
```bash
# No test commands available
npm run lint   # Only quality check available
npm run build  # Type-check via Next.js build
```

## Test File Organization

No test files exist in the repository. No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files were found.

## Test Types

**Unit Tests:** Not present

**Integration Tests:** Not present

**E2E Tests:** Not present

## Type Safety as Partial Quality Gate

The project uses TypeScript strict mode (`"strict": true` in `tsconfig.json`) as the primary correctness mechanism:

- All types are explicitly declared in `src/lib/types.ts`
- `import type` is used to distinguish type-only imports
- `NonNullable<>`, `Omit<>`, and intersection types enforce data shape correctness at compile time
- Non-null assertions (`!`) are used for environment variables in `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`

**Run type-check:**
```bash
npm run build   # Runs next build which includes tsc
```

## Linting as Quality Gate

ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` enforces:
- React Hooks rules
- Next.js-specific patterns (Image, Link, font usage)
- TypeScript best practices

```bash
npm run lint
```

## Coverage

**Requirements:** None enforced — no coverage tooling present

## Recommendations for Adding Tests

When tests are introduced, the following patterns fit the existing codebase structure:

**Suggested framework:** Vitest (compatible with Next.js, ESM, TypeScript without extra config)

**Unit test targets (highest value, lowest effort):**
- `src/lib/types.ts` — validate type constants like `INGREDIENT_UNITS`
- Server action logic in `src/app/(app)/recipes/actions.ts`, `src/app/(app)/planning/actions.ts`, `src/app/(app)/shopping-lists/actions.ts` — mock Supabase client to test branching logic

**Integration test targets:**
- Server actions with a Supabase test project or local Docker instance

**Suggested co-location pattern:**
```
src/app/(app)/recipes/actions.test.ts
src/lib/types.test.ts
```

**Mocking pattern for Supabase (suggested):**
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'recipe-1' }, error: null }),
  }),
}));
```

---

*Testing analysis: 2026-07-23*
