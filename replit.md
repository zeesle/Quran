# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Post-Merge Agent Checklist

After every post-merge run, call the following from the code_execution sandbox to surface any token expiry reminders as visible project tasks:

```javascript
const { ensureExpiryTask } = await import('/home/runner/workspace/scripts/ensure-expiry-task.mjs');
await ensureExpiryTask();
```

This is idempotent and fast when no reminder is needed. It creates a project task titled `"Rotate GitHub token by <YYYY-MM-DD>"` if `GH_PAT_EXPIRES` is ≤ 30 days away, and skips silently otherwise. Run it even when the post-merge succeeded normally.
