# Reviews & Ratings Service

Backend-only service for multi-tenant reviews and ratings. Designed as a focused backend repository using:

- Node 20 + TypeScript
- Express
- Prisma (Postgres)
- Zod for validation
- JWT-based auth (tenant_id claim)
- Outbox pattern + aggregator worker for async rating recomputation

This README covers local setup, environment variables, useful scripts, and example requests (PowerShell-friendly). It assumes you're developing on Windows (PowerShell examples). For macOS / Linux use the equivalent curl/bash commands.

## Prerequisites

- Node 20+
- npm
- Docker Desktop (recommended) or a running Postgres instance
- (optional) jq for JSON pretty-printing in shell

## Quick start (recommended: Docker)

1. From the repository root start Postgres with Docker Compose:

```powershell
docker compose up -d
```

2. Install node dependencies:

```powershell
npm install
```

3. Set environment variables (example for PowerShell session):

```powershell
$env:DATABASE_URL = 'postgresql://reviews:reviews@localhost:5432/reviews?schema=public'
$env:JWT_PUBLIC_KEY = 'test-insecure-key'
```

4. Generate Prisma client and push schema to the DB, then seed sample data:

```powershell
npx prisma generate
npm run db:push
npm run seed
```

5. Start the TypeScript dev server:

```powershell
npm run dev
```

The server listens on `http://localhost:3000` by default.

## Environment variables

Create a `.env` file (not checked into git) or export the variables in your shell. Example variables used in this project:

- `DATABASE_URL` — Postgres connection string (required for production/dev with Postgres)
- `JWT_PUBLIC_KEY` — public key or symmetric key used by the JWT verifier in dev
- `PORT` — optional (defaults to 3000)
- `LOG_LEVEL` — pino log level (info by default)

Note: For local testing this repo accepts a symmetric `JWT_PUBLIC_KEY='test-insecure-key'`. Replace with a real RSA public key in production and set `JWT_PUBLIC_KEY_PATH` if you prefer file-based keys.

## Scripts

- `npm run dev` — start dev server with `ts-node-dev`
- `npm run build` — compile to `dist/`
- `npm run start` — run built server (`node dist/server.js`)
- `npm run test` — run Jest tests
- `npm run db:push` — `prisma db push` (apply schema to DB)
- `npm run migrate` — `prisma migrate dev`
- `npm run seed` — run `prisma/seed.ts` to insert demo records

## Health check

GET `/health` returns:

```json
{ "status": "ok", "pid": 12345, "uptime": 12.34 }
```

## API (v1) — example requests (PowerShell)

First generate a JWT for the demo tenant (dev symmetric key):

```powershell
$env:TOKEN = (node -e "console.log(require('jsonwebtoken').sign({tenant_id:'00000000-0000-0000-0000-000000000001'}, 'test-insecure-key'))")
Write-Output "TOKEN: $env:TOKEN"
```

Create a subject:

```powershell
$headers = @{ Authorization = "Bearer $env:TOKEN"; "Content-Type" = "application/json"; "Idempotency-Key" = "sub-create-1" }
$body = @{ subject_type = 'product'; external_ref = 'prod-3'; title = 'Product 3' } | ConvertTo-Json
$subject = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/v1/subjects' -Headers $headers -Body $body
```

Create a review for the subject (replace `$subject.id`):

```powershell
$reviewBody = @{ external_user_id = 'user-99'; rating = 5; title = 'Awesome'; body = 'Loved it'; language = 'en'; aspects = @(@{ aspect_key = 'quality'; rating = 5 }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/v1/$($subject.id)/reviews" -Headers @{ Authorization = "Bearer $env:TOKEN"; 'Content-Type' = 'application/json'; 'Idempotency-Key' = 'review-create-1' } -Body $reviewBody
```

Get rating aggregates for a subject:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/v1/$($subject.id)/rating" -Headers @{ Authorization = "Bearer $env:TOKEN" }
```

Other endpoints available in the repo:

- `POST /v1/subjects/{id}/reviews` — create review
- `GET /v1/subjects/{id}` — fetch subject
- `GET /v1/subjects?subject_type=&external_ref=` — lookup
- `GET /v1/reviews/{id}` — fetch review
- `PATCH /v1/reviews/{id}` — edit review (title/body/rating)
- `DELETE /v1/reviews/{id}` — soft-delete (status=deleted)
- `POST /v1/reviews/{id}/votes` — helpful votes (unique per voter)
- `POST /v1/reviews/{id}/flags` — create moderation flags
- `POST /v1/reviews/{id}/approve` — moderation approve
- `POST /v1/reviews/{id}/reject` — moderation reject

When using PowerShell, prefer `Invoke-RestMethod` or call `curl.exe` explicitly to avoid PowerShell's `curl` aliasing.

## Testing

- Unit tests: utility functions and domain validators (Jest)
- Integration tests: use Supertest against a running server and a DB. Tests assume a running Postgres or use the local test flow.

Run tests:

```powershell
npm test
```

## Notes & next steps

- The project contains a basic outbox table and a simple polling aggregator worker that recomputes subject aggregates asynchronously. In production swap to a robust queue/worker and use Redis for idempotency caching.
- Tenant configuration for allowed aspect keys is hardcoded in `src/domain/tenantConfig.ts` — consider persisting tenant config in the DB.
- Improve OpenAPI documentation by annotating routes; `swagger-jsdoc` is wired in `src/app.ts`.

## Files of interest

- `src/app.ts` — Express app and route mounting
- `src/server.ts` — app launcher + worker start
- `prisma/schema.prisma` — DB schema
- `prisma/seed.ts` — seed script to insert demo data

---

If you'd like, I can also:

- add a PowerShell script that runs the smoke tests end-to-end and prints a summary, or
- add SQLite fallback config for local dev (so tests run without Docker), or
- generate full OpenAPI annotations for all routes.

Tell me which of those you'd like next.
# Reviews & Ratings Service

Backend-only service built with Node 20, TypeScript, Express, Prisma (Postgres), Zod, JWT auth, and a simple outbox-driven aggregator worker.

