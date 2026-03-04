# AGENTS.md

## Purpose

This repository is for building `flareDocs`, a lightweight serverless Markdown knowledge base described in [prompt/init.md](/mnt/e/workspace/flareDocs/prompt/init.md). Until the application scaffold exists, this file defines how contributors should execute work and keep the repository aligned.

## Source Of Truth

- Product and technical scope: [prompt/init.md](/mnt/e/workspace/flareDocs/prompt/init.md)
- Repository overview: [README.md](/mnt/e/workspace/flareDocs/README.md)
- Execution status and backlog: [TASKS.md](/mnt/e/workspace/flareDocs/TASKS.md)

If these files conflict, `prompt/init.md` wins for scope, and `TASKS.md` wins for current execution status.

## Working Rules

- Make small, isolated changes. One task theme per step.
- Do not introduce features outside V0.1 scope.
- Do not add WebSocket, CRDT, Durable Objects, or full-text search infra.
- Preserve security requirements from the prompt from the first auth-related change onward.
- Update `README.md` and `TASKS.md` after each meaningful implementation step.
- Keep commits reviewable and explain DB changes clearly when they appear.

## Required Implementation Order

Follow this sequence unless the user explicitly reprioritizes:

1. Initialize Nuxt 3 + TypeScript + TailwindCSS + ESLint/Prettier + Nuxt UI
2. Integrate Drizzle + D1 schema + migrations
3. Build users and auth endpoints
4. Build spaces and membership authorization
5. Build documents CRUD, tree API, and optimistic locking
6. Add ByteMD editor and document UI
7. Add R2 uploads
8. Add audit logging and admin queries
9. Add setup automation and final deployment docs

## Definition Of Done Per Step

Each step should leave the repository in a coherent state:

- Relevant code or docs are updated
- `README.md` reflects any new setup or workflow details
- `TASKS.md` marks progress and notes follow-up items
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass when those commands exist
- New edge cases or unresolved tradeoffs are recorded

## Engineering Constraints

- Favor straightforward implementations over abstract frameworks
- Put reusable auth and permission logic in shared server utilities
- Keep API responses consistent with the prompt contract
- Reject unsafe Markdown rendering patterns
- Treat local development and Cloudflare deployment as first-class concerns

## Progress Logging

Whenever work is completed:

1. Mark the corresponding item in [TASKS.md](/mnt/e/workspace/flareDocs/TASKS.md)
2. Add a short note about what changed and what remains
3. Reflect user-facing or setup-impacting changes in [README.md](/mnt/e/workspace/flareDocs/README.md)

## Current State

At the moment, the repository only contains requirement and process documentation. Application code has not been scaffolded yet.
