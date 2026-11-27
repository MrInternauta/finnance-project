# Finnance — Product Requirements Document (PRD)

Status: Draft v0.1 · Date: 2026-11-27 · Owner: Felipe Ramirez

> Sources: codebase audit of `backend/` and `frontend/` (DeepWiki is not yet indexed for
> `MrInternauta/finnance-project` — index it at https://deepwiki.com/MrInternauta/finnance-project).
> Architecture reference: [`../CLAUDE.md`](../CLAUDE.md). Roadmap: [`PLAN.md`](PLAN.md).

## 1. Problem & Vision

People lack a simple, mobile-first way to record where their money goes. Finnance lets an
individual log income and expenses by category and see their balance at a glance, on iOS,
Android, and web.

## 2. Target Users & Roles

| Role (DB)    | Enum value | Who                         | Needs                                          |
| ------------ | ---------- | --------------------------- | ---------------------------------------------- |
| `CLIENT`     | `client`   | Default user (sign-up)      | Track own movements, see own summary           |
| `ADMIN`      | `admin`    | Super admin                 | Manage users, roles, categories                |

## 3. Goals / Non-goals

**Goals (v1)**
- A user can sign up, log in, and manage **only their own** movements.
- Dashboard shows income vs. expense and balance for a selectable period.
- Data is private per user; no endpoint leaks another user's data.
- Account recovery via password reset.

**Non-goals (v1)**
- Bank syncing / open banking, any currency other than MXN, shared household accounts,
  payments, push notifications.

## 4. Functional Requirements

| ID   | Requirement                                                                 | Priority | Current state                                                                 |
| ---- | --------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| FR-1 | Sign up / login / logout with JWT                                           | P0       | Done                                                                          |
| FR-2 | Authenticated user creates/edits/deletes **own** movements                  | P0       | **Broken**: create/update/delete are `@RoleD(Role.ADMIN)` only                 |
| FR-3 | Movement list scoped to the authenticated user                              | P0       | **Broken**: `GET /movements` is `@Is_PublicD()` and returns all users' data    |
| FR-4 | Owner taken from JWT, never from request body                               | P0       | **Broken**: `CreateMovementDto.userId` comes from client body                  |
| FR-5 | Movements with the same name allowed (e.g. "Coffee" twice)                  | P0       | **Broken**: `validateUniqueName()` enforces global unique names                |
| FR-6 | Filter by name, category, **date range**, income/expense                    | P1       | Partial (name exact-match, category)                                           |
| FR-7 | Dashboard: totals, balance, per-category breakdown, period selector         | P1       | Partial (chart exists)                                                         |
| FR-8 | Profile view/edit + avatar upload                                           | P1       | Done                                                                           |
| FR-9 | Password recovery (request email → reset token → new password)              | P1       | Page only; no backend endpoint                                                 |
| FR-10| Tab2: Reports / history view (replace "Products" placeholder)               | P2       | Not implemented                                                                |
| FR-11| Budgets / goals per category (`METAS`, `AHORRO`)                            | P2       | Not started                                                                    |
| FR-12| CSV export of movements                                                     | P2       | Not started                                                                    |
| FR-13| Admin: manage users, roles, categories                                      | P1       | Done (API)                                                                     |

## 5. Non-functional Requirements

- **Security:** every user-data endpoint requires JWT and enforces ownership; `GET /users/:id`
  must not be public; API key / JWT secret only from env (no defaults like `12345a` in prod);
  restrict CORS origins in prod.
- **Correctness:** domain errors return 4xx (today `BadRequestException` is swallowed into 500).
- **Quality:** unit tests for services, e2e tests for auth + movements; CI runs lint + tests.
- **Performance:** paginated lists (`page`, `limit`), p95 API < 300 ms locally.
- **Offline:** show offline alert (done); queued offline writes are a later enhancement.

## 6. Success Metrics

- A new user can register and log their first movement in < 60 s.
- 0 endpoints returning another user's data (verified by e2e test).
- ≥ 70% service-layer test coverage on `movements` and `auth`.

## 7. Decisions (2026-11-27)

| # | Question                                   | Decision                                                                                                  |
| - | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 1 | What is `CLIENT_PRO`, how is it granted?   | Two effective roles: **super admin** (`ADMIN`) and **default user** (`CLIENT`), assigned automatically at sign-up. `CLIENT_PRO` is not a separate tier in v1 (to confirm: retire it or keep as alias of `CLIENT`). |
| 2 | Currency                                   | **Single currency: MXN.** No per-user setting, no conversion. Format amounts as `es-MX` / `MXN`.         |
| 3 | Email provider for password reset          | **Resend** (`resend` SDK, `RESEND_API_KEY` env var).                                                     |
| 4 | User-defined categories                    | **Yes.** Keep the 15 seeded categories as global defaults (read-only for users) and let each user create/edit/delete their own categories. |

## 8. Requirements added by decisions

| ID    | Requirement                                                                                                  | Priority | Current state                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| FR-14 | Sign-up always assigns the default `CLIENT` role server-side; `role` is ignored on public `POST /users`       | P0       | **Broken**: `UsersService.create()` accepts `role` from the request body (privilege escalation) |
| FR-15 | Only super admin can change a user's role                                                                    | P0       | Partial (`PUT /users/:id` open to ADMIN + CUSTOMER, role field accepted)                       |
| FR-16 | All amounts displayed as MXN                                                                                 | P1       | Not verified                                                                                  |
| FR-17 | Password reset email sent through Resend; token hashed, single-use, expires in 30 min                        | P1       | Not started                                                                                   |
| FR-18 | Category has nullable `userId`: `null` = global default, set = user-owned. Users list defaults + their own; CRUD only on their own | P1 | Not started (categories are admin-only, global) |
