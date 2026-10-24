import Image from "next/image";
import { tmdbImage } from "@/lib/format";
import { countryName } from "@/lib/region";
import type { Provider, WatchProviders } from "@/lib/types";

function Row({ label, providers, link }: { label: string; providers: Provider[]; link: string | null }) {
  if (!providers.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-medium uppercase tracking-[0.15em] text-muted">{label}</span>
      {providers.slice(0, 8).map((p) => {
        const logo = tmdbImage(p.logo, "w92");
        const tile = logo ? (
          <Image src={logo} alt={p.name} width={40} height={40} className="size-10 rounded-xl ring-1 ring-white/10" />
        ) : (
          <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-[10px]">{p.name.slice(0, 3)}</span>
        );
        return link ? (
          <a key={p.id} href={link} target="_blank" rel="noreferrer" title={`${label} on ${p.name}`} className="transition hover:scale-105">
            {tile}
          </a>
        ) : (
          <span key={p.id} title={p.name}>
            {tile}
          </span>
        );
      })}
    </div>
  );
}

// Legal streaming, rental and purchase options in the visitor's country.
// TMDB's terms require crediting JustWatch, which supplies this data.
export function WhereToWatch({ providers, country, demo }: { providers: WatchProviders | undefined; country: string; demo: boolean }) {
  const name = countryName(country);
  const any = providers && (providers.stream.length || providers.free.length || providers.rent.length || providers.buy.length);
  return (
    <section aria-labelledby="where-heading" className="mt-6 max-w-2xl">
      <h2 id="where-heading" className="mb-3 text-sm font-semibold text-ink/90">
        Where to watch <span className="font-normal text-muted">in {name}</span>
      </h2>
      {any ? (
        <div className="space-y-2.5">
          <Row label="Stream" providers={providers.stream} link={providers.link} />
          <Row label="Free" providers={providers.free} link={providers.link} />
          <Row label="Rent" providers={providers.rent} link={providers.link} />
          <Row label="Buy" providers={providers.buy} link={providers.link} />
          <p className="pt-1 text-[11px] text-muted">Availability data by JustWatch.</p>
        </div>
      ) : (
        <p className="text-sm text-muted">
          {demo ? "Streaming availability shows once TMDB_API_KEY is set." : `Not available to stream, rent or buy in ${name} right now.`}
        </p>
      )}
    </section>
  );
}
