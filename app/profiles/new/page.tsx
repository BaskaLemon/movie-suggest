import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { MAX_PROFILES, PROFILE_COLORS, getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Add profile" };

export default async function NewProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.profiles.length >= MAX_PROFILES) redirect("/profiles");
  // Start new profiles on the next unused colour.
  const colors = [...PROFILE_COLORS.slice(viewer.profiles.length % PROFILE_COLORS.length), ...PROFILE_COLORS.slice(0, viewer.profiles.length % PROFILE_COLORS.length)];

  return (
    <div className="mx-auto max-w-lg px-4 pt-28">
      <Link href="/profiles" className="text-sm text-muted hover:text-ink">
        ← Profiles
      </Link>
      <h1 className="mt-3 font-display text-6xl tracking-wide">Add profile</h1>
      <p className="mt-2 text-muted">Each profile gets its own watchlist and picker settings.</p>
      <div className="glass mt-8 rounded-3xl p-7">
        <ProfileForm colors={colors} />
      </div>
    </div>
  );
}
