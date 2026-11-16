# momtaz-shahd-web

Online store for **Momtaz Shahd (ممتاز شهد)** — traditional Iranian koloocheh and kolompeh.

## Development

```bash
pnpm install
cp .env.example .env   # SQLite by default
pnpm db:migrate        # create/update the local database
pnpm db:seed           # sample catalogue, dealers, settings, admin user
pnpm dev          # http://localhost:3000 → redirects to /fa
pnpm typecheck    # next typegen && tsc --noEmit
pnpm lint
pnpm build
```

## Database

Prisma picks the database from `DATABASE_URL`: `file:…` uses SQLite (local
development), `postgresql://…` uses PostgreSQL (production). In production run
`pnpm db:deploy` to apply the migrations in `prisma/postgresql/migrations`.

After changing `prisma/schema.prisma`, create a migration for **both**
databases: `pnpm db:migrate` once with the SQLite URL and once with a
PostgreSQL URL.

See `CLAUDE.md` for project rules and `PROGRESS.md` for what has been built so far.
