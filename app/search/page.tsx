import type { Metadata } from "next";
import { MovieCard } from "@/components/MovieCard";
import { SearchBox } from "@/components/SearchBox";
import { searchMovies } from "@/lib/catalog";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q;
  return { title: typeof q === "string" && q ? `“${q}”` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = typeof raw === "string" ? raw.trim().slice(0, 100) : "";
  const results = q ? await searchMovies(q) : [];

  return (
    <div className="px-4 pt-28 sm:px-8">
      <h1 className="font-display text-6xl tracking-wide sm:text-7xl">{q ? `Results for “${q}”` : "Search"}</h1>
      <SearchBox className="mt-6 max-w-xl md:hidden" />
      {q && <p className="mt-2 text-muted">{results.length ? `${results.length} movies found` : "No movies matched. Try a shorter title or an actor’s name."}</p>}
      {!q && <p className="mt-2 text-muted">Find a movie by title or cast.</p>}
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {results.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </div>
  );
}
