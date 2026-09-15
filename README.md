# CEO Portal

A workforce management portal for attendance, tasks, payroll, leave, expenses, and company announcements. Built with Next.js, Prisma (Postgres), and Vercel Blob for document storage — designed to deploy to Vercel with real, persistent data.

## Getting Started (local development)

You need a Postgres database and a Vercel Blob store before the app will run — see [Setting up storage](#setting-up-storage-neon--vercel-blob) below. Once you have both:

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL, DIRECT_URL, BLOB_READ_WRITE_TOKEN, SESSION_SECRET
npx prisma migrate deploy   # creates the tables
npm run db:seed             # only needed once, or after resetting the database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default logins

| Role | Email | Password |
| --- | --- | --- |
| CEO / Admin | officialwork.ashish@gmail.com | admin123 |
| Employee (sample) | priya.sharma@company.com | employee123 |

Four more sample employees were seeded (rahul.verma, ananya.iyer, karan.mehta, sneha.patel @company.com), all using `employee123`. New employees you add through the Employees page get the password `welcome123` — shown on screen right after creation.

**Change the admin password after first login.**

## What's included

- **Auth** — CEO/Admin and Employee roles, cookie session, per-role route protection.
- **Employees** — directory, profiles, departments, org reporting lines, compensation, document uploads.
- **Attendance** — employee clock in/out, admin day-by-day view and manual overrides.
- **Tasks** — Kanban board (To Do / In Progress / Done / Blocked), admin assigns, employees update their own.
- **Payroll** — generate monthly payroll for all active employees, edit bonuses/deductions, mark paid; employees see their own payslips.
- **Leave** — employees request leave, admin approves/rejects, balances tracked per type per year.
- **Expenses** — employees submit claims, admin approves/rejects.
- **Announcements** — company-wide posts, pinnable.
- **Dashboard** — company-wide stats and charts for admin; personal snapshot for employees.

## Setting up storage (Neon + Vercel Blob)

This project (`ceo-portal` under the linked Vercel account) already has both provisioned via Vercel's Storage tab:

- **Postgres**, via the Neon marketplace integration (Storage → Create Database → Postgres). This auto-adds a bunch of `POSTGRES_*` / `PG*` vars, but **this app specifically reads `DATABASE_URL` and `DIRECT_URL`**, which were set manually to the pooled and unpooled connection strings Neon provided.
- **Blob**, via Storage → Create Database → Blob. This auto-adds `BLOB_READ_WRITE_TOKEN` — nothing else needed for that one.
- `SESSION_SECRET` was generated separately (a different random value per environment) and added under Settings → Environment Variables.

**Important gotcha**: Neon's pooled connection string alone isn't enough for Prisma — it needs `&pgbouncer=true` appended to `DATABASE_URL`, or every query fails with `Can't reach database server` even though the pooled endpoint is perfectly reachable (Prisma's prepared-statement usage doesn't work against PgBouncer's transaction-pooling mode without that flag). `DIRECT_URL` (unpooled, used only for migrations) does not need this flag.

If you ever need to redo this setup from scratch (new project, rotated database, etc.):
1. Import the repo into Vercel, add Postgres (Neon) and Blob from the Storage tab.
2. In Environment Variables, set `DATABASE_URL` to Neon's pooled connection string **plus `&pgbouncer=true`**, and `DIRECT_URL` to the unpooled one, for all three environments (production/preview/development).
3. Add `SESSION_SECRET`.
4. For local development: `vercel link`, then `vercel env pull .env.local`.

Neon's compute also auto-suspends when idle — the very first query after a period of inactivity can take several seconds and occasionally times out once before succeeding on retry. This is normal and only affects cold starts, not steady traffic.

## Deploying

```bash
git push                       # Vercel deploys automatically (GitHub integration is connected)
# or, from the CLI:
npx vercel --prod
```

Migrations run automatically as part of every build (`prisma migrate deploy && next build`, see `package.json`), so there's nothing extra to do after a schema change beyond pushing.

## Useful commands

```bash
npm run dev          # start the dev server
npm run build        # production build
npm start             # run the production build
npm run db:studio    # browse/edit the database in Prisma Studio
npm run db:seed      # re-seed departments, admin, and sample employees
npm run db:migrate   # apply pending migrations to the database in DIRECT_URL
```

## Notes

- Session cookies are marked `secure` in production, so the app must be served over HTTPS there — Vercel does this by default.
- Documents are stored in Vercel Blob as public-but-unguessable URLs; the app never exposes those URLs directly — downloads are proxied through an authenticated API route (`/api/documents/[id]`) that checks the requester is an admin or the owning employee before streaming the file.
- To reset all data: drop and recreate the tables (`npx prisma migrate reset` against your Postgres database, careful — this is destructive) and run `npm run db:seed` again.
