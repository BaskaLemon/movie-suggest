import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";
import { GOOGLE_ERRORS, googleEnabled } from "@/lib/google";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getViewer()) redirect("/profiles");
  const error = (await searchParams).error;
  return <AuthForm mode="login" googleEnabled={googleEnabled} notice={typeof error === "string" ? GOOGLE_ERRORS[error] : undefined} />;
}
