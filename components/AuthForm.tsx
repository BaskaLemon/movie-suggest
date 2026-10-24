"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type FormState } from "@/app/actions/account";

export const fieldClass =
  "h-12 w-full rounded-xl border border-line bg-white/5 px-4 text-sm text-ink placeholder:text-muted transition focus:border-accent/60 focus:bg-white/10 focus:outline-none";
export const primaryButton =
  "inline-flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink shadow-[0_10px_30px_-8px_rgba(25,181,254,0.7)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-muted">{label}</span>
      {children}
    </label>
  );
}

export function AuthForm({ mode, googleEnabled = false, notice }: { mode: "login" | "signup"; googleEnabled?: boolean; notice?: string }) {
  const signup = mode === "signup";
  const [state, action, pending] = useActionState<FormState, FormData>(signup ? signUp : signIn, {});
  // Controlled so a failed attempt doesn't clear them (React resets uncontrolled fields after an action).
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="grid min-h-[80svh] place-items-center px-4 pt-24">
      <div className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{signup ? "Join Reelpick" : "Welcome back"}</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide">{signup ? "Create account" : "Sign in"}</h1>
        <p className="mt-2 text-sm text-muted">
          {signup ? "Profiles, settings and a watchlist per person." : "Pick up where you left off."}
        </p>

        {notice && (
          <p role="alert" className="mt-6 rounded-xl bg-hot/15 px-4 py-3 text-sm text-[#ffb3cd]">
            {notice}
          </p>
        )}

        {googleEnabled && (
          <>
            {/* A plain link: the route handler starts the OAuth redirect. */}
            <a
              href="/auth/google"
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-sm font-semibold text-[#1f1f1f] transition hover:bg-white/90"
            >
              <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Continue with Google
            </a>
            <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <form action={action} className={`${googleEnabled ? "mt-6" : "mt-8"} space-y-5`}>
          {signup && (
            <Field label="Your name">
              <input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={20} autoComplete="nickname" className={fieldClass} placeholder="Alex" />
            </Field>
          )}
          <Field label="Email">
            <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={fieldClass} placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <input
              name="password"
              type="password"
              required
              minLength={signup ? 8 : undefined}
              autoComplete={signup ? "new-password" : "current-password"}
              className={fieldClass}
              placeholder={signup ? "At least 8 characters" : ""}
            />
          </Field>
          {!signup && (
            <p className="-mt-2 text-right text-sm">
              <Link href="/forgot-password" className="text-muted hover:text-accent">
                Forgot password?
              </Link>
            </p>
          )}
          {state.error && (
            <p role="alert" className="rounded-xl bg-hot/15 px-4 py-3 text-sm text-[#ffb3cd]">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "One moment…" : signup ? "Create account" : "Sign in"}
          </button>
          {signup && (
            <p className="text-center text-xs text-muted">
              By creating an account you agree to how we handle your data in the{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                privacy notice
              </Link>
              .
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {signup ? "Already have an account? " : "New here? "}
          <Link href={signup ? "/login" : "/signup"} className="font-medium text-accent hover:underline">
            {signup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
