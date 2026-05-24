# BTT — Bus Ticket Tracker

Online ticket booking + live GPS tracking for a bus fleet.

**Stack:** Next.js 15 + React 19 + TypeScript + Tailwind + Prisma + PostgreSQL + Leaflet (OpenStreetMap)

## Features

- **Public site** — browse upcoming trips, pick a bus, choose seats, guest checkout
- **Find Booking** — search by phone, name, or booking reference
- **Live tracking** — passengers see their bus on a map after booking
- **Admin dashboard** — buses, routes, trips, bookings, payments, contacts, admin users
- **Payment-method toggles** — bKash, Nagad, Cash on Board (toggle + credentials from dashboard, encrypted at rest)
- **GPS-ready** — generic HTTP endpoint accepts location pings from any tracker

---

## Deploy to Vercel + Neon (recommended)

### Step 1 — Create a Neon (PostgreSQL) database (free)

1. Sign up at https://neon.tech
2. Click **Create Project** → name it `btt` → region close to Bangladesh (Singapore is closest)
3. After creation you'll see a **Connection string** — it looks like:
   ```
   postgresql://USER:PASSWORD@HOST.neon.tech/btt?sslmode=require
   ```
4. **Copy that string** — you'll paste it into Vercel in Step 3.

### Step 2 — Sign up for Vercel and import the repo

1. Go to https://vercel.com → sign in with GitHub
2. Click **Add New… → Project** → import `wasik23/BTT-BusTicketTracker`
3. **Framework Preset:** Next.js (auto-detected) — leave as-is
4. **Build Command:** `npm run vercel-build` *(this runs `prisma generate && prisma db push && next build` — important!)*
5. Don't deploy yet — first add environment variables (next step)

### Step 3 — Add environment variables on Vercel

In the project settings → **Environment Variables**, add:

| Name | Value |
|---|---|
| `DATABASE_URL` | (the Neon connection string from Step 1) |
| `JWT_SECRET` | a random 40+ character string (use `openssl rand -hex 32` or any password generator) |
| `ENCRYPTION_KEY` | exactly 32 characters — e.g. `my-prod-encryption-key-32chars!!` |
| `GPS_INGEST_SECRET` | a random string — used to authenticate GPS trackers |
| `SEED_ADMIN_USERNAME` | `admin` (or any username you want) |
| `SEED_ADMIN_PASSWORD` | a strong password — change after first login |

Click **Deploy**. First build takes ~3 minutes (Prisma migrates the database, Next.js builds the site).

### Step 4 — Seed initial admin user and mock data

After the first deploy succeeds:
1. In your Vercel project → **Deployments** → click the latest → **… → Open Shell** (or use Vercel CLI)
2. Or simpler: clone the repo locally, set `DATABASE_URL` in `.env`, then run `npm run db:seed`

The seed creates the admin user and 2 demo buses. Log in at `https://YOUR-DOMAIN.vercel.app/admin/login`.

### Step 5 — (Optional) Custom domain

Vercel gives you `BTT-BusTicketTracker.vercel.app` free. To use a custom domain (e.g. `btt.com.bd`):
- Buy the domain from any registrar (Namecheap, GoDaddy, or local providers like ExonHost)
- In Vercel → Project → **Domains** → add domain → follow DNS instructions

---

## Local development

```powershell
nvm use 22.22.3
npm install
copy .env.example .env
# edit .env: set DATABASE_URL to your Neon connection string (or a local Postgres)
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## First steps as the owner

1. Sign in at `/admin/login` (use the credentials from `SEED_ADMIN_PASSWORD`)
2. **Settings** → fill in company name, owner phone, support/complaint phones
3. **Buses** → add/edit buses, driver, supervisor, photo URLs
4. **Routes & Trips** → add routes, schedule trips
5. **Payments** → enable Cash on Board now; enable bKash/Nagad when you have merchant credentials

## GPS tracker setup

The site exposes `POST /api/gps/ingest`:

```bash
curl -X POST https://YOUR-DOMAIN.vercel.app/api/gps/ingest \
  -H "Content-Type: application/json" \
  -H "X-GPS-Secret: YOUR_GPS_INGEST_SECRET" \
  -d '{"busId": "...", "lat": 23.81, "lng": 90.41, "speedKmh": 45}'
```

Most trackers don't speak JSON. Standard approach: install [Traccar](https://www.traccar.org/) on a small VPS, configure it with a webhook forwarding to `/api/gps/ingest`.

## Project layout

```
src/
  app/
    page.tsx                 home / trip listing
    trips/[id]/              seat picker + booking
    bookings/[ref]/          confirmation + live tracking
    find-booking/            search by phone/name/reference
    support/                 contact info
    admin/
      login/                 admin sign in
      (authed)/              all authenticated admin pages
    api/                     bookings, GPS, admin auth
  components/                SeatPicker, LiveMap
  lib/                       db, auth, settings, crypto, seat-layout
prisma/
  schema.prisma              database schema (PostgreSQL)
  seed.ts                    initial admin + default settings + 2 mock buses
```

## Security

- Admin sessions: JWT in httpOnly cookies, 7-day expiry
- Payment credentials stored AES-256-GCM encrypted with `ENCRYPTION_KEY`
- GPS ingest requires `X-GPS-Secret` header matching `GPS_INGEST_SECRET`
- Change the admin password immediately after first login
