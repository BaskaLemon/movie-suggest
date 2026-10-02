import type { Metadata } from "next";
import { SearchView } from "@/components/SearchView";
import { getList, searchMovies } from "@/lib/catalog";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q;
  return { title: typeof q === "string" && q ? `“${q}”` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = typeof raw === "string" ? raw.trim().slice(0, 100) : "";
  const [results, movies, series] = await Promise.all([
    q ? searchMovies(q) : Promise.resolve([]),
    getList("trending"),
    getList("trending", undefined, "tv"),
  ]);
  // Shown before anything is typed: alternate trending movies and series.
  const suggestions = movies.slice(0, 6).flatMap((m, i) => (series[i] ? [m, series[i]] : [m]));

  return <SearchView initialQuery={q} initialResults={results} suggestions={suggestions} />;
}
