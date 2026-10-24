"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, fieldClass, primaryButton } from "./AuthForm";
import { requestPasswordReset, resetPassword, type FormState } from "@/app/actions/account";

function Card({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[80svh] place-items-center px-4 pt-24">
      <div className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide">{title}</h1>
        <p className="mt-2 text-sm text-muted">{intro}</p>
        {children}
      </div>
    </div>
  );
}

function Messages({ state }: { state: FormState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded-xl bg-hot/15 px-4 py-3 text-sm text-[#ffb3cd]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl bg-teal/15 px-4 py-3 text-sm text-teal">
          {state.ok}
        </p>
      )}
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  const [email, setEmail] = useState("");
  return (
    <Card eyebrow="Locked out?" title="Reset password" intro="Enter your account’s email and we’ll send a link to set a new password.">
      <form action={action} className="mt-8 space-y-5">
        <Field label="Email">
          <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={fieldClass} placeholder="you@example.com" />
        </Field>
        <Messages state={state} />
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  return (
    <Card eyebrow="Almost there" title="New password" intro="Choose a new password. Every device signed in to this account will be signed out.">
      <form action={action} className="mt-8 space-y-5">
        <input type="hidden" name="token" value={token} />
        <Field label="New password">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} placeholder="At least 8 characters" />
        </Field>
        <Messages state={state} />
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Set password and sign in"}
        </button>
      </form>
      {state.error && (
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/forgot-password" className="font-medium text-accent hover:underline">
            Request a new link
          </Link>
        </p>
      )}
    </Card>
  );
}
