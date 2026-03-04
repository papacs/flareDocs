# TASKS.md

## Status Legend

- `Done`: completed and reflected in repository docs/code
- `In Progress`: currently being implemented
- `Pending`: not started
- `Blocked`: waiting on a prerequisite or user decision

## Master Checklist

| Step | Task | Status | Notes |
| --- | --- | --- | --- |
| 0 | Create baseline repository docs | Done | `README.md`, `AGENTS.md`, `TASKS.md` created |
| 1 | Initialize Nuxt baseline + TS + Tailwind + ESLint/Prettier + Nuxt UI | Done | Current scaffold is Nuxt 4.3.1; prompt originally asked for Nuxt 3 |
| 2 | Integrate Drizzle + D1 schema + migrations | Done | Schema, initial migration, D1 helper, and health endpoint added |
| 3 | Implement users + auth APIs | Done | JWT cookie, register, login, logout, `me`, and same-origin middleware |
| 4 | Implement spaces + membership + RBAC helper | Done | Space CRUD entry points and member management routes added |
| 5 | Implement documents CRUD + tree + optimistic lock | Done | Tree endpoint, CRUD, parent checks, and 409 conflict response added |
| 6 | Add ByteMD editor and document UI | Done | Responsive login, dashboard, workspace, and version-aware save flow added |
| 7 | Add R2 upload flow | Done | R2 upload API, public asset route, and editor insertion wired up |
| 8 | Add audit log write path and query UI | Done | Async audit writes, admin query API, and audit page added |
| 9 | Add `scripts/setup.ts` and deployment docs | Done | Setup script, `.env.example`, and deployment notes added |

## Current Focus

- Validation and Cloudflare provisioning follow-up
- Reinstall dependencies on the active platform before re-running Nuxt validation

## Completed

### Step 0

Date: 2026-03-04

- Added [README.md](/mnt/e/workspace/flareDocs/README.md) with project overview, scope, roadmap, and current status
- Added [AGENTS.md](/mnt/e/workspace/flareDocs/AGENTS.md) with contributor workflow rules
- Added [TASKS.md](/mnt/e/workspace/flareDocs/TASKS.md) as the progress ledger

### Step 1

Date: 2026-03-04

- Added Nuxt/Nitro scaffold with `srcDir` set to [app/](/mnt/e/workspace/flareDocs/app)
- Added Tailwind CSS and Nuxt UI baseline in [package.json](/mnt/e/workspace/flareDocs/package.json) and [nuxt.config.ts](/mnt/e/workspace/flareDocs/nuxt.config.ts)
- Added a mobile-first landing shell in [app/pages/index.vue](/mnt/e/workspace/flareDocs/app/pages/index.vue)
- Added base visual system and responsive layout styles in [app/assets/css/main.css](/mnt/e/workspace/flareDocs/app/assets/css/main.css)
- Added linting and formatting config in [eslint.config.mjs](/mnt/e/workspace/flareDocs/eslint.config.mjs), [.prettierrc.json](/mnt/e/workspace/flareDocs/.prettierrc.json), and [.prettierignore](/mnt/e/workspace/flareDocs/.prettierignore)
- Verified `pnpm lint`, `pnpm typecheck`, and `pnpm build`

### Step 2

Date: 2026-03-04

- Added Drizzle ORM, Drizzle Kit, Wrangler, and Cloudflare Workers types in [package.json](/mnt/e/workspace/flareDocs/package.json)
- Added the database schema in [db/schema.ts](/mnt/e/workspace/flareDocs/db/schema.ts)
- Added the initial SQL migration in [db/migrations/0000_initial.sql](/mnt/e/workspace/flareDocs/db/migrations/0000_initial.sql)
- Added D1 runtime access helper in [db.ts](/mnt/e/workspace/flareDocs/app/server/utils/db.ts)
- Added minimal database health endpoint in [db.get.ts](/mnt/e/workspace/flareDocs/app/server/api/health/db.get.ts)
- Added baseline Cloudflare config in [wrangler.toml](/mnt/e/workspace/flareDocs/wrangler.toml)
- Verified `pnpm lint`, `pnpm typecheck`, and `pnpm build`

### Step 3

Date: 2026-03-04

- Added `NUXT_AUTH_SECRET` example in [.env.example](/mnt/e/workspace/flareDocs/.env.example)
- Added password hashing utility in [password.ts](/mnt/e/workspace/flareDocs/app/server/utils/password.ts)
- Added JWT cookie/session utility in [auth.ts](/mnt/e/workspace/flareDocs/app/server/utils/auth.ts)
- Added unified API response helpers in [response.ts](/mnt/e/workspace/flareDocs/app/server/utils/response.ts)
- Added same-origin write protection middleware in [csrf.ts](/mnt/e/workspace/flareDocs/app/server/middleware/csrf.ts)
- Added auth endpoints in [app/server/api/auth](/mnt/e/workspace/flareDocs/app/server/api/auth)
- Verified `pnpm lint`, `pnpm typecheck`, and `pnpm build`

### Step 4

Date: 2026-03-04

- Added reusable space access helpers in [spaces.ts](/mnt/e/workspace/flareDocs/app/server/utils/spaces.ts)
- Added route param parsing helper in [request.ts](/mnt/e/workspace/flareDocs/app/server/utils/request.ts)
- Added space list/create/detail endpoints in [app/server/api/spaces](/mnt/e/workspace/flareDocs/app/server/api/spaces)
- Added member add/update/remove endpoints in [app/server/api/spaces/[spaceId]/members](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/members)
- Verified `pnpm lint`, `pnpm typecheck`, and `pnpm build`

### Step 5

Date: 2026-03-04

- Added document helper utilities in [documents.ts](/mnt/e/workspace/flareDocs/app/server/utils/documents.ts)
- Added tree endpoint in [tree.get.ts](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/tree.get.ts)
- Added document create/read/update/delete endpoints in [app/server/api/spaces/[spaceId]/docs](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/docs)
- Added parent-folder validation and cycle prevention for document moves
- Added optimistic locking on `documents.version` with 409 conflict response payload
- Verified `pnpm lint`, `pnpm typecheck`, and `pnpm build`

### Step 6

Date: 2026-03-04

- Added shared frontend API types in [api.ts](/mnt/e/workspace/flareDocs/app/types/api.ts)
- Added ByteMD client editor wrapper in [MarkdownEditor.client.vue](/mnt/e/workspace/flareDocs/app/components/MarkdownEditor.client.vue)
- Added Markdown rendering component in [MarkdownViewer.vue](/mnt/e/workspace/flareDocs/app/components/MarkdownViewer.vue)
- Replaced the placeholder landing page with a responsive spaces dashboard in [index.vue](/mnt/e/workspace/flareDocs/app/pages/index.vue)
- Added a responsive login/register page in [login.vue](/mnt/e/workspace/flareDocs/app/pages/login.vue)
- Added the main responsive workspace page with document selection, reading, editing, create, delete, and conflict feedback in [spaces/[spaceId].vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId].vue)
- Verified `pnpm typecheck`
- `pnpm lint` and `pnpm build` currently need a longer run window than this sandbox session provided after the UI step

### Step 7

Date: 2026-03-04

- Added R2 upload helper and validation rules in [storage.ts](/mnt/e/workspace/flareDocs/app/server/utils/storage.ts)
- Added image upload endpoint in [upload.post.ts](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/upload.post.ts)
- Added public asset-serving route in [uploads/[...key].get.ts](/mnt/e/workspace/flareDocs/app/server/routes/uploads/[...key].get.ts)
- Wired ByteMD image uploads into [MarkdownEditor.client.vue](/mnt/e/workspace/flareDocs/app/components/MarkdownEditor.client.vue)
- Updated the workspace editor flow in [spaces/[spaceId].vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId].vue)
- Added R2 binding placeholder to [wrangler.toml](/mnt/e/workspace/flareDocs/wrangler.toml)
- Verified `pnpm typecheck`

### Step 8

Date: 2026-03-04

- Added shared audit writer and `waitUntil` scheduling helper in [audit.ts](/mnt/e/workspace/flareDocs/app/server/utils/audit.ts)
- Added admin-only audit query API in [audit-logs.get.ts](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/audit-logs.get.ts)
- Wired audit writes into login/logout, space creation, membership changes, document mutations, and uploads
- Added responsive audit page in [audit.vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId]/audit.vue)
- Verified `pnpm typecheck`

### Step 9

Date: 2026-03-04

- Expanded [.env.example](/mnt/e/workspace/flareDocs/.env.example) with setup helper placeholders
- Added `pnpm setup` in [package.json](/mnt/e/workspace/flareDocs/package.json)
- Added bootstrap helper in [setup.ts](/mnt/e/workspace/flareDocs/scripts/setup.ts)
- Added deployment notes in [dev-notes.md](/mnt/e/workspace/flareDocs/scripts/dev-notes.md)
- Verified `node --experimental-strip-types scripts/setup.ts --dry-run`

### Follow-Up Fixes

Date: 2026-03-04

- Fixed Nuxt server route discovery by pointing [nuxt.config.ts](/mnt/e/workspace/flareDocs/nuxt.config.ts) at [app/server](/mnt/e/workspace/flareDocs/app/server)
- Added bootstrap admin seeding in [bootstrap.ts](/mnt/e/workspace/flareDocs/app/server/utils/bootstrap.ts) so `admin / admin` exists by default
- Added lightweight locale state in [useLocale.ts](/mnt/e/workspace/flareDocs/app/composables/useLocale.ts) and a global switcher in [LocaleSwitch.vue](/mnt/e/workspace/flareDocs/app/components/LocaleSwitch.vue)
- Localized the login, dashboard, workspace, and audit screens with Chinese as the default locale
- Validation now needs a fresh `pnpm install` on the active OS because this workspace has mixed Linux/Windows native dependencies

## In Progress

None.

## Pending Notes

### Step 1

- Completed.

### Step 2

- Completed.

### Step 3

- Completed.

### Step 4

- Completed.

### Step 5

- Completed.

### Step 6

- Completed.

### Step 7

- Completed.

### Step 8

- Completed.

### Step 9

- Completed.

## Update Rule

After each implementation step:

1. Update the relevant row in the master checklist
2. Add a short completion note under `Completed`
3. Record the next active step under `Current Focus` or `In Progress`
