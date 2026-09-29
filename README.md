# Reelpick

A movie suggestion site. Pick a mood, genres, era, length and minimum rating, and it rolls one movie for tonight. Reroll and it won't repeat itself. Also: a cinematic trending hero, browse tabs by list and genre, live search, movie detail pages (ratings gauge, cast, trailer, similar titles) and a watchlist saved in the browser.

Built with Next.js 16 (App Router), Tailwind CSS 4, Motion and lucide icons. Data from [TMDB](https://www.themoviedb.org/).

## Setup

```bash
bun install
cp .env.example .env.local   # then paste your TMDB key
bun dev
```

Get a free key at <https://www.themoviedb.org/settings/api>. Either `TMDB_API_KEY` (v3 key) or `TMDB_ACCESS_TOKEN` (v4 read token) works.

Without a key the site runs on a bundled demo catalogue of ~48 films with generated poster art, so everything still works offline. A footer badge shows when demo data is in use.

## Where things live

- `lib/catalog.ts` – all TMDB calls (server only), each with an automatic fallback to `lib/fallback.ts`
- `app/api/{pick,browse,search}` – JSON endpoints used by the client components
- `components/Picker.tsx` – the "pick for me" flow
- `lib/watchlist.ts` – localStorage-backed watchlist hook
- `app/globals.css` – design tokens and the animated gradient background
