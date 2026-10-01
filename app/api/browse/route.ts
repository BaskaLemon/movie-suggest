import type { NextRequest } from "next/server";
import { getList } from "@/lib/catalog";
import type { ListKind } from "@/lib/types";

const KINDS: ListKind[] = ["trending", "popular", "recent", "top"];

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const list = q.get("list") as ListKind;
  const genre = Number(q.get("genre") ?? 0);
  if (!KINDS.includes(list)) return Response.json({ error: "Unknown list" }, { status: 400 });
  const media = q.get("media") === "tv" ? "tv" : "movie";
  const movies = await getList(list, genre > 0 ? genre : undefined, media);
  return Response.json({ movies });
}
