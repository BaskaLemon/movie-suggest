"use client";

import { useActionState, useRef } from "react";
import { Field, fieldClass, primaryButton } from "./AuthForm";
import { changePassword, type FormState } from "@/app/actions/account";

export function PasswordForm() {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await changePassword(prev, fd);
    if (result.ok) form.current?.reset();
    return result;
  }, {});

  return (
    <form ref={form} action={action} className="space-y-5">
      <Field label="Current password">
        <input name="current" type="password" required autoComplete="current-password" className={fieldClass} />
      </Field>
      <Field label="New password">
        <input name="next" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} placeholder="At least 8 characters" />
      </Field>
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
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
