import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/account";
import { Avatar } from "@/components/Avatar";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { PasswordForm } from "@/components/PasswordForm";
import { getViewer } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: viewer.userId },
    select: { passwordHash: true, oauthAccounts: { select: { provider: true } } },
  });
  const hasPassword = Boolean(user?.passwordHash);
  const viaGoogle = Boolean(user?.oauthAccounts.some((a) => a.provider === "google"));

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-28">
      <h1 className="font-display text-6xl tracking-wide">Account</h1>

      <section className="glass rounded-3xl p-7">
        <h2 className="text-xl font-semibold">Sign-in</h2>
        <p className="mt-1 text-muted">{viewer.email}</p>
        <p className="mt-1 text-sm text-muted">
          {[hasPassword && "Email and password", viaGoogle && "Google"].filter(Boolean).join(" · ")}
        </p>
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
        <h2 className="mb-1 text-xl font-semibold">{hasPassword ? "Change password" : "Set a password"}</h2>
        {!hasPassword && <p className="mb-5 text-sm text-muted">You sign in with Google. Add a password to also sign in with your email.</p>}
        <div className={hasPassword ? "mt-5" : ""}>
          <PasswordForm hasPassword={hasPassword} />
        </div>
      </section>

      <section className="glass rounded-3xl border-hot/20 p-7">
        <h2 className="mb-1 text-xl font-semibold">Delete account</h2>
        <p className="mb-5 text-sm text-muted">
          Removes your data from Reelpick. See the{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            privacy notice
          </Link>{" "}
          for what we keep.
        </p>
        <DeleteAccountForm email={viewer.email} hasPassword={hasPassword} />
      </section>

      <form action={signOut}>
        <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-sm font-medium text-ink/85 transition hover:bg-white/5 hover:text-ink">
          <LogOut size={18} /> Sign out
        </button>
      </form>
    </div>
  );
}
