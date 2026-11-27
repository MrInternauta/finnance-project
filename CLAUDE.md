# Finnance — finnance-project

Personal finnance tracking mobile app. Users register income/expenses by category, manage their profile, and are controlled via role-based access. Runs on iOS, Android, and web.

---

## General Structure

```text
finnance-project/
├── backend/    NestJS REST API — auth, business logic, DB
└── frontend/   Ionic/Angular 18 mobile app — UI, state, Capacitor
```

The two sub-projects are fully independent. Communication is HTTP REST with JWT Bearer tokens.

---

## Backend

### Backend Tech Stack

- **Runtime:** Node.js 18
- **Framework:** NestJS 10
- **Language:** TypeScript 4.7
- **ORM:** TypeORM 0.3 (`synchronize: false` — migrations only)
- **Database:** PostgreSQL (driver: `pg`)
- **Auth:** Passport — JWT strategy + Local strategy (email/password)
- **Password hashing:** bcrypt (10 rounds)
- **Validation:** class-validator + class-transformer (DTOs), Joi (env vars)
- **File uploads:** Multer via `@nestjs/platform-express` (JPG/PNG, max 2MB)
- **API docs:** Swagger at `/docs`
- **Testing:** Jest + ts-jest

### Backend src/ Folder Architecture

```text
src/
├── main.ts                     Bootstrap — global pipes, ClassSerializerInterceptor
├── app.module.ts               Root module
├── config.ts                   Joi env validation schema
│
├── home/
│   ├── app.controller.ts       Utility endpoints: seed DB, upload/serve images
│   └── app.service.ts          Seed logic (roles, users, categories, movements)
│
├── core/
│   ├── auth/
│   │   ├── strategies/         jwt.strategy.ts, local.strategy.ts
│   │   ├── guards/             jwt-auth.guard.ts (global), roles.guard.ts, api-key.guard.ts
│   │   ├── decorators/         @Is_PublicD() bypass JWT, @RoleD() set required roles
│   │   ├── controllers/        auth.controller.ts — POST /auth
│   │   ├── services/           auth.service.ts — validateUser, signToken
│   │   └── models/             roles.model.ts (enum: admin | client), token.model.ts
│   ├── database/
│   │   ├── database.module.ts  Global TypeORM config (reads env vars)
│   │   ├── data-source.ts      CLI DataSource for migration commands
│   │   └── migrations/         1735627479683 — initial schema
│   │                           1747982567572 — user.image nullable
│   │                           1795814625128 — drop movement unique index
│   │                           1795815327280 — category.id_user, password_reset_token
│   │                           1795816652908 — budget table
│   ├── interfaces/
│   │   ├── basic.entity.ts     Base class: createdAt, updatedAt, deletedAt (soft-delete)
│   │   ├── filter.dto.ts       Shared pagination DTO (page, limit)
│   │   └── service.interface.ts Generic CRUD service contract
│   └── pipes/                  validator.pipe.ts, parse-int.pipe.ts
│
├── users/
│   ├── entities/               user.entity.ts, role.entity.ts, permission.entity.ts
│   ├── dtos/                   user.dto.ts, role.dto.ts
│   ├── services/               users.service.ts, roles.service.ts
│   └── controllers/            users.controller.ts, rols.controller.ts, profile.controller.ts
│
└── movements/
    ├── entities/               movement.entity.ts (named "Product" in code), category.entity.ts,
    │                           budget.entity.ts
    ├── dtos/                   movement.dto.ts, category.dto.ts, movementFilter.dto.ts,
    │                           budget.dto.ts
    ├── services/               movements.service.ts, categories.service.ts, budgets.service.ts
    └── controllers/            movements.controller.ts, categories.controller.ts,
                                budgets.controller.ts
```

### Data Model

```text
Role ◄────────────── Permission
 │     (ManyToMany via permission_role)
 │
User ──► Role
 │
 └──► Movement  (entity file: movement.entity.ts, named "Product" in code)
 │        ├── name, date, quantity (real), description
 │        ├── income: boolean  (true = income / false = expense)
 │        └──► Category  (nullable user FK: null = global default, set = user-owned)
 │               └── SUELDO | INVERSIONES | ALOJAMIENTO | ENTRETENIMIENTO
 │                   TRANSPORTE | GTS_PERSONALES | SEGUROS | CREDITO | COMIDA
 │                   AHORRO | APRENDIZAJE | REGALOS | CUIDADO_PERSONAL | METAS | OTROS
 │
 ├──► Category  (user-defined categories, FR-18)
 ├──► Budget    (one active per user+category)
 └──► PasswordResetToken  (sha256 hash, 30-min expiry, single-use)
```

- All entities extend `BasicEntity` → soft-delete via `deletedAt`, never hard-deleted
- Default seeded roles: `ADMIN`, `CLIENT_PRO`, `CLIENT`
- Default seeded users: `admin@admin.com`, `cashier@cashier.com`, `client@client.com`
- Seed endpoint: `GET /api/setDefaultValues` (protected by API key header `auth`)

### Endpoints

All routes prefixed with `/api`. Auth column: Public / JWT / ADMIN / CUSTOMER.

| Method | Route                     | Auth           | Description                               |
| ------ | ------------------------- | -------------- | ----------------------------------------- |
| POST   | `/auth`                   | Public, 5/min  | Login → `{ access_token, user }`          |
| POST   | `/auth/forgot`            | Public, 5/min  | Request password reset email              |
| POST   | `/auth/reset`             | Public, 5/min  | Reset password with token                 |
| GET    | `/users`                  | ADMIN          | List users (paginated)                    |
| GET    | `/users/:id`              | ADMIN or self  | Get user by ID                            |
| POST   | `/users`                  | Public         | Create user (sign up; role always CLIENT) |
| PUT    | `/users/:id`              | ADMIN/CUSTOMER | Update user (self unless ADMIN; role only by ADMIN) |
| DELETE | `/users/:id`              | ADMIN          | Soft-delete user                          |
| GET    | `/profile/my-orders`      | CUSTOMER       | Authenticated user's movements            |
| GET    | `/roles`                  | ADMIN          | List roles                                |
| POST   | `/roles`                  | ADMIN          | Create role                               |
| PUT    | `/roles/:id`              | ADMIN          | Update role                               |
| DELETE | `/roles/:id`              | ADMIN          | Soft-delete role                          |
| GET    | `/movements`              | ADMIN/CUSTOMER | Own movements (filter: name, categoryId, from, to, income) |
| GET    | `/movements/summary`      | ADMIN/CUSTOMER | Totals + per-category for `from`/`to`     |
| GET    | `/movements/summary/monthly` | ADMIN/CUSTOMER | Totals grouped by month                |
| GET    | `/movements/export`       | ADMIN/CUSTOMER | CSV download of own movements             |
| GET    | `/movements/:id`          | ADMIN/CUSTOMER | Get own movement by ID                    |
| POST   | `/movements`              | ADMIN/CUSTOMER | Create movement                           |
| PUT    | `/movements/:id`          | ADMIN/CUSTOMER | Update own movement                       |
| PUT    | `/movements/:id/restore`  | ADMIN/CUSTOMER | Restore own soft-deleted movement         |
| DELETE | `/movements/:id`          | ADMIN/CUSTOMER | Soft-delete own movement                  |
| GET    | `/categories`             | ADMIN/CUSTOMER | Defaults + own categories (unpaginated)   |
| GET    | `/categories/:id`         | ADMIN/CUSTOMER | Get default/own category by ID            |
| POST   | `/categories`             | ADMIN/CUSTOMER | Create category (ADMIN → global; CLIENT → own) |
| PUT    | `/categories/:id`         | ADMIN/CUSTOMER | Update (ADMIN: defaults+own; CLIENT: own) |
| PUT    | `/categories/:id/restore` | ADMIN/CUSTOMER | Restore (same ownership rules)            |
| DELETE | `/categories/:id`         | ADMIN/CUSTOMER | Soft-delete (same ownership rules)        |
| GET    | `/budgets`                | ADMIN/CUSTOMER | Own budgets + spent/remaining for `from`/`to` |
| POST   | `/budgets`                | ADMIN/CUSTOMER | Create budget {categoryId, amount}        |
| PUT    | `/budgets/:id`            | ADMIN/CUSTOMER | Update own budget amount                  |
| DELETE | `/budgets/:id`            | ADMIN/CUSTOMER | Soft-delete own budget                    |
| GET    | `/setDefaultValues`       | API Key        | Seed DB with defaults                     |
| POST   | `/image/:type/:id`        | ADMIN          | Upload image (JPG/PNG ≤ 2MB)              |
| GET    | `/image/:type/:img`       | ADMIN/CUSTOMER | Retrieve stored image                     |
| GET    | `/docs`                   | Public         | Swagger UI                                |

---

## Frontend

### Frontend Tech Stack

- **Framework:** Angular 18
- **UI Shell:** Ionic 8
- **Language:** TypeScript 5.4 (strict mode)
- **State:** NgRx 18 (Store + Effects + Devtools)
- **Styling:** Tailwind CSS 3 + Ionic CSS Variables (primary: `#dc2626`, secondary: `#e11d48`)
- **Charts:** Chart.js 4 + ng2-charts
- **Modals/alerts:** ng-zorro-antd 18 (`NzModalService`)
- **Native bridge:** Capacitor 6
- **Testing:** Karma + Jasmine

### Frontend src/ Folder Architecture

```text
src/
├── main.ts, polyfills.ts, zone-flags.ts
├── environments/
│   ├── environment.ts          API base URL dev: http://192.168.100.51:3000/api/
│   └── environment.prod.ts     API base URL prod
│
└── app/
    ├── app.module.ts           Root — registers CoreModule, AuthModule, NgRx effects
    ├── app-routing.module.ts   /tabs (LoginGuard), /authentication (LogoutGuard), /notfound
    ├── app.component.ts        Calls AuthService.loadStorage() on init
    │
    ├── core/                   Shared infrastructure
    │   ├── base/               component.base.ts — lifecycle base class
    │   ├── components/         button, input, avatar, select, alert, product-card,
    │   │                       product-item, filter-popover, heading
    │   ├── constants/          api-prefix, constants.helper, loginMode.enum, ignore.error
    │   ├── directive/          PhoneMask.directive.ts — formats (XXX) XXX-XXXX
    │   ├── guards/             login-guard (auth check), logout (redirect if logged in),
    │   │                       role-guard (role check)
    │   ├── interceptors/       auth.interceptor.ts — injects Bearer, 30s timeout, auto-logout on 401
    │   ├── models/             basic.entity, filter.dto, credentials, error, usuario.model,
    │   │                       usuario.rols.model, Iworkout.model, Response/Generic.ts
    │   ├── pipes/              safeHtml, Image (cache-busting timestamp), getProfile
    │   ├── services/           api.service (base HttpClient), storage.service (localStorage),
    │   │                       modal.service (NzModal), file.service (upload), picture.service (camera)
    │   ├── state/              store.module.ts, app.reducer.ts (AppState root)
    │   └── util/               helpers, validator.helper, status.codes, get-route-param
    │
    ├── auth/
    │   ├── model/              user.dto, role.dto, Auth.ts (AuthSuccess shape)
    │   ├── pages/              login/, sign-up-1/, forget-pass/, reset-password/
    │   ├── services/           auth.service.ts — login, logout, hasSession, loadStorage
    │   └── state/              auth.actions, auth.state (IAuthState), permissions.effects
    │
    └── pages/
        ├── tabs.page.ts + tabs-routing.module.ts
        ├── dashboard/          Tab1 — chart + movement list + create/edit modal
        │   ├── detail/         detail.component.ts — create/edit movement
        │   ├── models/         order.model, category.dto, productFilter.dto, order.filter.dto
        │   ├── services/       workout.service (movements CRUD + categories), order.service
        │   └── state/          workout.actions, workout.effects, workout.selector, workout.state
        ├── profile/            Tab3 — profile view/edit + avatar upload + "Mis categorías"
        │   ├── models/         user-updated.ts
        │   └── services/       profile.service.ts (users CRUD)
        ├── products/           Tab2 — "Reportes": monthly bar chart, budgets, CSV export
        └── error-page/         404 page
```

### Hybrid Stack (Capacitor)

```text
Angular 18 → Ionic 8 → Capacitor 6
                            ├── @capacitor/camera     photo capture / gallery
                            ├── @capacitor/status-bar  status bar theming
                            ├── @capacitor/keyboard    keyboard overlap handling
                            ├── @capacitor/haptics     vibration feedback
                            └── @capacitor/app         app lifecycle events
```

App ID: `mx.ramirex.finnance-project` | Name: `finnance-project` | Targets: iOS, Android, Web

### App Flow

```text
App launch → AuthService.loadStorage()
    ├── Session found  → /tabs/tab1  (Dashboard)
    └── No session     → /authentication/login-1

Login → POST /api/auth → store { id, token, user } in localStorage
     → dispatch setUser (NgRx) → /tabs/tab1

Tab1 (Dashboard) → GET /api/movements + GET /api/categories
               → Chart.js income/expense chart
               → FAB → Detail modal → create/edit movement

Tab3 (Profile)  → display user info → edit → PUT /api/users/:id
               → camera → compress (quality 60, max 500×500) → POST /api/image/user/:id
               → "Mis categorías" → GET/DELETE /api/categories

Tab2 (Reportes) → GET /api/movements/summary/monthly + GET /api/budgets + GET /api/categories
               → bar chart income vs expense → "Exportar CSV" → GET /api/movements/export

Logout → clear localStorage → dispatch unUser → /authentication/login-1
```

### Communications

```text
Frontend ──[HTTP + Bearer JWT]──► Backend ──[TypeORM]──► PostgreSQL
```

- **AuthInterceptor:** adds `Authorization: Bearer <token>`, 30s timeout, auto-logout on 401
- **API base URL:** `environment.ts` → update per environment before building

| Service          | Hits                                                |
| ---------------- | --------------------------------------------------- |
| `AuthService`    | `POST /auth`, `POST /auth/forgot`, `POST /auth/reset`, `POST /users`, `GET /users` |
| `WorkoutService` | `GET/POST/PUT/DELETE /movements`, `/movements/summary(+monthly)`, `/movements/export`, `/categories`, `/budgets` |
| `OrderService`   | `GET /movements`                                    |
| `ProfileService` | `GET/POST/PUT/DELETE /users`                        |
| `FileService`    | `POST /image/:type/:id`                             |

### Functionalities

| Feature                               | Status                                 |
| ------------------------------------- | -------------------------------------- |
| Login / Logout                        | Done                                   |
| Sign up                               | Done                                   |
| Dashboard with income/expense chart   | Done (+ period selector, summary cards, doughnut) |
| Create / edit / delete movements      | Done                                   |
| Filter movements by name, category, date range, income/expense | Done          |
| View and edit user profile            | Done                                   |
| Upload avatar (camera or gallery)     | Done                                   |
| Offline detection alert               | Done                                   |
| Role-based access control             | Done                                   |
| Reports tab (Tab2): monthly bar chart + totals | Done                     |
| Budgets per category                  | Done (in Reports tab)                  |
| CSV export                            | Done (browser download)                |
| User-defined categories               | Done (profile "Mis categorías")        |
| Password recovery                     | Done (Resend email → reset-password page) |
| MXN currency / es-MX locale           | Done                                   |

---

## Project Docs

- **PRD / requirements:** [`doc/PRD.md`](doc/PRD.md)
- **Roadmap & next steps:** [`doc/PLAN.md`](doc/PLAN.md)
- **DeepWiki:** <https://deepwiki.com/MrInternauta/finnance-project> (not indexed yet)

Product decisions (PRD §7): roles = super admin (`ADMIN`) + default user (`CLIENT`, auto-assigned
at sign-up); currency **MXN only**; password reset email via **Resend**; categories = global
defaults + user-defined.

---

## Infrastructure

### Running Locally (Docker)

```text
dockerfile              Production image (Node 18)
dockerfile.dev          Dev image with hot reload
docker-compose.yml      Production stack
docker-compose.override.yml  Local dev overrides (auto-merged on docker-compose up)
```

**Start backend:**

```bash
cd backend
docker-compose up -d
```

Spins up:

- `node_dev_finnance` — NestJS on port **3000** (debug: **9229**), hot-reload enabled
- `postgres_dev_finnance` — PostgreSQL on port **5430** (external)

**Run migrations (first time, or after adding new ones):**

`ts-node` is not available on the host machine — run migrations inside the container.
The `data-source.ts` uses `POSTGRES_HOST_EXTERNAL` which defaults to `localhost:5430`.
Inside the container that address doesn't resolve, so override it to the internal service name:

```bash
docker exec node_dev_finnance sh -c \
  "POSTGRES_HOST_EXTERNAL=postgres_service_finnance POSTGRES_PORT_EXTERNAL=5432 npm run migrations:run"
```

**Seed default data (first time only):**

```bash
curl -H "auth: 12345a" http://localhost:3000/api/setDefaultValues
```

Creates: 3 roles, 3 users, 15 categories, 5 sample movements.

**Default credentials (all seeded users share the same password):**

| Email                 | Role       | Password     |
| --------------------- | ---------- | ------------ |
| `admin@admin.com`     | ADMIN      | `1234567890` |
| `cashier@cashier.com` | CLIENT_PRO | `1234567890` |
| `client@client.com`   | CLIENT     | `1234567890` |

**Verify:**

- Swagger UI: <http://localhost:3000/docs>
- Login: `POST http://localhost:3000/api/auth` `{ "email": "admin@admin.com", "password": "1234567890" }`

**Stop:**

```bash
docker-compose down          # stop containers, keep DB volume
docker-compose down -v       # stop + wipe DB volume
```

**Known gotcha — duplicate `devred` network:**
If `docker-compose up` fails with `network devred is ambiguous`, remove the orphan networks:

```bash
docker network ls --filter name=devred   # find the IDs
docker network rm <id1> <id2>            # remove both
docker-compose up -d                     # retry
```

### Kubernetes

`k8s/` folder + `cluster.yaml` + `crds.yaml` — manifests present for cloud deployment.

### CI/CD

`buildspec.yaml` — AWS CodeBuild pipeline.

### Database & Migrations

- **Engine:** PostgreSQL
- **ORM:** TypeORM 0.3, `synchronize: false`
- **Migrations path:** `backend/src/core/database/migrations/`
- **Data source config:** `backend/src/core/database/data-source.ts`

| Migration                    | Change                      |
| ---------------------------- | ---------------------------------------------------- |
| `1735627479683-migration.ts` | Initial schema — all tables                          |
| `1747982567572-migration.ts` | `user.image` → nullable                              |
| `1795814625128-migration.ts` | Drop movement unique index (name,date,category,income) |
| `1795815327280-migration.ts` | `category.id_user` FK + `password_reset_token` table |
| `1795816652908-migration.ts` | `budget` table (user + category FKs)                 |

```bash
# Migration commands (run from backend/)
npm run migrations:run        # apply pending
npm run migrations:generate   # generate from entity diff
npm run migrations:revert     # rollback last
```

### Required Environment Variables (backend `.env`)

```text
API_KEY
JWT_SECRET
JWT_EXPIRES_IN
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_PORT
POSTGRES_HOST
POSTGRES_HOST_EXTERNAL
POSTGRES_PORT_EXTERNAL
IMAGES_PATH
RESEND_API_KEY   (optional — password reset emails)
RESEND_FROM      (optional — e.g. "Finnance <no-reply@yourdomain>")
FRONTEND_URL     (optional — used to build reset links)
CORS_ORIGINS     (optional — comma-separated origin allowlist; Capacitor needs
                  `capacitor://localhost` and `http://localhost`)
```

---

## Key Conventions

- **New backend feature:** entity → DTO → service → controller → module registration
- **New frontend feature:** model → service → state (actions/effects/selector) → page/component
- **All deletes are soft-delete** — use `.softDelete()`, never `.delete()`. Restore endpoints exist.
- **`Movement` entity is named `Product` in backend code** — do not rename, it will break things.
- **Frontend path alias is `@gymTrack/*`** — leftover name, don't rename without updating `tsconfig.json`.
- **API base URL is hardcoded** in `frontend/src/environments/environment.ts` — must be updated per environment before building for staging/production.
- **No queues, no cron jobs, no external payment/notification services** — the backend is fully synchronous.
- **Tab2 is "Reportes"** — the `pages/products/` folder name is kept (renaming would churn paths) but it renders the reports view: monthly chart, budgets, CSV export.
