import { BrowseTabs } from "@/components/BrowseTabs";
import { HeroCarousel } from "@/components/HeroCarousel";
import { MovieRow } from "@/components/MovieRow";
import { Picker } from "@/components/Picker";
import { PopularShelf } from "@/components/PopularShelf";
import { getViewer } from "@/lib/auth";
import { getList } from "@/lib/catalog";

export default async function Home() {
  const [viewer, trending, popular, top, popularTv, topTv] = await Promise.all([
    getViewer(),
    getList("trending"),
    getList("popular"),
    getList("top"),
    getList("popular", undefined, "tv"),
    getList("top", undefined, "tv"),
  ]);
  const featured = trending.filter((m) => m.backdrop || !m.poster).slice(0, 5);

  return (
    <>
      <HeroCarousel movies={featured} />
      <PopularShelf title="Popular movies" movies={popular.slice(0, 12)} className="-mt-32" />
      <PopularShelf id="series" title="Popular series" movies={popularTv.slice(0, 12)} className="mt-6" />
      <div className="mt-24 space-y-24">
        {/* Remount on profile switch so the picker starts on that profile’s default. */}
        <Picker key={viewer?.profile?.id ?? "guest"} />
        <MovieRow title="All-time great movies" movies={top} />
        <MovieRow title="Top-rated series" movies={topTv} />
        <BrowseTabs initial={trending} />
      </div>
    </>
  );
}
