# Reelpick

A movie and TV series suggestion site. Choose movies or series, a mood, genres, era, length and minimum rating, and it rolls a shortlist for tonight. Reroll and it won't repeat itself. Also: a cinematic trending hero, browse tabs by list and genre, live search across movies and series, detail pages (ratings gauge, cast, trailer, seasons, similar titles), optional accounts with multiple profiles, and a watchlist per profile.

Built with Next.js 16 (App Router), Tailwind CSS 4, Motion and lucide icons. Data from [TMDB](https://www.themoviedb.org/).

## Setup

```bash
bun install
echo "TMDB_API_KEY=your_key_here" > .env.local
bun dev
```

Get a free key at <https://www.themoviedb.org/settings/api>. Either `TMDB_API_KEY` (v3 key) or `TMDB_ACCESS_TOKEN` (v4 read token) works.

Without a key the site runs on a bundled demo catalogue of 48 films and 22 series with generated poster art, so everything still works offline. A footer badge shows when demo data is in use.

## Accounts

Sign-in is optional. An account holds up to 5 profiles ("Who's watching?"), each with its own name, colour, default picker mode and watchlist. Passwords are hashed with scrypt; sessions are random tokens in an httpOnly cookie, stored hashed.

Account data lives in `.data/db.json` (git-ignored; override the folder with `REELPICK_DATA_DIR`). That's fine for running locally. Before deploying somewhere with an ephemeral or shared filesystem (Vercel, multiple instances), move `lib/db.ts` onto a real database. Watchlists themselves are kept in browser storage, per profile, so they don't follow you to another device.

## Where things live

- `lib/catalog.ts` – all TMDB calls (server only), each with an automatic fallback to `lib/fallback.ts`
- `app/api/{pick,browse,search}` – JSON endpoints used by the client components
- `components/Picker.tsx` – the "pick for me" flow
- `lib/watchlist.ts` – localStorage-backed watchlist hook, one list per profile
- `lib/db.ts`, `lib/auth.ts`, `app/actions/account.ts` – account storage, sessions and the sign-in/profile actions
- `app/globals.css` – design tokens and the animated gradient background
