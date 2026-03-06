# flareDocs Dev Notes

## Local path

1. Copy `.env.example` to `.env`, or run `pnpm project:setup`
2. Set `NUXT_AUTH_SECRET`
3. Copy `wrangler.toml.example` to `wrangler.toml`, or let `pnpm project:setup` generate it
4. Keep placeholder D1 and R2 values in local `wrangler.toml` until real Cloudflare resources exist
5. Use `pnpm dev` for UI work and `pnpm db:migrate:local` once the local D1 binding is available

## Cloudflare path

Recommended one-shot command:

```bash
pnpm deploy:pages:first -- --project-name=<your-pages-project-name> --d1-database-id=<your-d1-id> --r2-bucket=<your-r2-bucket> --r2-preview-bucket=<your-r2-preview-bucket>
```

Manual fallback:

1. Create a D1 database with `pnpm wrangler d1 create flaredocs-db`
2. Create an R2 bucket with `pnpm wrangler r2 bucket create <your-bucket>`
3. Update local `wrangler.toml`, or pass values into `pnpm project:setup -- --d1-database-id=... --r2-bucket=...`
4. Apply migrations with `pnpm db:migrate:remote`
5. Build and deploy through Cloudflare Pages

## Current caveats

- The current app runtime is Nuxt 4 even though the original prompt called for Nuxt 3
- `pnpm lint` is currently slow because the generated Nuxt ESLint config loads many rules in this sandbox
- `pnpm build` starts correctly but has exceeded the sandbox timeout window during validation
