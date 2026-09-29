import { CalendarDays, Clock, Play, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MovieRow } from "@/components/MovieRow";
import { Poster } from "@/components/Poster";
import { RatingGauge } from "@/components/RatingGauge";
import { Stars } from "@/components/Stars";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getMovie } from "@/lib/catalog";
import { formatCount, formatRuntime, tmdbImage } from "@/lib/format";
import { genreNames } from "@/lib/genres";

const load = cache(async (raw: string) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return getMovie(id);
});

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const movie = await load((await params).id);
  if (!movie) return { title: "Movie not found" };
  return {
    title: movie.year ? `${movie.title} (${movie.year})` : movie.title,
    description: movie.overview,
    openGraph: { images: movie.backdrop ? [tmdbImage(movie.backdrop, "w1280")!] : [] },
  };
}

export default async function MoviePage({ params }: PageProps<"/movie/[id]">) {
  const movie = await load((await params).id);
  if (!movie) notFound();

  const genres = genreNames(movie.genreIds, 4);
  const runtime = formatRuntime(movie.runtime);
  const released = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
    : String(movie.year ?? "TBA");

  return (
    <article>
      <div className="relative isolate overflow-hidden lg:-ml-20">
        <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
          <Poster movie={movie} variant="backdrop" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#04060d]/80 via-[#04060d]/60 to-[#04060d]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#04060d]/90 via-[#04060d]/40 to-transparent" />
        </div>

        <div className="grid gap-10 px-4 pb-12 pt-28 sm:px-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-end lg:pl-28 lg:pt-40">
          <div className="glass mx-auto w-full max-w-[320px] overflow-hidden rounded-[28px] p-3 shadow-2xl">
            <div className="relative aspect-[2/3] overflow-hidden rounded-[20px] bg-surface-solid">
              <Poster movie={movie} sizes="320px" priority />
            </div>
            {genres.length > 0 && <p className="mt-3 text-center text-xs text-ink/75">{genres.join(" · ")}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {movie.trailerKey ? (
                <a href="#trailer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-[#070a1c] transition hover:bg-white/90">
                  <Play size={16} className="fill-current" />
                  Trailer
                </a>
              ) : (
                <span className="inline-flex h-12 items-center justify-center rounded-full bg-white/10 text-xs text-muted">No trailer</span>
              )}
              <WatchlistButton movie={movie} compact className="px-3" />
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] uppercase leading-[0.9] tracking-wide">{movie.title}</h1>
            {movie.tagline && <p className="mt-3 text-lg italic text-ink/70">“{movie.tagline}”</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink/80">
              <Stars rating={movie.rating} />
              {movie.year && <span>{movie.year}</span>}
              {runtime && <span>{runtime}</span>}
              {genres.length > 0 && <span className="text-accent">{genres.join(" · ")}</span>}
            </div>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-ink/90">{movie.overview || "No synopsis yet."}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-4 sm:px-8 lg:grid-cols-3">
        <section aria-labelledby="ratings-heading" className="glass rounded-3xl p-6 sm:p-8">
          <h2 id="ratings-heading" className="text-2xl font-semibold">Ratings</h2>
          <div className="mt-4">
            <RatingGauge rating={movie.rating} votes={movie.voteCount} />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Clock, label: "Runtime", value: runtime ?? "–" },
              { icon: CalendarDays, label: "Released", value: released },
              { icon: Users, label: "Votes", value: formatCount(movie.voteCount) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl bg-white/[0.05] px-2 py-4">
                <Icon size={18} className="mx-auto text-accent" />
                <dd className="mt-2 text-sm font-semibold">{value}</dd>
                <dt className="text-[11px] text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="cast-heading" className="glass min-w-0 rounded-3xl p-6 sm:p-8 lg:col-span-2">
          <h2 id="cast-heading" className="text-2xl font-semibold">Cast</h2>
          {movie.cast.length === 0 ? (
            <p className="mt-4 text-muted">Cast not listed yet.</p>
          ) : (
            <ul className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-2">
              {movie.cast.map((c) => {
                const photo = tmdbImage(c.photo, "w185");
                return (
                  <li key={c.id} className="w-32 shrink-0">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-[#26306b] to-[#121636]">
                      {photo ? (
                        <Image src={photo} alt="" fill sizes="128px" className="object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center text-3xl font-semibold text-white/40">
                          {c.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.character}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {movie.trailerKey && (
          <section id="trailer" aria-labelledby="trailer-heading" className="glass scroll-mt-24 rounded-3xl p-4 sm:p-6 lg:col-span-3">
            <h2 id="trailer-heading" className="mb-4 px-2 text-2xl font-semibold">Trailer</h2>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?rel=0`}
                title={`${movie.title} trailer`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="size-full"
              />
            </div>
          </section>
        )}
      </div>

      <div className="mt-20">
        <MovieRow title="More like this" movies={movie.similar} />
      </div>
    </article>
  );
}
