# Reelpick

A movie and TV series suggestion site. Choose movies or series, a mood, genres, era, length and minimum rating, and it rolls a shortlist for tonight. Reroll and it won't repeat itself. Also: a cinematic trending hero, browse tabs for trending, popular, new and top-rated, live search across movies and series, detail pages (where to watch, ratings gauge, cast, trailer, seasons, similar titles), optional accounts with multiple profiles and Google sign-in, and a watchlist plus watched list per profile.

Built with Next.js 16 (App Router), Tailwind CSS 4, Motion and lucide icons. Data from [TMDB](https://www.themoviedb.org/).

## Setup

```bash
bun install
echo "TMDB_API_KEY=your_key_here" > .env.local
bun dev
```

Get a free key at <https://www.themoviedb.org/settings/api>. Either `TMDB_API_KEY` (v3 key) or `TMDB_ACCESS_TOKEN` (v4 read token) works.

Without a key the site runs on a bundled demo catalogue of 48 films and 22 series with generated poster art, so everything still works offline. A footer badge shows when demo data is in use.

## Accounts and database

Sign-in is optional. An account holds up to 5 profiles ("Who's watching?"), each with its own name, colour, default picker mode and watchlist. Passwords are hashed with scrypt; sessions are random tokens in an httpOnly cookie, stored hashed.

Data lives in a SQLite database through [Prisma](https://www.prisma.io/) 7 (`prisma/schema.prisma`): users, profiles, sessions and watchlist items.

You don't need a database URL to run locally: the default is the file `prisma/dev.db` (git-ignored), created on first `bun dev`. To use a different database, set `DATABASE_URL` in `.env.local`. Both the app and the Prisma commands read it. It accepts a SQLite file (`file:./prisma/other.db`) or a hosted libsql database such as [Turso](https://turso.tech) (`libsql://<db>-<org>.turso.io?authToken=<token>`).

- `bun install` generates the Prisma client (`generated/prisma`, git-ignored).
- `bun dev` / `bun start` apply pending migrations first (`scripts/migrate.mjs`), so a fresh database gets its tables on first run. For a local file this runs `prisma migrate deploy`; Prisma's migration engine doesn't accept Turso URLs, so for those the script applies `prisma/migrations/*/migration.sql` itself and records them in the same `_prisma_migrations` table. `bun run db:deploy` runs it on its own.
- `bun run db:migrate` creates a new migration after you change the schema. It always works against the local file; the next `bun dev` applies it to Turso.
- `bun run db:studio` opens Prisma Studio for a local file. Studio can't open Turso; use the [Turso dashboard](https://app.turso.tech) or `turso db shell <db>` instead.

Signed-in profiles keep their watchlist in the database, so it follows the account across browsers. Signed-out visitors keep a list in browser storage; it moves into the profile the first time they sign in.

## Deploying to Vercel

Set these in Vercel → Project → Settings → Environment Variables, then redeploy:

- `DATABASE_URL`: your Turso URL including the token (`libsql://<db>-<org>.turso.io?authToken=<token>`). Or use Turso's pair `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`, which the Vercel–Turso integration sets for you. Required: Vercel's filesystem can't hold a SQLite file, so the build stops with an explanation if no database is set. A `401` in the build log means the token is missing or invalid; the log says which.
- `TMDB_API_KEY` (or `TMDB_ACCESS_TOKEN`): without it the site shows the demo catalogue, and "Where to watch" stays empty.

`build` applies pending migrations to the database before `next build`, so schema changes reach Turso on each deploy. Posters load straight from TMDB's CDN (`images.unoptimized`), so they don't count against Vercel's image optimisation quota.

### Optional settings

| Variable | What it turns on |
| --- | --- |
| `RESEND_API_KEY` | Password-reset emails, sent through [Resend](https://resend.com). Without it, `bun dev` prints the reset link in the terminal and production logs an error instead of sending. |
| `EMAIL_FROM` | Sender, e.g. `Reelpick <hello@yourdomain.com>`. Needs a domain verified in Resend. Defaults to `onboarding@resend.dev`, which Resend only delivers to your own Resend account's address. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | "Continue with Google" on the sign-in and sign-up pages. Hidden until both are set. |
| `APP_URL` | The site's public address (e.g. `https://reelpick.vercel.app`) for links in emails. On Vercel it defaults to the production domain. |
| `CONTACT_EMAIL` | Shown on the privacy page as who to ask about data. |

**Google sign-in setup:** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth client ID of type *Web application* and add these authorized redirect URIs: `https://<your-domain>/auth/google/callback` and, for local testing, `http://localhost:3000/auth/google/callback`. Copy the client ID and secret into the variables above. Preview deployments use their own domain, so Google sign-in only works on domains you've added there.

## Security and limits

- Sign-in: 5 wrong passwords per email or 20 per network address in 15 minutes, then a wait. Sign-ups: 5 per address per hour. Reset requests: 3 per email, 10 per address per hour. Counted in the database (`RateLimitHit`), since serverless instances don't share memory; rows older than a day are pruned.
- Reset links are single-use, expire after an hour, are stored hashed, and signing in with one signs out every other device.
- Google sign-in uses PKCE and a state check; an existing account is linked only when Google has verified the email.
- Deleting an account removes its profiles, lists, sessions, reset tokens and Google link.

## Checks

GitHub Actions (`.github/workflows/ci.yml`) runs lint, type-check and a full build on every push to `main` and on pull requests, with no secrets needed.

## Where things live

- `lib/catalog.ts` – all TMDB calls (server only), each with an automatic fallback to `lib/fallback.ts`
- `app/api/{pick,browse,search}` – JSON endpoints used by the client components
- `components/Picker.tsx` – the "pick for me" flow
- `lib/watchlist.ts` – watchlist and watched-list hooks: database-backed for profiles, browser storage for signed-out visitors
- `prisma/schema.prisma`, `lib/db.ts` – database schema and Prisma client
- `lib/auth.ts`, `app/actions/account.ts`, `app/actions/watchlist.ts` – sessions, sign-in/profile/reset/delete actions and list writes
- `lib/rate-limit.ts`, `lib/email.ts`, `app/auth/google/` – attempt limits, Resend emails, Google sign-in
- `app/globals.css` – design tokens and the animated gradient background
