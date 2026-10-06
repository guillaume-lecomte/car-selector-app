# car-selector-app

A small full-stack app to pick a car brand, model and year, save the selection, and list or delete saved selections.

![Screenshot of the app](./public/app-preview.jpg)

## The problem

A selection form has dependent fields: the models on offer depend on the brand, and a saved choice must not pair a model with the wrong brand or exist twice. Enforcing this only in the browser is not enough, because any HTTP client can call the API directly.

## The approach

One Next.js project (App Router) serves the UI and the API. The API is a Hono app mounted in a catch-all route handler, so there is a single process and a single deployment. Requests are validated with Zod, data access goes through Drizzle on PostgreSQL, and the server re-checks that the model belongs to the brand and that the selection does not already exist before inserting, and a unique constraint in the database settles simultaneous duplicates. The trade-off is that the API and the UI share one deployable unit.

## Engineering highlights

- **Hono inside a Next.js route handler.** The whole API sits behind one catch-all route. See [`src/app/api/[[...route]]/route.ts`](src/app/api/[[...route]]/route.ts) and [`src/lib/api/app.ts`](src/lib/api/app.ts).
- **Validation at the edge.** Query, params and body are validated with Zod through `@hono/zod-validator`. See [`src/lib/api/schemas.ts`](src/lib/api/schemas.ts) and [`src/lib/api/routes/selections.ts`](src/lib/api/routes/selections.ts).
- **Integrity in the schema.** Foreign keys with cascade, a unique model name per brand, a unique `(brand, model, year)`, and indexes on the lookup columns. See [`src/lib/db/schema.ts`](src/lib/db/schema.ts).
- **Server-side consistency check.** Creating a selection verifies that the model belongs to the brand (`validateModelBrand`) and rejects duplicates. See [`src/lib/db/queries/selections.ts`](src/lib/db/queries/selections.ts) and [`src/lib/db/queries/models.ts`](src/lib/db/queries/models.ts).
- **Duplicates settled by the database.** The unique constraint on `(brand, model, year)` is `NULLS NOT DISTINCT`, so a selection without a year is a duplicate too, and a violation caught at insert time becomes a `409`. Ten simultaneous identical requests create one selection. See [`src/lib/db/schema.ts`](src/lib/db/schema.ts), `createSelection` in [`src/lib/db/queries/selections.ts`](src/lib/db/queries/selections.ts) and [`src/__tests__/api.test.ts`](src/__tests__/api.test.ts).
- **Bounded pagination, in the API and the UI.** Page size defaults to 10 and is capped at 100, the count runs in parallel with the page query, and the list has Previous and Next controls. See [`src/lib/utils.ts`](src/lib/utils.ts), `getAllSelections` in [`src/lib/db/queries/selections.ts`](src/lib/db/queries/selections.ts) and [`src/components/SelectionsList.tsx`](src/components/SelectionsList.tsx).
- **Typed application errors with real HTTP statuses.** An `AppError` carries a status and a code (`400`, `404`, `409`), and the response uses that status. See [`src/lib/api/errors.ts`](src/lib/api/errors.ts).
- **API tests on a real PostgreSQL.** The Hono app is called in-process and the database is emptied between tests. See [`src/__tests__`](src/__tests__).

## Architecture

```mermaid
flowchart LR
  ui[React UI: CarSelector, SelectionsList, hooks] -- fetch --> route[Next.js route handler /api]
  route --> hono[Hono app: routes, Zod validation]
  hono --> queries[Drizzle queries]
  queries --> pg[(PostgreSQL)]
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/brands` | List brands |
| GET | `/api/models?brandId=` | List the models of a brand |
| GET | `/api/selections?page=&limit=&brandId=&modelId=&year=` | Paginated selections. The filters apply only when both `brandId` and `modelId` are given, `year` then narrows further |
| POST | `/api/selections` | Create a selection from `brandId`, `modelId` and an optional `year` |
| DELETE | `/api/selections/:id` | Delete a selection |

## Tech stack

From [`package.json`](package.json) and [`docker-compose.yml`](docker-compose.yml):

- Next.js 16.3.8, React 19.2.3, TypeScript 5
- Hono 4 with `@hono/zod-validator`, Zod 4
- Drizzle ORM 0.45 and Drizzle Kit, `postgres` driver
- PostgreSQL (image `supabase/postgres:15.1.0.73` in Compose)
- Tailwind CSS 4, Radix UI Select
- ESLint 9, Jest 30 with ts-jest

## Getting started

```bash
git clone https://github.com/guillaume-lecomte/car-selector-app
cd car-selector-app
npm ci
cp .env.example .env
docker compose up -d
npm run db:push
npm run db:seed
npm run dev
```

The app is then on `http://localhost:3000`. `npm run db:push` asks for a confirmation before applying the schema; add `-- --force` to skip it (`npm run db:push -- --force`).

### Tests

The tests run against a real PostgreSQL database whose name must contain `test` (the setup file refuses to run otherwise, and empties the tables between tests):

```bash
psql postgresql://postgres:postgres@localhost:5432/postgres -c "CREATE DATABASE car_selector_test"
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_selector_test
npm run db:push -- --force
npm test
```

### Upgrading an existing database

The unique constraint on selections is now `NULLS NOT DISTINCT`. On a database that already holds rows, `drizzle-kit push` may offer to truncate tables to apply it. Answer no (or do not use `--force`) and run this instead, after removing any duplicate selections without a year:

```sql
ALTER TABLE selections DROP CONSTRAINT selections_brand_model_year_unique;
ALTER TABLE selections ADD CONSTRAINT selections_brand_model_year_unique
  UNIQUE NULLS NOT DISTINCT (brand_id, model_id, year);
```

### What was verified

On 2026-10-06 with Node.js 22 and npm 10, using a locally installed PostgreSQL 16 on port 5432 instead of Docker: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` (19 tests), `npm run db:push -- --force` and `npm run db:seed` succeed, and the list pagination was exercised in a browser (12 selections, two pages, deletion on the second page). The `docker compose up -d` step itself was not run.

## Status

Example project, not maintained. Last significant activity 2026-10-06.

## Known issues

- **Validation errors have a different body shape.** Zod validation failures answer `400` with the raw validator message, while application errors answer with `success`, `code` and `message`.
- **The duplicate check before the insert is not atomic**, but the database constraint settles the race, see above.
- **No authentication.** Anyone who can reach the API can create and delete selections.
- **Unused migration files.** `src/lib/db/migrations/` exists, but `drizzle.config.ts` writes to `./drizzle` (git-ignored) and the documented flow uses `db:push`, which does not read them.
- **`pnpm-workspace.yaml`** is left over from pnpm, the lockfile is npm's.
- **Dependencies.** `npm audit --omit=dev` on 2026-10-06 reports 0 advisories.

## License

No license file in the repository.
