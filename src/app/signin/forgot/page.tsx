import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APPS_LIVE } from "@/lib/flags";
import { AuthCard } from "../AuthCard";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function Forgot() {
  if (!APPS_LIVE) notFound();
  return (
    <AuthCard>
      <h1 className="serif text-[clamp(1.8rem,4vw,2.2rem)] leading-[1.08] tracking-[-0.03em]">Forgot your password?</h1>
      <p className="t-small mt-2">Give us the email you signed up with and we will send a link to choose a new one. Joined with Google? This sets a password for that account too.</p>
      <ForgotForm />
    </AuthCard>
  );
}
