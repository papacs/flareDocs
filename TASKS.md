# TASKS.md

## Status Legend

- `Done`: completed and reflected in repository docs/code
- `In Progress`: currently being implemented
- `Pending`: not started
- `Blocked`: waiting on a prerequisite or user decision

## Master Checklist

| Step | Task                                                                 | Status | Notes                                                                             |
| ---- | -------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| 0    | Create baseline repository docs                                      | Done   | `README.md`, `AGENTS.md`, `TASKS.md` created                                      |
| 1    | Initialize Nuxt baseline + TS + Tailwind + ESLint/Prettier + Nuxt UI | Done   | Current scaffold is Nuxt 4.3.1; prompt originally asked for Nuxt 3                |
| 2    | Integrate Drizzle + D1 schema + migrations                           | Done   | Schema, initial migration, D1 helper, and health endpoint added                   |
| 3    | Implement users + auth APIs                                          | Done   | JWT cookie, admin-created accounts, login/logout/`me`, and same-origin middleware |
| 4    | Implement spaces + membership + RBAC helper                          | Done   | Space CRUD entry points and member management routes added                        |
| 5    | Implement documents CRUD + tree + optimistic lock                    | Done   | Tree endpoint, CRUD, parent checks, and 409 conflict response added               |
| 6    | Add ByteMD editor and document UI                                    | Done   | Responsive login, dashboard, workspace, and version-aware save flow added         |
| 7    | Add R2 upload flow                                                   | Done   | R2 upload API, public asset route, and editor insertion wired up                  |
| 8    | Add audit log write path and query UI                                | Done   | Async audit writes, admin query API, and audit page added                         |
| 9    | Add `scripts/setup.ts` and deployment docs                           | Done   | Setup script, `.env.example`, and deployment notes added                          |

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

Date: 2026-03-06

- Simplified the workspace chrome in [spaces/[spaceId].vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId].vue) by removing the top strip and moving the workspace switcher plus home entry into the left sidebar
- Added sidebar-specific workspace controls styling in [main.css](/mnt/e/workspace/flareDocs/app/assets/css/main.css) to preserve compact spacing and keep role/visibility badges readable
- Updated [README.md](/mnt/e/workspace/flareDocs/README.md) with the latest workspace layout adjustment note
- Further reduced left-sidebar workspace controls to only the space dropdown plus home icon in [spaces/[spaceId].vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId].vue), removing audit/avatar/role-visibility pills from the workspace view
- Refined sidebar visuals in [main.css](/mnt/e/workspace/flareDocs/app/assets/css/main.css) with a cleaner header card, softer layered background, and a dedicated tree heading divider
- Removed duplicate current-document crumbs from the workspace path display in [spaces/[spaceId].vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId].vue) so the document title is shown only once
- Added mobile workspace compatibility in [spaces/[spaceId].vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId].vue) and [main.css](/mnt/e/workspace/flareDocs/app/assets/css/main.css): right-top directory trigger, slide-in tree drawer, backdrop click close, and `Esc` close behavior
- Added mobile fullscreen compact mode in [main.css](/mnt/e/workspace/flareDocs/app/assets/css/main.css) and [spaces/[spaceId].vue](/mnt/e/workspace/flareDocs/app/pages/spaces/[spaceId].vue): hide top metadata blocks, keep a single action-button row, and reclaim vertical reading space
- Reworked the workspace into a unified immersive layout in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): content-first full-width reading surface, drawer-style tree navigation on both mobile and desktop, right-top unified action menu, and autosave (debounced edits + 60s interval + background flush); added related i18n copy in [useAppLocale.ts](/mnt/f/newworkspace/flareDocs/app/composables/useAppLocale.ts) and documented behavior in [README.md](/mnt/f/newworkspace/flareDocs/README.md)

Date: 2026-03-07

- Updated [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) to stop auto-selecting/opening a document after switching workspace; users now pick a document explicitly
- Updated [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) so desktop keeps a persistent left document tree while mobile remains a drawer interaction
- Hid document-header tree trigger buttons on desktop in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) to avoid duplicate controls when the left sidebar is always visible
- Lowered the persistent-sidebar breakpoint from `1024px` to `768px` in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) and [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) so common PC window widths no longer fall back to drawer behavior
- Updated action menu rows in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) to use right-side function icons (`树结构/编辑/移动/全屏/导出/删除`) for clearer operation targeting
- Converted the document action dropdown to icon-only controls in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css), replaced title-subline status text with `更新时间 + 最近更新人`, and compacted left tree row spacing
- Extended document detail responses in [index.get.ts](/mnt/f/newworkspace/flareDocs/app/server/api/spaces/[spaceId]/docs/[docId]/index.get.ts), [index.put.ts](/mnt/f/newworkspace/flareDocs/app/server/api/spaces/[spaceId]/docs/[docId]/index.put.ts), and [api.ts](/mnt/f/newworkspace/flareDocs/app/types/api.ts) with `updatedByName` for UI metadata display
- Updated [users.vue](/mnt/f/newworkspace/flareDocs/app/pages/admin/users.vue) for mobile: tightened top spacing and pinned the home icon button to the top-right corner
- Reworked workspace action menu in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) into a vertical icon stack, added a new `info` icon in [WorkspaceIcon.vue](/mnt/f/newworkspace/flareDocs/app/components/WorkspaceIcon.vue), removed inline breadcrumb chips, and introduced a document-info modal (`目录/创建时间/创建人/最近更新时间/最近更新人`)
- Expanded document detail payloads with `createdAt` and `createdByName` in [api.ts](/mnt/f/newworkspace/flareDocs/app/types/api.ts), [index.get.ts](/mnt/f/newworkspace/flareDocs/app/server/api/spaces/[spaceId]/docs/[docId]/index.get.ts), and [index.put.ts](/mnt/f/newworkspace/flareDocs/app/server/api/spaces/[spaceId]/docs/[docId]/index.put.ts)
- Added document-size metadata display in the document-info modal in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) with UTF-8 byte-size formatting (`B/KB/MB`) and matching locale copy in [useAppLocale.ts](/mnt/f/newworkspace/flareDocs/app/composables/useAppLocale.ts)
- Refined mobile admin-user layout in [users.vue](/mnt/f/newworkspace/flareDocs/app/pages/admin/users.vue): tighter outer/card spacing, top-right home icon alignment, stacked user rows, and two-column action buttons to reduce cramped wrapping on small screens
- Updated [users.vue](/mnt/f/newworkspace/flareDocs/app/pages/admin/users.vue) so the current logged-in user no longer renders a delete button in the user list
- Updated [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) for mobile homepage behavior: keep metric cards (now including private/team/public/total counts) and hide the lower workspace list on small screens; added `index.metricPrivate` locale copy in [useAppLocale.ts](/mnt/f/newworkspace/flareDocs/app/composables/useAppLocale.ts)
- Hid the homepage session panel on small screens in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) to remove the residual lower border block in mobile view
- Updated reader interaction in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): progress rail is now always interactive (including touch), supports direct pointer-down jump, and has stronger always-visible rail contrast
- Added live-preview editing behavior in [MarkdownEditor.client.vue](/mnt/f/newworkspace/flareDocs/app/components/MarkdownEditor.client.vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): non-active lines now hide Markdown formatting marks and render closer to preview typography, while the active cursor line stays in source-edit mode; updated hint copy in [useAppLocale.ts](/mnt/f/newworkspace/flareDocs/app/composables/useAppLocale.ts) and summary note in [README.md](/mnt/f/newworkspace/flareDocs/README.md)
- Upgraded live-preview consistency in [MarkdownEditor.client.vue](/mnt/f/newworkspace/flareDocs/app/components/MarkdownEditor.client.vue) + [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): non-active math/table sections now render as preview blocks, non-active source-token colors are normalized to reading colors, and line-level render spacing was tightened; aligned viewer paragraph behavior by switching Markdown soft-break handling to `breaks: false` in [renderMarkdown.ts](/mnt/f/newworkspace/flareDocs/app/utils/renderMarkdown.ts); documented in [README.md](/mnt/f/newworkspace/flareDocs/README.md)
- Extended live-preview block rendering to list sections in [MarkdownEditor.client.vue](/mnt/f/newworkspace/flareDocs/app/components/MarkdownEditor.client.vue) so non-active unordered/ordered lists keep bullets and numbering, and fixed non-active line color selector accuracy in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) to better match preview color tones.
- Improved workspace load responsiveness in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue): added in-memory document cache with version-aware reuse, tree-item hover prefetch, and `Set`-based expanded-folder membership checks; added a top loading progress bar in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) for slow document opens.
- `pnpm typecheck` still fails in this environment due missing optional native package `@oxc-parser/binding-linux-x64-gnu`; frontend changes were validated with `pnpm prettier --check`

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
- Added a mobile-visible logout button in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) so users can sign out directly from the homepage hero actions.
- Refined homepage hero actions in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue): removed the Cloudflare link and split mobile actions into cleaner primary/secondary rows.
- Replaced homepage session action labels with icon buttons and moved mobile account quick actions to the top-right of the hero header in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue); added matching icons in [WorkspaceIcon.vue](/mnt/f/newworkspace/flareDocs/app/components/WorkspaceIcon.vue).
- Updated the profile icon to a cog in [WorkspaceIcon.vue](/mnt/f/newworkspace/flareDocs/app/components/WorkspaceIcon.vue) and added a mobile left-drawer profile settings panel in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) so tapping settings has an immediate, familiar response.
- Updated the mobile login experience in [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): hide the marketing copy panel on small screens and focus on a single visible login card with tighter spacing.
- Added recent-space continuity: homepage open action now prefers the last visited workspace from [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue).
- Added user appearance preference (light/dark) via [useAppearance.ts](/mnt/f/newworkspace/flareDocs/app/composables/useAppearance.ts), wired through [app.vue](/mnt/f/newworkspace/flareDocs/app/app.vue) and homepage profile settings in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue), with dark-theme and mobile touch-target refinements in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css).
- Fixed dark-theme readability regressions in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) and [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) by narrowing color overrides and introducing page-scoped dark styling for home/workspace surfaces.
- Polished remaining dark-theme inconsistencies in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) and [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue): session card contrast, role badges, workspace switch dropdown options, workspace heading text, and Markdown table readability.
- Extended dark-theme coverage to [users.vue](/mnt/f/newworkspace/flareDocs/app/pages/admin/users.vue) with dedicated admin-shell classes, and improved workspace reading usability in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) + [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue): always-visible scrollbar styling and hidden initial `0%` progress label.
- Fixed dark-mode mobile profile drawer readability in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): dedicated drawer theme colors plus explicit appearance-option selected states.
- Refined dark workspace aesthetics in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) and [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue): tuned panel gradients, improved workspace-switch dropdown option states, and added a dark-compatible empty-state card.
- Updated appearance UX in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) + [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): appearance now switches immediately on tap, with clearer default/selected button colors; also made workspace switcher borders rounder and focus ring softer.
- Replaced the workspace native `<select>` with a custom rounded menu in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css), including outside-click close behavior, to remove remaining sharp-corner dropdown artifacts.
- Refined homepage guest-mode layout in [index.vue](/mnt/e/workspace/flareDocs/app/pages/index.vue) by adding a full quick-start guidance card and public-space shortcut to remove the large empty area when not logged in.
- Removed the workspace top strip and moved the workspace selector plus home action into the left sidebar to free vertical space for document content.
- Simplified workspace sidebar controls again so the top area shows only the workspace selector and home icon, with cleaner left-panel visual hierarchy.
- Improved workspace mobile usability with a right-top drawer trigger for the tree panel, and removed duplicate current-path label content above the document title.
- Added a mobile fullscreen "button-row only" presentation so header text and auxiliary panels stop consuming vertical space while reading.
- Rounded dropdown follow-up: increased workspace switch trigger/menu/option corner radius in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) and switched homepage visibility selector in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) to the shared rounded `fd-workspace-select` style.
- Unified all native dropdowns to `fd-workspace-select` in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue), [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), and [spaces/[spaceId]/audit.vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId]/audit.vue); refined shared style and dark-mode states in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css).
- Added a reusable brand icon pipeline: created [brand-icon.svg](/mnt/f/newworkspace/flareDocs/public/brand-icon.svg) from the project logo motif, introduced [BrandMark.vue](/mnt/f/newworkspace/flareDocs/app/components/BrandMark.vue), placed it in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue), [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue), and [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), plus switched favicon in [nuxt.config.ts](/mnt/f/newworkspace/flareDocs/nuxt.config.ts) with light/dark style support in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css).
- Replaced remaining native dropdowns with a unified custom menu component [AppSelectMenu.vue](/mnt/f/newworkspace/flareDocs/app/components/AppSelectMenu.vue) across [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue), [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue), and [spaces/[spaceId]/audit.vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId]/audit.vue), and added shared light/dark styles in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css).
- Simplified the homepage session card in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue) by removing the "会话/Session" label and avatar-name line under username.
- Added logo presentation to [README.md](/mnt/f/newworkspace/flareDocs/README.md) with both full logo and compact icon.
- Implemented space deletion flow for admins: new API [index.delete.ts](/mnt/f/newworkspace/flareDocs/app/server/api/spaces/[spaceId]/index.delete.ts) (private/team only + name confirmation), plus two-step UI confirmation in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue).
- Refined homepage space cards in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue): removed role/slug/hint labels and switched actions to icon-only open/delete controls with light/dark-aware styles in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css).
- Replaced inline delete confirm with a centered modal dialog in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue), and extended delete semantics in [index.delete.ts](/mnt/f/newworkspace/flareDocs/app/server/api/spaces/[spaceId]/index.delete.ts) to purge R2 objects under the workspace prefix.
- Updated workspace delete authorization: public workspaces are now creator-only deletable, while private/team remain deletable by creator or space admin ([index.delete.ts](/mnt/f/newworkspace/flareDocs/app/server/api/spaces/[spaceId]/index.delete.ts) + [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue)).
- Updated login navigation UX in [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue): replaced bottom text back button with a top-left icon-only home-back action; added light/dark styles in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css).
- Fixed mobile guest login discoverability in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue): added a top-row mobile-only login button while keeping removed desktop guest shortcuts unchanged.
- Refined login navigation placement in [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue): moved the back-home icon into the auth card top-right for cleaner topbar spacing.
- Added captcha for login with backend verification: new [captcha.get.ts](/mnt/f/newworkspace/flareDocs/app/server/api/auth/captcha.get.ts), token verification in [login.post.ts](/mnt/f/newworkspace/flareDocs/app/server/api/auth/login.post.ts), helper logic in [captcha.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/captcha.ts), and UI input/refresh in [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue).
- Upgraded captcha robustness: switched to generated SVG arithmetic challenges with random `+ - × ÷` expressions, interference lines/noise dots, no-cache headers, and image-based refresh display in [captcha.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/captcha.ts), [captcha.get.ts](/mnt/f/newworkspace/flareDocs/app/server/api/auth/captcha.get.ts), and [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue).
- Tuned dark-theme readability in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): improved auth-card text/input contrast, reduced auth glow aggressiveness, and restyled guest-panel login CTA + feature pills for clearer foreground/background separation.
- Refined dark login input aesthetics in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): softened input border contrast, improved focus ring behavior, and aligned captcha container tone with form fields.
- Fixed login-page duplication on mobile in [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue) + [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): enforced desktop-only auth copy block and removed the admin-registration notice line from the login card.
- Removed the login-page top marketing/copy block entirely in [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue), keeping only the auth card to eliminate duplicate stacked content on mobile.
- Restored desktop two-column login layout in [login.vue](/mnt/f/newworkspace/flareDocs/app/pages/login.vue) using `hidden lg:block` for the left copy panel; mobile remains single-card.
- Further tuned dark login aesthetics in [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): brighter left-copy typography, clearer feature-card contrast, and reduced warm glow artifact in the auth card.
- Updated guest avatar presentation in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue): replaced `?` placeholder with the default preset avatar symbol/tone for consistent identity UI.
- Security hardening pass: fixed captcha token exposure by storing only hashed answers plus one-time challenge IDs in [captcha.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/captcha.ts), added login failure rate limiting in [rate-limit.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/rate-limit.ts) + [login.post.ts](/mnt/f/newworkspace/flareDocs/app/server/api/auth/login.post.ts), added baseline security headers in [00-security-headers.ts](/mnt/f/newworkspace/flareDocs/app/server/middleware/00-security-headers.ts), and restricted upload reads to validated generated keys in [storage.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/storage.ts) + [uploads/[...key].get.ts](/mnt/f/newworkspace/flareDocs/app/server/routes/uploads/[...key].get.ts).
- Removed hardcoded `admin/admin` bootstrap risk in [bootstrap.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/bootstrap.ts): initial admin seeding now requires explicit `NUXT_BOOTSTRAP_ADMIN_PASSWORD` (>=12 chars), and docs/env template were updated in [README.md](/mnt/f/newworkspace/flareDocs/README.md) + [.env.example](/mnt/f/newworkspace/flareDocs/.env.example).
- Added first-time Cloudflare Pages automation in [deploy-pages-first.ts](/mnt/f/newworkspace/flareDocs/scripts/deploy-pages-first.ts) and script entry [package.json](/mnt/f/newworkspace/flareDocs/package.json): setup, Pages project bootstrap, secrets sync, remote migration, build, and deploy in one command; updated docs in [README.md](/mnt/f/newworkspace/flareDocs/README.md) and [dev-notes.md](/mnt/f/newworkspace/flareDocs/scripts/dev-notes.md).
- Reworked the Cloudflare deployment chapter in [README.md](/mnt/f/newworkspace/flareDocs/README.md) into a full first-deploy checklist (login, resource creation, one-command deploy, parameter reference, post-deploy security actions, and troubleshooting for project-create/PowerShell/whoami cases).
- Added a homepage GitHub entry icon with light/dark unified styling in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue), [WorkspaceIcon.vue](/mnt/f/newworkspace/flareDocs/app/components/WorkspaceIcon.vue), and [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css) so the repository link is directly reachable from the landing hero.
- Relaxed bootstrap password strictness to avoid login 500 in simple-password setups: removed runtime min-length throw in [bootstrap.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/bootstrap.ts), aligned deploy helper behavior in [deploy-pages-first.ts](/mnt/f/newworkspace/flareDocs/scripts/deploy-pages-first.ts), and updated wording in [README.md](/mnt/f/newworkspace/flareDocs/README.md).
- Fixed Pages runtime type-safety issue causing `t.trim is not a function` 500s on auth routes by normalizing runtime-config secret values to strings in [bootstrap.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/bootstrap.ts), [auth.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/auth.ts), and [captcha.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/captcha.ts).
- Fixed Cloudflare runtime PBKDF2 limit issue (`iterations above 100000 are not supported`) by reducing default hash iterations and adding safe verification guards in [password.ts](/mnt/f/newworkspace/flareDocs/app/server/utils/password.ts).
- Expanded deployment documentation into a full Cloudflare runbook in [README.md](/mnt/f/newworkspace/flareDocs/README.md): first deploy, repeat deploy, Git auto-deploy wiring, Pages bindings/secrets checklist, live tail logging, health checks, and concrete error-to-fix mappings.
- Fixed workspace document loadbar completion in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue): background prefetch now closes an active foreground progress bar when content is already rendered, and a 15s fallback auto-resets stuck progress states caused by request races.
- Updated personal workspace naming and desktop space-card management flow: personal spaces now use `用户名 的个人` (with legacy `用户名 的个人工作区` auto-normalized during ensure), added `PATCH /api/spaces/:spaceId` rename support, and replaced desktop delete-only icon with a "more" menu (rename/delete) in [index.vue](/mnt/f/newworkspace/flareDocs/app/pages/index.vue).
- Refined workspace UX in [spaces/[spaceId].vue](/mnt/f/newworkspace/flareDocs/app/pages/spaces/[spaceId].vue) + [main.css](/mnt/f/newworkspace/flareDocs/app/assets/css/main.css): replaced browser-native document/folder delete confirm with a custom in-app modal, and added dedicated dark-theme styling for folder-stage cards so directory-mode document panels match dark appearance better.
