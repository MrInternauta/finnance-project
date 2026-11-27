# Finnance — Roadmap & Next Steps

Date: 2026-11-27 · Requirements: [`PRD.md`](PRD.md) · Architecture: [`../CLAUDE.md`](../CLAUDE.md)

## Current status snapshot

- Branch `main`, in sync with origin; uncommitted rename (Mini POS → finnance-project) in
  `CLAUDE.md`, `backend/README.md`, `frontend/capacitor.config.ts`, `frontend/ionic.config.json`.
- Local env conflict: ports **3000** and **5430** are used by the POS-Nest project
  (`POS/POS-Nest` node process + `postgres_dev` container). Stop it or remap ports before
  `docker-compose up`.
- DeepWiki not indexed for this repo yet.

## Phase 0 — Housekeeping (½ day)

- [ ] Commit rename changes; add `.DS_Store` to `.gitignore`.
- [ ] Index repo on DeepWiki.
- [ ] Remove remaining POS leftovers (Swagger title "The store API description",
      `readme.md` "Nest store", `validateUniqueCode`, `findOnebyCode`).
- [ ] Remove toy tests in `backend/test/fortesting` (sum/palindrome).

## Phase 1 — Make it a real personal-finance app (P0, security/correctness)

Backend (`backend/src/movements`, `backend/src/users`):
- [ ] `MovementsController`: drop `@Is_PublicD()` on `GET /movements` and `GET /movements/:id`;
      allow `Role.CUSTOMER` + `Role.ADMIN` on create/update/delete/restore.
- [ ] Inject the user from JWT (`req.user.sub`) and scope every query/mutation by `userId`;
      remove `userId` from `CreateMovementDto`. Return 404 for other users' movements.
- [ ] Remove `validateUniqueName()` from create/update.
- [ ] Stop wrapping `HttpException`s into `InternalServerErrorException`.
- [ ] Protect `GET /users/:id` (self or ADMIN only).
- [ ] Sign-up (`POST /users`): ignore `role`, always assign `CLIENT` (FR-14); only ADMIN may change roles (FR-15).
- [ ] Decide fate of `CLIENT_PRO` seed role (retire or alias of `CLIENT`).
- [ ] e2e tests: user A cannot read/modify user B's movements; client can CRUD own movements.

Frontend (`frontend/src/app/pages/dashboard`):
- [ ] Stop sending `userId` in movement payloads.
- [ ] Re-enable `RoleGuardGuard` in `tabs-routing.module.ts` with real role names
      (`ADMIN`, `CLIENT_PRO`, `CLIENT` — not `CASHIER`).

## Phase 2 — Core UX (P1)

- [ ] Filters: date range, income/expense, partial-name search (`ILike`).
- [ ] Summary endpoint `GET /movements/summary?from&to` → totals, balance, per-category.
- [ ] Dashboard period selector + per-category chart.
- [ ] Password recovery via **Resend**: add `resend` dep + `RESEND_API_KEY` to Joi config;
      `POST /auth/forgot` + `POST /auth/reset` (hashed, single-use, 30-min token; new migration);
      wire `forget-pass` page.
- [ ] User categories (FR-18): migration adding nullable `category.userId`; `GET /categories`
      returns defaults + own; users CRUD own only; defaults stay admin-managed; category
      picker in movement detail modal shows both.
- [ ] MXN formatting everywhere amounts render (`currency:'MXN':'symbol':'1.2-2':'es-MX'`).

## Phase 3 — Growth features (P2)

- [ ] Replace Tab2 "Products" placeholder with Reports/History.
- [ ] Budgets & goals per category.
- [ ] CSV export.

## Phase 4 — Quality & ops

- [ ] CI: run backend `npm test` + e2e and frontend `ng test --watch=false` in GitHub Actions.
- [ ] Prod hardening: env-only secrets, CORS allowlist, rate limit `/auth`.
- [ ] Move API base URL to build-time env per target.

## Immediate next steps (this week)

1. Phase 0 housekeeping + commit.
2. Free ports 3000/5430, bring up `backend` stack, run migrations + seed.
3. Phase 1 backend ownership/auth fixes with e2e tests (highest risk: data leak).
4. Confirm `CLIENT_PRO` interpretation (PRD §7 #1), then start Phase 2 (Resend reset, user categories).
