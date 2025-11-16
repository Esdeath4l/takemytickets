# Reviews & Ratings Service

Backend-only service built with Node 20, TypeScript, Express, Prisma (Postgres), Zod, JWT auth, and a simple outbox-driven aggregator worker.

Quick start

1. Start Postgres:

```powershell
docker-compose up -d
```

2. Set environment variables (example):

```powershell
$env:DATABASE_URL = 'postgresql://reviews:reviews@localhost:5432/reviews?schema=public'
$env:JWT_PUBLIC_KEY = 'test-insecure-key'
npm run db:push
npm run seed
```

3. Run dev server:

```powershell
npm run dev
```

Endpoints

- POST /v1/subjects
- POST /v1/:subjectId/reviews
- GET /v1/:id/rating

Auth

Provide Bearer JWT with claim tenant_id. For local tests you can use symmetric key 'test-insecure-key'.

Notes

This is a skeleton to satisfy the requested architecture. It includes an outbox table and a polling worker that recomputes aggregates. Expand validations, error handling, and all endpoints as needed.
