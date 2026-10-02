"use client";

import { Check, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Avatar } from "./Avatar";
import { Field, fieldClass, primaryButton } from "./AuthForm";
import { createProfile, deleteProfile, updateProfile, type FormState } from "@/app/actions/account";
import type { PickMedia } from "@/lib/types";

type Props = {
  colors: string[];
  profile?: { id: string; name: string; color: string; defaultMedia: PickMedia };
  canDelete?: boolean;
};

const MEDIA: { id: PickMedia; label: string }[] = [
  { id: "all", label: "Both" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "Series" },
];

export function ProfileForm({ colors, profile, canDelete = false }: Props) {
  const editing = Boolean(profile);
  const [state, action, pending] = useActionState<FormState, FormData>(editing ? updateProfile : createProfile, {});
  const [name, setName] = useState(profile?.name ?? "");
  const [color, setColor] = useState(profile?.color ?? colors[0]);
  const [media, setMedia] = useState<PickMedia>(profile?.defaultMedia ?? "all");

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-7">
        {profile && <input type="hidden" name="id" value={profile.id} />}
        <input type="hidden" name="color" value={color} />
        <input type="hidden" name="defaultMedia" value={media} />

        <div className="flex items-center gap-5">
          <Avatar name={name || "?"} color={color} size={84} className="rounded-2xl" />
          <div className="min-w-0 flex-1">
            <Field label="Profile name">
              <input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={20} className={fieldClass} placeholder="Name" />
            </Field>
          </div>
        </div>

        <fieldset>
          <legend className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted">Colour</legend>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Colour ${c}`}
                aria-pressed={c === color}
                className={`grid size-10 place-items-center rounded-xl transition ${c === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e1330]" : "hover:scale-105"}`}
                style={{ background: c }}
              >
                {c === color && <Check size={18} className="text-white" />}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted">Picker starts on</legend>
          <p className="mb-3 text-sm text-muted">What “Pick for me” rolls by default for this profile.</p>
          <div className="inline-flex rounded-full border border-line bg-white/[0.04] p-1">
            {MEDIA.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={media === m.id}
                onClick={() => setMedia(m.id)}
                className={`h-9 rounded-full px-5 text-sm font-medium transition ${media === m.id ? "bg-accent text-accent-ink" : "text-ink/75 hover:text-ink"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

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
          {pending ? "Saving…" : editing ? "Save changes" : "Create profile"}
        </button>
      </form>

      {profile && canDelete && (
        <form
          action={deleteProfile.bind(null, profile.id)}
          onSubmit={(e) => {
            if (!confirm(`Delete ${profile.name}? Their watchlist on this device stays in browser storage but won't be shown.`)) e.preventDefault();
          }}
        >
          <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-hot/40 text-sm font-medium text-[#ff9cbf] transition hover:bg-hot/10">
            <Trash2 size={16} /> Delete profile
          </button>
        </form>
      )}
    </div>
  );
}
