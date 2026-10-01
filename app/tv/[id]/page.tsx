import type { Metadata } from "next";
import { TitleDetail, titleMetadata } from "@/components/TitleDetail";

export async function generateMetadata({ params }: PageProps<"/tv/[id]">): Promise<Metadata> {
  return titleMetadata("tv", (await params).id);
}

export default async function SeriesPage({ params }: PageProps<"/tv/[id]">) {
  return <TitleDetail media="tv" id={(await params).id} />;
}
