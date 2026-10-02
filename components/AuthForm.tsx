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

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
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

        <form action={action} className="mt-8 space-y-5">
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
          {state.error && (
            <p role="alert" className="rounded-xl bg-hot/15 px-4 py-3 text-sm text-[#ffb3cd]">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "One moment…" : signup ? "Create account" : "Sign in"}
          </button>
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
