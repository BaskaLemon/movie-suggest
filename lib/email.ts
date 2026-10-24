// Sends mail through Resend's HTTP API (https://resend.com). Without RESEND_API_KEY nothing is
// sent: in development the message is printed to the server console so flows can still be tested.

type Email = { to: string; subject: string; text: string; html: string };

export const emailConfigured = Boolean(process.env.RESEND_API_KEY);

export async function sendEmail(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email] RESEND_API_KEY not set; would send to ${email.to}:\n${email.subject}\n\n${email.text}`);
    } else {
      console.error("[email] RESEND_API_KEY is not set; can't send:", email.subject);
    }
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // onboarding@resend.dev works without a verified domain, but only delivers to the
      // Resend account's own address. Set EMAIL_FROM to an address on a verified domain.
      from: process.env.EMAIL_FROM || "Reelpick <onboarding@resend.dev>",
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error(`[email] Resend returned ${res.status}: ${await res.text().catch(() => "")}`);
    return false;
  }
  return true;
}
