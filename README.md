# flareDocs

flareDocs is a lightweight, serverless, Markdown-first knowledge base for small teams. The V0.1 target is a deployable Nuxt application running on Cloudflare Pages with D1 for structured data and R2 for file storage.

## Current Status

This repository now has a working Nuxt 4 baseline aligned to the V0.1 plan.

Note:
- The original prompt specifies Nuxt 3
- The current scaffold is on Nuxt 4.3.1 because the latest Nuxt UI setup path is built around Nuxt 4
- If strict Nuxt 3 pinning is required, that should be resolved before deeper backend work

Completed:
- Requirement baseline in [prompt/init.md](/mnt/e/workspace/flareDocs/prompt/init.md)
- Repository documentation baseline in [README.md](/mnt/e/workspace/flareDocs/README.md)
- Collaboration guide in [AGENTS.md](/mnt/e/workspace/flareDocs/AGENTS.md)
- Task and progress tracking in [TASKS.md](/mnt/e/workspace/flareDocs/TASKS.md)
- Nuxt application scaffold with Tailwind CSS and Nuxt UI
- Mobile-first landing shell and Cloudflare Pages-compatible Nitro build
- Drizzle ORM schema, initial SQL migration, and D1 runtime helper
- Auth APIs with JWT cookie sessions and same-origin write protection
- Spaces APIs, membership management, and reusable RBAC helper
- Documents tree APIs, CRUD, and optimistic locking
- Responsive login, spaces dashboard, workspace shell, and Markdown editor/viewer UI
- R2-backed image upload API, public asset route, and editor image insertion flow
- Audit log writes with `waitUntil` fallback, admin audit API, and audit screen
- Setup automation script and deployment notes
- Follow-up fixes for Nuxt server route registration, locale switching, and bootstrap admin login

Remaining follow-up:
- Run `pnpm lint` and `pnpm build` in a single-platform environment after reinstalling dependencies
- Create real Cloudflare D1 and R2 resources and replace placeholders

## Product Scope

V0.1 is intentionally constrained:

- Small-team usage: roughly 3 to 10 people
- Markdown documents organized in a tree within a space
- Space-level access control: `admin`, `editor`, `viewer`
- JWT auth with HttpOnly cookies
- Basic CSRF protection via same-origin `Origin`/`Referer` checks
- Optimistic locking for document edits via `version`
- R2-backed asset upload
- Audit logging for key actions

Explicitly out of scope for V0.1:

- Real-time collaboration
- CRDT/WebSocket sync
- Durable Objects
- Full-text search infrastructure
- Per-folder ACL inheritance or overrides

## Planned Stack

- App: Nuxt 3 + Nitro + TypeScript
- UI: TailwindCSS + Nuxt UI
- Editor: ByteMD
- Database: Cloudflare D1 (SQLite)
- ORM: Drizzle ORM
- Storage: Cloudflare R2
- Deployment: Cloudflare Pages
- Package manager: pnpm
- Tooling: ESLint, Prettier, TypeScript

## Delivery Principles

- Build in small, reviewable steps
- Keep V0.1 strict; avoid feature creep
- Make local development and Cloudflare deployment both explicit
- Treat security as a baseline requirement, not a later enhancement
- Update docs and progress after every meaningful step

## Roadmap

The implementation order follows the requirement prompt:

| Step | Scope | Status |
| --- | --- | --- |
| 0 | Documentation baseline | Done |
| 1 | Initialize Nuxt baseline + TS + Tailwind + ESLint/Prettier + Nuxt UI | Done |
| 2 | Integrate Drizzle + D1 schema + migrations | Done |
| 3 | Users and auth APIs with JWT cookie and origin checks | Done |
| 4 | Spaces and membership with reusable authorization helpers | Done |
| 5 | Documents CRUD, tree API, optimistic locking | Done |
| 6 | ByteMD editor and document reading/editing UI | Done |
| 7 | R2 upload and editor asset insertion flow | Done |
| 8 | Audit log write path and admin query UI | Done |
| 9 | `scripts/setup.ts`, `.env.example`, deployment docs | Done |

Detailed task notes live in [TASKS.md](/mnt/e/workspace/flareDocs/TASKS.md).

## Target Repository Structure

The codebase will be built toward this structure:

```text
.
├── app/
│   ├── pages/
│   ├── components/
│   ├── middleware/
│   ├── composables/
│   ├── server/
│   │   ├── api/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── services/
│   └── assets/
├── db/
│   ├── schema.ts
│   ├── migrations/
│   └── seed.ts
├── scripts/
│   ├── setup.ts
│   └── dev-notes.md
├── wrangler.toml
├── package.json
├── pnpm-lock.yaml
├── README.md
└── .env.example
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Environment setup:

```bash
cp .env.example .env
```

Start the app:

```bash
pnpm dev
```

Validate the current baseline:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Database workflow:

```bash
pnpm db:generate
pnpm db:migrate:local
pnpm db:migrate:remote
```

Notes:
- `db:generate` uses [drizzle.config.ts](/mnt/e/workspace/flareDocs/drizzle.config.ts)
- `db:migrate:local` uses [wrangler.toml](/mnt/e/workspace/flareDocs/wrangler.toml) and expects a local D1 binding named `DB`
- `db:migrate:remote` applies migrations to the real Cloudflare D1 database with `--remote`
- Replace the placeholder `database_id` in [wrangler.toml](/mnt/e/workspace/flareDocs/wrangler.toml) before real Cloudflare use
- Use [wrangler.toml.example](/mnt/e/workspace/flareDocs/wrangler.toml.example) as the tracked template and keep real resource ids only in your local ignored `wrangler.toml`
- Set `NUXT_AUTH_SECRET` before using auth endpoints

## Current Frontend Baseline

Step 6 connects the existing backend to the first usable UI:

- [app/pages/index.vue](/mnt/e/workspace/flareDocs/app/pages/index.vue) now works as a spaces dashboard with session state and create-space flow
- [app/pages/login.vue](/mnt/e/workspace/flareDocs/app/pages/login.vue) adds a touch-friendly login/register screen
- [app/pages/spaces/[spaceId].vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId].vue) adds the main workspace with a document list, read mode, and edit mode
- [MarkdownEditor.client.vue](/mnt/e/workspace/flareDocs/app/components/MarkdownEditor.client.vue) integrates ByteMD on the client
- [MarkdownViewer.vue](/mnt/e/workspace/flareDocs/app/components/MarkdownViewer.vue) renders Markdown with `markdown-it` and HTML disabled

Mobile layout constraints remain explicit:

- Mobile-first stacking comes before desktop sidebar behavior
- Safe viewport padding is included for phone browsers
- Forms and document actions stay thumb-friendly on narrow screens
- The workspace keeps the tree and editor readable instead of forcing a desktop-only split layout
- Nuxt UI is enabled, but its automatic font module is disabled to keep builds offline-safe
- Nitro is configured for `cloudflare-pages`

Validation status for the latest UI step:

- `pnpm typecheck` passed
- `pnpm lint` currently loads very slowly through the generated Nuxt ESLint config in this sandbox
- `pnpm build` reaches Nuxt/Nitro production build startup but did not finish before the sandbox timeout window

## Upload Baseline

Step 7 adds the first real asset flow:

- [upload.post.ts](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/upload.post.ts) uploads images to the R2 `R2_ASSETS` bucket
- [storage.ts](/mnt/e/workspace/flareDocs/app/server/utils/storage.ts) centralizes allowed image types, size limits, bucket access, and public asset URL building
- [uploads/[...key].get.ts](/mnt/e/workspace/flareDocs/app/server/routes/uploads/[...key].get.ts) serves uploaded files back through the app origin
- [MarkdownEditor.client.vue](/mnt/e/workspace/flareDocs/app/components/MarkdownEditor.client.vue) now sends image uploads directly from the editor toolbar or drag-and-drop flow
- [wrangler.toml](/mnt/e/workspace/flareDocs/wrangler.toml) now includes an `R2_ASSETS` R2 binding placeholder

Current upload rules:

- Only `image/png`, `image/jpeg`, `image/gif`, `image/webp`, and `image/avif`
- Max size is 5 MB
- Upload requires space-level `editor` access
- Returned Markdown URLs stay on the same app origin for simpler local and Cloudflare deployment

## Audit Baseline

Step 8 adds the operational trail required by the prompt:

- [audit.ts](/mnt/e/workspace/flareDocs/app/server/utils/audit.ts) centralizes log creation and `waitUntil` scheduling
- [audit-logs.get.ts](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/audit-logs.get.ts) adds the admin-only query endpoint
- [audit.vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId]/audit.vue) adds a responsive audit screen with basic filters and paging
- Successful `LOGIN`, `LOGOUT`, `CREATE_SPACE`, membership changes, document mutations, and `UPLOAD_ASSET` now enqueue audit entries

Current audit rules:

- Audit writes avoid storing full Markdown bodies
- Query access is limited to space `admin`
- Filters include `action`, `userId`, `dateFrom`, `dateTo`, `page`, and `pageSize`

## Setup Baseline

Step 9 adds the bootstrap path for new environments:

- [scripts/setup.ts](/mnt/e/workspace/flareDocs/scripts/setup.ts) prepares `.env`, generates an auth secret when needed, and can replace `wrangler.toml` placeholders
- [wrangler.toml.example](/mnt/e/workspace/flareDocs/wrangler.toml.example) is the tracked open-source template; the real `wrangler.toml` should stay local and ignored
- [scripts/dev-notes.md](/mnt/e/workspace/flareDocs/scripts/dev-notes.md) captures the shortest local and Cloudflare paths
- [.env.example](/mnt/e/workspace/flareDocs/.env.example) now includes the runtime secret and optional setup helper inputs
- [package.json](/mnt/e/workspace/flareDocs/package.json) includes `pnpm project:setup`

Validation for the setup path:

- `node --experimental-strip-types scripts/setup.ts --dry-run` passed

## Follow-Up Fixes

The repository also includes a post-bootstrap polish pass:

- [nuxt.config.ts](/mnt/e/workspace/flareDocs/nuxt.config.ts) now points `serverDir` to [app/server](/mnt/e/workspace/flareDocs/app/server) so Nitro can register the API routes that live there
- [bootstrap.ts](/mnt/e/workspace/flareDocs/app/server/utils/bootstrap.ts) seeds a default `admin / admin` account when the auth layer is first touched
- [useAppLocale.ts](/mnt/e/workspace/flareDocs/app/composables/useAppLocale.ts) and [LocaleSwitch.vue](/mnt/e/workspace/flareDocs/app/components/LocaleSwitch.vue) add a lightweight `zh-CN` / `en` switch with Chinese as the default locale
- Login, dashboard, workspace, and audit screens now read UI text from the locale store
- [MarkdownEditor.client.vue](/mnt/e/workspace/flareDocs/app/components/MarkdownEditor.client.vue) now uses tabbed write/preview mode instead of the earlier split layout
- [main.css](/mnt/e/workspace/flareDocs/app/assets/css/main.css) now includes document-style Markdown rendering and editor skinning
- [package.json](/mnt/e/workspace/flareDocs/package.json) now runs remote D1 migrations with `--remote`

Current caveat:

- This workspace has been used across Linux and Windows environments, so Nuxt type generation now requires a fresh `pnpm install` on the active platform before local validation commands are reliable again

## Database Baseline

Step 2 added the first real backend foundation:

- Schema source in [db/schema.ts](/mnt/e/workspace/flareDocs/db/schema.ts)
- Initial SQL migration in [db/migrations/0000_initial.sql](/mnt/e/workspace/flareDocs/db/migrations/0000_initial.sql)
- Drizzle config in [drizzle.config.ts](/mnt/e/workspace/flareDocs/drizzle.config.ts)
- D1 access helper in [db.ts](/mnt/e/workspace/flareDocs/app/server/utils/db.ts)
- Minimal database health route in [db.get.ts](/mnt/e/workspace/flareDocs/app/server/api/health/db.get.ts)

The migration covers:

- `users`
- `spaces`
- `space_members`
- `documents`
- `audit_logs`

The demo route is `GET /api/health/db`. It uses Drizzle against the D1 `DB` binding and returns a simple JSON payload with the current `users` row count.

## Auth Baseline

Step 3 adds the first real application security layer:

- Password hashing in [password.ts](/mnt/e/workspace/flareDocs/app/server/utils/password.ts)
- JWT issue/verify helpers and cookie handling in [auth.ts](/mnt/e/workspace/flareDocs/app/server/utils/auth.ts)
- Standard API response helpers in [response.ts](/mnt/e/workspace/flareDocs/app/server/utils/response.ts)
- Same-origin write middleware in [csrf.ts](/mnt/e/workspace/flareDocs/app/server/middleware/csrf.ts)
- Auth endpoints under [app/server/api/auth](/mnt/e/workspace/flareDocs/app/server/api/auth)

Available auth routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Request notes:

- All write API requests must be same-origin
- Current write APIs require `Content-Type: application/json`
- Session cookies are `HttpOnly` and `SameSite=Strict`
- `Secure` is enabled automatically on HTTPS requests; local HTTP development falls back to non-secure cookies so login remains testable

## Space Baseline

Step 4 adds the first real multi-user authorization layer:

- Space access helper in [spaces.ts](/mnt/e/workspace/flareDocs/app/server/utils/spaces.ts)
- Route param parsing helper in [request.ts](/mnt/e/workspace/flareDocs/app/server/utils/request.ts)
- Space routes under [app/server/api/spaces](/mnt/e/workspace/flareDocs/app/server/api/spaces)

Available space routes:

- `GET /api/spaces`
- `POST /api/spaces`
- `GET /api/spaces/:spaceId`
- `POST /api/spaces/:spaceId/members`
- `PATCH /api/spaces/:spaceId/members/:userId`
- `DELETE /api/spaces/:spaceId/members/:userId`

Current authorization rules:

- Public spaces allow guest read access
- Team spaces require login plus membership even for read
- `admin` can manage membership
- `editor` and `admin` remain the intended future write roles for documents
- Role checks are centralized through `assertSpaceRole(spaceId, user, requiredRole)`

## Document Baseline

Step 5 adds the main document API surface:

- Document helpers in [documents.ts](/mnt/e/workspace/flareDocs/app/server/utils/documents.ts)
- Tree endpoint in [tree.get.ts](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/tree.get.ts)
- Document create endpoint in [index.post.ts](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/docs/index.post.ts)
- Document read/update/delete endpoints under [app/server/api/spaces/[spaceId]/docs/[docId]](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/docs/[docId])

Available document routes:

- `GET /api/spaces/:spaceId/tree`
- `POST /api/spaces/:spaceId/docs`
- `GET /api/spaces/:spaceId/docs/:docId`
- `PUT /api/spaces/:spaceId/docs/:docId`
- `DELETE /api/spaces/:spaceId/docs/:docId`

Current document rules:

- Read requires space-level `viewer` access
- Create, update, and delete require space-level `editor` access
- Parent documents must exist in the same space and must be folders
- Document moves reject cycles
- Updates require `version`; stale writes return `409` with the current `{ version, updatedAt }`

## What Will Make This Project Hard

The product scope is manageable, but the engineering integration is not trivial:

- Nuxt 3 plus Nitro on Cloudflare Pages requires careful runtime choices
- D1 and R2 bindings affect local development and deployment setup
- Cookie auth, CSRF checks, and RBAC must be correct from the start
- Markdown rendering must avoid XSS
- Document tree operations and optimistic locking introduce backend edge cases

This is a moderate project for an experienced full-stack engineer, and a moderate-to-hard one if Cloudflare serverless tooling is new.

## Working Agreement

Until the app scaffold exists, this repository should treat documentation as the source of truth.

- Use [prompt/init.md](/mnt/e/workspace/flareDocs/prompt/init.md) as the implementation contract
- Use [AGENTS.md](/mnt/e/workspace/flareDocs/AGENTS.md) for execution rules
- Use [TASKS.md](/mnt/e/workspace/flareDocs/TASKS.md) for status updates
- Keep changes narrowly scoped to one theme at a time

## Next Step

The main V0.1 implementation path from Step 0 through Step 9 is now in place. The next practical step is real Cloudflare resource provisioning plus end-to-end verification outside the current sandbox timeout window.
