"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, fieldClass } from "./AuthForm";
import { deleteAccount, type FormState } from "@/app/actions/account";

export function DeleteAccountForm({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-hot/40 px-5 text-sm font-medium text-[#ff9cbf] transition hover:bg-hot/10"
      >
        <Trash2 size={16} /> Delete account…
      </button>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <p className="text-sm text-ink/80">
        This permanently deletes your account, every profile, and their watchlists and watched lists. It can’t be undone.
      </p>
      <Field label={`Type ${email} to confirm`}>
        <input name="confirmEmail" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={fieldClass} />
      </Field>
      {hasPassword && (
        <Field label="Password">
          <input name="password" type="password" required autoComplete="current-password" className={fieldClass} />
        </Field>
      )}
      {state.error && (
        <p role="alert" className="rounded-xl bg-hot/15 px-4 py-3 text-sm text-[#ffb3cd]">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || typed.trim().toLowerCase() !== email}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-hot px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          <Trash2 size={16} /> {pending ? "Deleting…" : "Delete my account"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full px-5 text-sm text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
