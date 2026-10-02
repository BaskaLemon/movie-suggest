import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { PROFILE_COLORS, getViewer } from "@/lib/auth";
import { asPickMedia } from "@/lib/types";

export const metadata: Metadata = { title: "Profile settings" };

export default async function EditProfilePage({ params }: PageProps<"/profiles/[id]">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { id } = await params;
  const profile = viewer.profiles.find((p) => p.id === id);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 pt-28">
      <Link href="/profiles?manage=1" className="text-sm text-muted hover:text-ink">
        ← Manage profiles
      </Link>
      <h1 className="mt-3 font-display text-6xl tracking-wide">Profile settings</h1>
      <div className="glass mt-8 rounded-3xl p-7">
        <ProfileForm
          key={profile.id}
          colors={PROFILE_COLORS}
          profile={{ id: profile.id, name: profile.name, color: profile.color, defaultMedia: asPickMedia(profile.defaultMedia) }}
          canDelete={viewer.profiles.length > 1}
        />
      </div>
    </div>
  );
}
