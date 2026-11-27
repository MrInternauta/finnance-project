# Finnance — Roadmap & Next Steps

Date: 2026-11-27 · Requirements: [`PRD.md`](PRD.md) · Architecture: [`../CLAUDE.md`](../CLAUDE.md)

## Current status snapshot

- Work delivered on `feat/roadmap-v1`: Batch A (`5ca27a5`, Phases 0–1), Batch B (`4d18c5a`,
  Phase 2 + rework), Batch C (Phases 3–4, uncommitted pending review).
- Local env conflict: ports **3000** and **5430** are used by the POS-Nest project
  (`POS/POS-Nest` node process + `postgres_dev` container). Stop it or remap ports before
  `docker-compose up`. A throwaway `finnance_test_pg` container on **5433** is used for e2e.
- DeepWiki not indexed for this repo yet.
- Frontend production build (`ng build`) fails on Google Fonts inlining in sandboxed envs
  (Node https blocked); verified via `--configuration development`.

## Phase 0 — Housekeeping (½ day)

- [ ] Commit rename changes; add `.DS_Store` to `.gitignore`. *(still pending)*
- [ ] Index repo on DeepWiki. *(still pending)*
- [x] Remove remaining POS leftovers (Swagger title → "Finnance API", `readme.md` →
      "NestJS - Backend", `validateUniqueCode`, `findOnebyCode`). — Batch A
- [x] Remove toy tests in `backend/test/fortesting` (sum/palindrome). — Batch A

## Phase 1 — Make it a real personal-finance app (P0, security/correctness)

Backend (`backend/src/movements`, `backend/src/users`): — Batch A (`5ca27a5`)

- [x] `MovementsController`: dropped `@Is_PublicD()` on `GET /movements` and `GET /movements/:id`;
      all endpoints `Role.CUSTOMER` + `Role.ADMIN`.
- [x] User injected from JWT via `@CurrentUser()` (`core/auth/decorators`); every
      query/mutation scoped by `userId`; `userId` removed from `CreateMovementDto`;
      other users' movements → 404.
- [x] Removed `validateUniqueName()` (and unique index via migration `1795814625128`).
- [x] `HttpException`s no longer swallowed into `InternalServerErrorException`.
- [x] `GET /users/:id` protected (self or ADMIN only).
- [x] Sign-up (`POST /users`) ignores `role`, always assigns `CLIENT` (FR-14); only ADMIN
      may change roles (FR-15).
- [~] `CLIENT_PRO` seed role kept and aliased to `CLIENT` in `RolesGuard`. **Deferred:**
      retire-vs-keep decision still pending user confirmation.
- [x] e2e tests: user A cannot read/modify user B's movements; client can CRUD own movements.

Frontend (`frontend/src/app/pages/dashboard`):

- [x] Stopped sending `userId` in movement payloads.
- [x] Re-enabled `RoleGuardGuard` in `tabs-routing.module.ts` with real role names
      (`ADMIN`, `CLIENT_PRO`, `CLIENT`).

## Phase 2 — Core UX (P1)

— Batch B (`4d18c5a`)

- [x] Filters: date range (`from`/`to`), income/expense, partial-name search (`ILike`,
      wildcard-escaped).
- [x] Summary endpoint `GET /movements/summary?from&to` → totals, balance, per-category.
- [x] Dashboard period selector + per-category doughnut chart + income/expense/balance cards.
- [x] Password recovery via **Resend**: `resend@4.8.0` + `RESEND_API_KEY`/`RESEND_FROM`/
      `FRONTEND_URL` in Joi config; `POST /auth/forgot` + `POST /auth/reset` (sha256-hashed,
      single-use, 30-min token; migration `1795815327280`); `forget-pass` wired, new
      `authentication/reset-password` page.
- [x] User categories (FR-18): nullable `category.userId`; `GET /categories` returns
      defaults + own (unpaginated); users CRUD own only; defaults admin-managed; inline
      category creation in movement detail; "Mis categorías" in profile tab.
- [x] MXN formatting: `es-MX` locale registered + `LOCALE_ID` (`currency` pipe renders MXN).

## Phase 3 — Growth features (P2)

— Batch C

- [x] Tab2 "Products" placeholder replaced with Reportes: monthly bar chart
      (`GET /movements/summary/monthly`), per-month totals, period selector.
- [x] Budgets per category (FR-11): `budget` table, `/budgets` CRUD scoped to user,
      spent/remaining vs expenses in period; "Presupuestos" section in Reportes tab.
      **Deferred:** savings goals (`METAS`/`AHORRO` goal tracking) — follow-up.
- [x] CSV export (FR-12): `GET /movements/export?from&to`, BOM + quoting +
      formula-injection escaping; download button in Reportes tab.
      **Deferred:** native file save/share on Capacitor — follow-up (currently browser download).

## Phase 4 — Quality & ops

— Batch C

- [x] CI: `.github/workflows/ci.yml` — backend (Node 18, `npm ci`, build, `npx jest`,
      migrations + e2e on `postgres:14` service) and frontend (Node 20.9, `npm ci`, `ng build`).
- [x] Prod hardening: `JWT_SECRET`/`API_KEY` already required in Joi (verified, no hardcoded
      fallbacks in `src/`); CORS allowlist via optional `CORS_ORIGINS`; `/auth` rate-limited
      to 5 req / 60 s per IP via `@nestjs/throttler@6.8.0`.
- [x] API base URL per target: `angular.json` production `fileReplacements`
      (`environment.ts` → `environment.prod.ts`) verified present.

## Remaining work

1. Free ports 3000/5430 (or remap), bring up `backend` stack, run migrations + seed.
2. Push `feat/roadmap-v1` and open a PR.
3. Confirm `CLIENT_PRO` interpretation (PRD §7 #1): retire role or keep as `CLIENT` alias.
4. Deferred follow-ups: savings goals, native CSV save/share (Capacitor Filesystem/Share),
   DeepWiki indexing.
5. Set real `RESEND_API_KEY`, `RESEND_FROM`, `FRONTEND_URL`, `CORS_ORIGINS` in prod env.
