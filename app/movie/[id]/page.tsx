import type { Metadata } from "next";
import { TitleDetail, titleMetadata } from "@/components/TitleDetail";

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  return titleMetadata("movie", (await params).id);
}

export default async function MoviePage({ params }: PageProps<"/movie/[id]">) {
  return <TitleDetail media="movie" id={(await params).id} />;
}
