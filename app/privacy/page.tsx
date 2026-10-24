import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

// Plain-language notice of what the code actually stores. Review it for your own situation;
// set CONTACT_EMAIL so people know who to ask.
export default function PrivacyPage() {
  const contact = process.env.CONTACT_EMAIL;
  return (
    <article className="mx-auto max-w-2xl px-4 pt-28 text-[15px] leading-relaxed text-ink/85 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="font-display text-6xl tracking-wide text-ink">Privacy</h1>
      <p className="mt-3 text-muted">What Reelpick stores, why, and how to remove it.</p>

      <h2>Without an account</h2>
      <p>
        You can use Reelpick without signing up. A watchlist or watched list you keep while signed out is saved only in your
        browser’s storage, on your device. We don’t use analytics, advertising or tracking cookies.
      </p>

      <h2>With an account</h2>
      <ul>
        <li>Your email address, to sign you in and send password-reset links.</li>
        <li>Your password, stored only as a salted scrypt hash; nobody can read it back.</li>
        <li>If you sign in with Google: your Google account ID and email. We don’t receive your Google password.</li>
        <li>Your profiles: names, colours and picker settings.</li>
        <li>Each profile’s watchlist and watched list.</li>
        <li>A sign-in cookie that keeps you signed in for up to 30 days. Only a hash of it is stored on our side.</li>
        <li>
          Failed sign-ins, sign-ups and reset requests are logged against your email and network address to stop password
          guessing. These records are deleted within a day.
        </li>
      </ul>

      <h2>Services involved</h2>
      <ul>
        <li>Vercel hosts the site and keeps standard request logs.</li>
        <li>Turso stores the account data listed above.</li>
        <li>Resend sends password-reset emails.</li>
        <li>Google handles “Continue with Google”, if you use it.</li>
        <li>
          Movie data and posters come from{" "}
          <a href="https://www.themoviedb.org/" className="underline underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
            TMDB
          </a>
          ; your browser loads poster images from TMDB’s servers. Trailers play from YouTube’s privacy-enhanced domain
          (youtube-nocookie.com) and only load when you open a title.
        </li>
      </ul>

      <h2>Removing your data</h2>
      <p>
        Delete your account from the{" "}
        <Link href="/account" className="underline underline-offset-2 hover:text-ink">
          account page
        </Link>
        . That immediately deletes your account, every profile, their lists, your sessions and any Google link. Signed-out
        lists can be cleared by clearing this site’s data in your browser.
      </p>

      {contact && (
        <>
          <h2>Questions</h2>
          <p>
            Email{" "}
            <a href={`mailto:${contact}`} className="underline underline-offset-2 hover:text-ink">
              {contact}
            </a>
            .
          </p>
        </>
      )}
    </article>
  );
}
