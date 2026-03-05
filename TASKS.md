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
| 3 | Implement users + auth APIs | Done | JWT cookie, admin-created accounts, login/logout/`me`, and same-origin middleware |
| 4 | Implement spaces + membership + RBAC helper | Done | Space CRUD entry points and member management routes added |
| 5 | Implement documents CRUD + tree + optimistic lock | Done | Tree endpoint, CRUD, parent checks, and 409 conflict response added |
| 6 | Add ByteMD editor and document UI | Done | Responsive login, dashboard, workspace, and version-aware save flow added |
| 7 | Add R2 upload flow | Done | R2 upload API, public asset route, and editor insertion wired up |
| 8 | Add audit log write path and query UI | Done | Async audit writes, admin query API, and audit page added |
| 9 | Add `scripts/setup.ts` and deployment docs | Done | Setup script, `.env.example`, and deployment notes added |

## Current Focus

- Validation and Cloudflare provisioning follow-up
- Reinstall dependencies on the active platform before re-running Nuxt validation
- Current sandbox has no outbound network; `pnpm install` fails with `EAI_AGAIN`, so lint/typecheck validation must be re-run on a networked machine

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
- Added `pnpm project:setup` in [package.json](/mnt/f/newworkspace/flareDocs/package.json)
- Added bootstrap helper in [setup.ts](/mnt/e/workspace/flareDocs/scripts/setup.ts)
- Added deployment notes in [dev-notes.md](/mnt/e/workspace/flareDocs/scripts/dev-notes.md)
- Verified `node --experimental-strip-types scripts/setup.ts --dry-run`

### Follow-Up Fixes

Date: 2026-03-04

- Rewrote [README.md](/mnt/f/newworkspace/flareDocs/README.md) in Chinese and added a first-run local startup guide
- Refined [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue) to remove exposed mode and route hints, improve the visual layout, and keep [LocaleSwitch.vue](/mnt/e/workspace/flareDocs/app/components/LocaleSwitch.vue) on the login page only
- Updated [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) to render a nested document tree, clarify the current role badge, and add a move action for documents and folders
- Added knowledge-base style tree context in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) with path highlighting, fold-state persistence, and math rendering support in [MarkdownViewer.vue](/mnt/f/newworkspace/flareDocs/app/components/MarkdownViewer.vue)
- Added [WorkspaceIcon.vue](/mnt/f/newworkspace/flareDocs/app/components/WorkspaceIcon.vue), icon-based workspace actions, fullscreen viewing, and icon-only export actions for Markdown, PDF, and Word
- Tightened the workspace layout in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) with compact tree rows, right-side breadcrumbs, inline rename support, delete confirmation, and formatted timestamps
- Refined the workspace chrome in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) with single-row floating actions, icon-only tree controls, and lighter selection styling
- Added internal reader scrolling and progress tracking in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), and rebalanced workspace panel colors in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css)
- Locked workspace overflow to internal panes in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), switched the right panel to an editor-style two-layer layout, and made reading progress click-to-jump on fine-pointer devices only
- Flipped reading progress to a top-down mapping in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), removed duplicate edit actions below the editor, and expanded the ByteMD editing area in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css)
- Reworked the workspace top bar in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) into a compact space switcher with icon-only back/audit actions and a small user avatar marker, and tightened ByteMD height handling in [MarkdownEditor.client.vue](/mnt/f/newworkspace/flareDocs/app/components/MarkdownEditor.client.vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css)
- Aligned the compact workspace top bar to the main layout in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), swapped the return action to a home icon in [WorkspaceIcon.vue](/mnt/f/newworkspace/flareDocs/app/components/WorkspaceIcon.vue), and overrode ByteMD's built-in `300px` editor height in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css)
- Updated the home button tooltip in [useAppLocale.ts](/mnt/f/newworkspace/flareDocs/app/composables/useAppLocale.ts) and [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), then tightened ByteMD toolbar overflow and non-split editor width rules in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) to reduce dual scrollbars and clipped toolbar icons
- Widened the rename input in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), hid ByteMD's right-side mode icons and forced active panes to full width in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css), and centered fullscreen reader content via [fd-reader-scroll](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css)
- Added a ByteMD layout normalizer in [MarkdownEditor.client.vue](/mnt/f/newworkspace/flareDocs/app/components/MarkdownEditor.client.vue) to strip persistent split mode, and kept a CSS fallback in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) to hide any residual split preview pane
- Hardened document loading in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) so load failures surface in `workspaceError`, clear the stale panel state, and allow re-clicking the current tree node to retry the fetch
- Replaced the risky ByteMD class-manipulation approach with explicit editor remounting in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and simplified [MarkdownEditor.client.vue](/mnt/f/newworkspace/flareDocs/app/components/MarkdownEditor.client.vue) so clicking edit resets the editor into a clean tab-mode instance
- Restored ByteMD's top-right toolbar icons in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css), forced the active editor/preview pane to 100% width regardless of internal split state, and tightened CodeMirror scroll ownership to reduce the remaining double-scroll behavior
- Disabled ByteMD's split-toggle icon via [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) while keeping the other top-right tools visible, and forced any residual split state to hide the preview pane so populated documents no longer collapse into a half-empty editor
- Removed ByteMD's default `max-width: 800px` editor column and line padding constraints in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css), and reduced fullscreen document header spacing so long documents have more usable vertical room without the content appearing compressed into the left side
- Hid CodeMirror's auxiliary scrollbars and reset its default margin/padding scrollbar hack in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) so the editor keeps one effective scroll layer instead of showing multiple unusable bars
- Restored a single thin draggable scrollbar on [CodeMirror-scroll](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) so the editor remains easy to navigate after removing the duplicate scrollbar layers
- Removed the incorrect fixed-height override on [CodeMirror-sizer](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css), disabled horizontal editor scrolling, and kept only a contained vertical scroll channel to reduce scrollbar jumping while dragging
- Reverted the experimental CodeMirror internal scroll overrides in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) so editor scrolling, content height calculation, and scrollbar behavior fully return to the library defaults while the surrounding ByteMD chrome stays customized
- Added `private` space visibility across [db/schema.ts](/mnt/f/newworkspace/flareDocs/db/schema.ts), [0001_private_spaces.sql](/mnt/f/newworkspace/flareDocs/db/migrations/0001_private_spaces.sql), APIs, and UI, and introduced automatic per-user personal workspaces through [spaces.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/spaces.ts), [register.post.ts](/mnt/f/newworkspace/flareDocs/app/server/api/auth/register.post.ts), [login.post.ts](/mnt/f/newworkspace/flareDocs/app/server/api/auth/login.post.ts), and [bootstrap.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/bootstrap.ts)
- Fixed Nuxt server route discovery by pointing [nuxt.config.ts](/mnt/e/workspace/flareDocs/nuxt.config.ts) at [app/server](/mnt/e/workspace/flareDocs/app/server)
- Added bootstrap admin seeding in [bootstrap.ts](/mnt/e/workspace/flareDocs/app/server/utils/bootstrap.ts) so `admin / admin` exists by default
- Added lightweight locale state in [useAppLocale.ts](/mnt/e/workspace/flareDocs/app/composables/useAppLocale.ts) and a UI switcher in [LocaleSwitch.vue](/mnt/e/workspace/flareDocs/app/components/LocaleSwitch.vue)
- Localized the login, dashboard, workspace, and audit screens with Chinese as the default locale
- Switched the Markdown editor to tabbed preview and added richer document styles in [main.css](/mnt/e/workspace/flareDocs/app/assets/css/main.css)
- Corrected remote D1 migration execution to include `--remote` in [package.json](/mnt/e/workspace/flareDocs/package.json)
- Validation now needs a fresh `pnpm install` on the active OS because this workspace has mixed Linux/Windows native dependencies

Date: 2026-03-05

- Disabled self-registration in [register.post.ts](/mnt/e/workspace/flareDocs/app/server/api/auth/register.post.ts) and switched to admin-created accounts only
- Added user profile updates in [profile.patch.ts](/mnt/e/workspace/flareDocs/app/server/api/auth/profile.patch.ts) and preset avatar utilities in [avatar-presets.ts](/mnt/e/workspace/flareDocs/app/utils/avatar-presets.ts)
- Added system admin user management APIs in [app/server/api/admin/users](/mnt/e/workspace/flareDocs/app/server/api/admin/users) and the admin page in [users.vue](/mnt/e/workspace/flareDocs/app/pages/admin/users.vue)
- Extended user schema with `avatar_id` and `is_system_admin` in [db/schema.ts](/mnt/e/workspace/flareDocs/db/schema.ts) and [0002_users_admin_avatar.sql](/mnt/e/workspace/flareDocs/db/migrations/0002_users_admin_avatar.sql)
- Updated homepage/login flows in [index.vue](/mnt/e/workspace/flareDocs/app/pages/index.vue) and [login.vue](/mnt/e/workspace/flareDocs/app/pages/login.vue) for personal settings and admin entry points
- Hardened member management rules in [app/server/api/spaces/[spaceId]/members](/mnt/e/workspace/flareDocs/app/server/api/spaces/[spaceId]/members): personal workspace no-share and last-admin protection
- Added account activation state in [db/schema.ts](/mnt/e/workspace/flareDocs/db/schema.ts) and [0003_users_active_flag.sql](/mnt/e/workspace/flareDocs/db/migrations/0003_users_active_flag.sql), plus login blocking for disabled users in [login.post.ts](/mnt/e/workspace/flareDocs/app/server/api/auth/login.post.ts)
- Expanded admin account operations in [app/server/api/admin/users/[userId].patch.ts](/mnt/e/workspace/flareDocs/app/server/api/admin/users/[userId].patch.ts) and [app/server/api/admin/users/[userId].delete.ts](/mnt/e/workspace/flareDocs/app/server/api/admin/users/[userId].delete.ts): enable/disable, grant/revoke admin, reset password, delete, and last-active-admin guard
- Refined [users.vue](/mnt/e/workspace/flareDocs/app/pages/admin/users.vue) with icon-based home navigation and per-user operation controls, and upgraded avatar presentation to QQ-classic-style preset icons in [index.vue](/mnt/e/workspace/flareDocs/app/pages/index.vue) and [avatar-presets.ts](/mnt/e/workspace/flareDocs/app/utils/avatar-presets.ts)

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

## Recent Notes

- Fixed the homepage space creation flow so invalid names are blocked on the client before submitting.
- Surfaced API error messages for `POST /api/spaces` instead of exposing a raw `422 Unprocessable Entity`.
- Refined the homepage layout so the space name and visibility fields sit on the same row, with a denser hero card and cleaner space cards below.
- Changed account onboarding to admin-only creation and removed the free registration path from the login UI.
- Added preset avatar selection and password change on the homepage profile panel.
- Added admin-only account management and stricter space-member constraints (personal workspace lock + last admin guard).
- Added full admin account lifecycle operations (enable/disable/delete/reset password/set admin) with backend safety checks.
- Refined homepage guest-mode layout in [index.vue](/mnt/e/workspace/flareDocs/app/pages/index.vue) by adding a full quick-start guidance card and public-space shortcut to remove the large empty area when not logged in.
