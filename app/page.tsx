import { BrowseTabs } from "@/components/BrowseTabs";
import { HeroCarousel } from "@/components/HeroCarousel";
import { MovieRow } from "@/components/MovieRow";
import { Picker } from "@/components/Picker";
import { PopularShelf } from "@/components/PopularShelf";
import { getList } from "@/lib/catalog";

export default async function Home() {
  const [trending, popular, top] = await Promise.all([getList("trending"), getList("popular"), getList("top")]);
  const featured = trending.filter((m) => m.backdrop || !m.poster).slice(0, 5);

  return (
    <>
      <HeroCarousel movies={featured} />
      <PopularShelf movies={popular.slice(0, 12)} />
      <div className="mt-24 space-y-24">
        <Picker />
        <MovieRow title="All-time greats" movies={top} />
        <BrowseTabs initial={trending} />
      </div>
    </>
  );
}
