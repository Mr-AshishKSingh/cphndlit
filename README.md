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

The easiest path is entirely inside the Vercel dashboard, no separate signups needed:

1. Push this repo to GitHub (see below) and import it as a new Project in Vercel.
2. In the project, go to **Storage → Create Database → Postgres** (this provisions a Neon database and automatically adds `DATABASE_URL` / `DIRECT_URL`... — Vercel names these `POSTGRES_URL` etc. by default, so after creating it, copy the pooled and direct connection strings into `DATABASE_URL` and `DIRECT_URL` in your project's Environment Variables to match what this app expects).
3. Go to **Storage → Create Database → Blob**. This automatically adds `BLOB_READ_WRITE_TOKEN` to your project's environment variables — nothing else to do.
4. Under **Settings → Environment Variables**, add `SESSION_SECRET` (generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).
5. For local development, run `vercel link` then `vercel env pull .env` to pull all of the above down to your machine, or copy the values manually from the dashboard into `.env`.

## Deploying

```bash
git push                       # if connected to GitHub, Vercel deploys automatically
# or, from the CLI:
npx vercel --prod
```

Before the first deploy (or after any schema change), run migrations against the production database:

```bash
npm run db:migrate    # prisma migrate deploy, uses DIRECT_URL
```

You can run this from your local machine (with production env vars pulled via `vercel env pull`) or wire it into a Vercel deploy hook / GitHub Action if you want it automatic.

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
