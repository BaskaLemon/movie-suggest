# Reelpick

A movie and TV series suggestion site. Choose movies or series, a mood, genres, era, length and minimum rating, and it rolls a shortlist for tonight. Reroll and it won't repeat itself. Also: a cinematic trending hero, browse tabs for trending, popular, new and top-rated, live search across movies and series, detail pages (ratings gauge, cast, trailer, seasons, similar titles), optional accounts with multiple profiles, and a watchlist per profile.

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
- `bun dev` / `bun start` apply pending migrations first, so a fresh checkout creates the database on first run.
- `bun run db:migrate` creates a migration after you change the schema; `bun run db:studio` opens Prisma Studio to browse the data.

Signed-in profiles keep their watchlist in the database, so it follows the account across browsers. Signed-out visitors keep a list in browser storage; it moves into the profile the first time they sign in.

## Where things live

- `lib/catalog.ts` – all TMDB calls (server only), each with an automatic fallback to `lib/fallback.ts`
- `app/api/{pick,browse,search}` – JSON endpoints used by the client components
- `components/Picker.tsx` – the "pick for me" flow
- `lib/watchlist.ts` – watchlist hook: database-backed for profiles, browser storage for signed-out visitors
- `prisma/schema.prisma`, `lib/db.ts` – database schema and Prisma client
- `lib/auth.ts`, `app/actions/account.ts`, `app/actions/watchlist.ts` – sessions, sign-in/profile actions and watchlist writes
- `app/globals.css` – design tokens and the animated gradient background
