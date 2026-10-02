import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { chooseProfile } from "@/app/actions/account";
import { Avatar } from "@/components/Avatar";
import { MAX_PROFILES, getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Who’s watching?" };

export default async function ProfilesPage({ searchParams }: PageProps<"/profiles">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const manage = (await searchParams).manage === "1";

  return (
    <div className="grid min-h-[80svh] place-items-center px-4 pt-24">
      <div className="text-center">
        <h1 className="font-display text-6xl tracking-wide sm:text-7xl">{manage ? "Manage profiles" : "Who’s watching?"}</h1>
        <ul className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-8">
          {viewer.profiles.map((p) => {
            const tile = (
              <>
                <span className="relative">
                  <Avatar name={p.name} color={p.color} size={120} className="rounded-3xl text-5xl transition duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-white/80 group-focus-visible:ring-4 group-focus-visible:ring-accent" />
                  {manage && (
                    <span className="absolute inset-0 grid place-items-center rounded-3xl bg-black/50">
                      <Pencil size={28} className="text-white" />
                    </span>
                  )}
                </span>
                <span className={`mt-3 block max-w-[120px] truncate text-sm ${p.id === viewer.profile?.id ? "font-semibold text-ink" : "text-ink/70 group-hover:text-ink"}`}>
                  {p.name}
                </span>
              </>
            );
            return (
              <li key={p.id}>
                {manage ? (
                  <Link href={`/profiles/${p.id}`} className="group flex flex-col items-center outline-none" aria-label={`Edit ${p.name}`}>
                    {tile}
                  </Link>
                ) : (
                  <form action={chooseProfile.bind(null, p.id)}>
                    <button type="submit" className="group flex flex-col items-center outline-none">
                      {tile}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
          {viewer.profiles.length < MAX_PROFILES && (
            <li>
              <Link href="/profiles/new" className="group flex flex-col items-center outline-none">
                <span className="grid size-[120px] place-items-center rounded-3xl border-2 border-dashed border-white/25 text-white/60 transition group-hover:border-white/70 group-hover:text-white group-focus-visible:border-accent">
                  <Plus size={44} />
                </span>
                <span className="mt-3 text-sm text-ink/70 group-hover:text-ink">Add profile</span>
              </Link>
            </li>
          )}
        </ul>
        <Link
          href={manage ? "/profiles" : "/profiles?manage=1"}
          className="mt-14 inline-flex h-11 items-center rounded-full border border-white/40 px-7 text-sm font-medium tracking-wide text-ink/85 transition hover:border-white hover:text-ink"
        >
          {manage ? "Done" : "Manage profiles"}
        </Link>
      </div>
    </div>
  );
}
