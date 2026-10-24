import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";
import { GOOGLE_ERRORS, googleEnabled } from "@/lib/google";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  if (await getViewer()) redirect("/profiles");
  const error = (await searchParams).error;
  return <AuthForm mode="signup" googleEnabled={googleEnabled} notice={typeof error === "string" ? GOOGLE_ERRORS[error] : undefined} />;
}
