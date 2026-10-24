import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/PasswordResetForms";

export const metadata: Metadata = { title: "New password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const token = (await searchParams).token;
  if (typeof token !== "string" || !token) redirect("/forgot-password");
  return <ResetPasswordForm token={token} />;
}
