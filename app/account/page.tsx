import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/account";
import { Avatar } from "@/components/Avatar";
import { PasswordForm } from "@/components/PasswordForm";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-28">
      <h1 className="font-display text-6xl tracking-wide">Account</h1>

      <section className="glass rounded-3xl p-7">
        <h2 className="text-xl font-semibold">Sign-in email</h2>
        <p className="mt-1 text-muted">{viewer.email}</p>
      </section>

      <section className="glass rounded-3xl p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Profiles</h2>
          <Link href="/profiles?manage=1" className="text-sm font-medium text-accent hover:underline">
            Manage
          </Link>
        </div>
        <ul className="mt-5 flex flex-wrap gap-5">
          {viewer.profiles.map((p) => (
            <li key={p.id}>
              <Link href={`/profiles/${p.id}`} className="flex flex-col items-center gap-2 text-sm text-ink/80 hover:text-ink">
                <Avatar name={p.name} color={p.color} size={56} className="rounded-2xl" />
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-3xl p-7">
        <h2 className="mb-6 text-xl font-semibold">Change password</h2>
        <PasswordForm />
      </section>

      <form action={signOut}>
        <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-sm font-medium text-ink/85 transition hover:bg-white/5 hover:text-ink">
          <LogOut size={18} /> Sign out
        </button>
      </form>
    </div>
  );
}
