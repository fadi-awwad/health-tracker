# Health Tracker

A small, private, phone-first web app for tracking a weight-loss treatment
(weekly Mounjaro injection), weight, blood pressure, body measurements, side
effects and daily medications. Multi-user: each family member has their own
login and private data. English, Hebrew and Arabic (RTL) included.

**Stack:** Next.js 16 (App Router, server actions) · TypeScript · Tailwind CSS 4 ·
SQLite (better-sqlite3 + Drizzle ORM) · Recharts · deployed on Fly.io with a volume.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000
```

The first visit goes to `/setup` to create the admin account. The local database
lives in `./data/app.db` (git-ignored). Delete that file to start over.

To open the dev server from your phone on the same Wi-Fi, use
`http://<your-PC-ip>:3000`.

## Project layout

```
src/
  app/
    (app)/            pages behind login: Today, add/[type], progress, history, settings
    actions/          server actions (all mutations; each re-checks the session)
    api/export/       JSON export of the signed-in user's data
    login/ setup/     auth pages
    manifest.ts       PWA manifest ("Add to Home Screen")
  components/         UI pieces (bottom nav, med checklist, charts, icons…)
  db/                 Drizzle schema + connection (runs migrations on startup)
  lib/
    auth.ts           password hashing (scrypt), DB-backed sessions, requireUser()
    data.ts           read queries, always scoped to a user id
    i18n/             en / he / ar dictionaries + formatting helpers
    injection.ts      dose list, site rotation, next-shot / late-window logic
    time.ts           timezone helpers ("today" is computed in the user's timezone)
drizzle/              generated SQL migrations
```

### Changing the database schema

1. Edit `src/db/schema.ts`
2. `npx drizzle-kit generate --name <what-changed>`
3. Commit the new file in `drizzle/`. Migrations run automatically when the app starts.

## Deploy to Fly.io

One-time setup (run from this folder):

```bash
fly auth login

# Pick a unique app name and update `app = ...` in fly.toml (or let launch do it)
fly launch --no-deploy --copy-config --name <your-app-name>

# Persistent disk for the SQLite database (same region as fly.toml)
fly volumes create health_data --region fra --size 1

# Secret code required to create the first (admin) account
fly secrets set SETUP_TOKEN=<pick-a-long-random-string>

fly deploy
```

Then open `https://<your-app-name>.fly.dev`, enter the setup code and create
your account. After that, `/setup` is permanently disabled. Add family members
from **Settings → Family members**.

Later updates are just `fly deploy`.

### Install on iPhone

Open the site in **Safari** → Share → **Add to Home Screen**. It opens full
screen like a native app and keeps you signed in for 90 days.

### Backups

- Fly takes daily snapshots of the volume (`fly volumes snapshots list <vol-id>`).
- Every user can download their data as JSON from Settings.
- For continuous off-site backup, add [Litestream](https://litestream.io)
  replicating to Tigris (planned).

### Notes

- The machine auto-stops when idle and starts on the next request (first
  load after idle takes a second or two). This keeps the cost very low.
- Keep a single machine: SQLite lives on one volume. Don't `fly scale count 2`.

## Medical disclaimer

The "late dose" guidance shown in the app (take within 4 days, keep doses at
least 3 days apart) comes from the Mounjaro patient leaflet. It's a reminder,
not medical advice. Follow your doctor's instructions.
