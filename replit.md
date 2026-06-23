# Wédas

Plataforma interna de reconhecimento corporativo onde colaboradores enviam "Wédas" (moedas) para colegas.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/wedas run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, path prefix `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter + TanStack Query
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/` — Drizzle ORM schema (users, categories, recognitions, monthly_allocations, settings)
- `lib/api-client-react/src/generated/api.ts` — generated hooks (do NOT edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — JWT + password helpers
- `artifacts/api-server/src/lib/allocations.ts` — monthly allocation logic
- `artifacts/wedas/src/pages/` — all page components
- `artifacts/wedas/src/hooks/use-auth.tsx` — auth context + JWT management
- `artifacts/wedas/src/components/layout/` — sidebar + app layout

## Architecture decisions

- Auth: JWT stored in `localStorage` as `wedas_token`; injected via `window.fetch` override in `AuthProvider`
- Roles: `employee | manager | hr` — HR sees everything, managers see Painel RH, employees see core features
- Monthly coin allocation auto-created on first use via `ensureMonthlyAllocation()` helper
- API contract-first: OpenAPI spec → Orval codegen → typed hooks consumed by frontend
- `drizzle-zod` generates Zod schemas from DB schema for request validation

## Product

- **Dashboard**: saldo disponível, Wédas recebidas/enviadas no mês, posição no ranking, reconhecimentos recentes
- **Enviar Wédas**: wizard 5 etapas (colaborador → quantidade → categoria → mensagem → confirmar)
- **Histórico**: reconhecimentos enviados e recebidos, filtráveis por categoria
- **Ranking**: mais reconhecidos, mais engajados, por categoria
- **Painel RH/Gestor**: KPIs globais + gráfico de evolução mensal
- **Relatórios** (RH): tabelas de colaboradores, financeiro e categorias
- **Usuários** (RH): CRUD de colaboradores
- **Configurações** (RH): limite mensal de Wédas e taxa de conversão financeira

## Demo credentials

- RH: `rh@wedas.com` / `senha123`
- Colaborador: `rodrigo@wedas.com` / `senha123`
- Gestor: `carlos@wedas.com` / `senha123`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- `drizzle-zod` `insertSchema` strips auto-generated fields (id, createdAt, updatedAt)
- `drizzle-orm`'s `and(...conditions)` requires `conditions: SQL[]`, not `SQLWrapper | undefined`
- `UseQueryOptions` from TanStack Query requires explicit `queryKey` — use the generated `get*QueryKey()` helpers

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
