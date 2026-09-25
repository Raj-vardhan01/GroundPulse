import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { APPS_LIVE } from "@/lib/flags";
import { resetTarget } from "@/lib/auth";
import { AuthCard } from "../AuthCard";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function Reset({ searchParams }: PageProps<"/signin/reset">) {
  if (!APPS_LIVE) notFound();
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const user = token ? await resetTarget(token) : null;

  return (
    <AuthCard>
      {user ? (
        <>
          <h1 className="serif text-[clamp(1.8rem,4vw,2.2rem)] leading-[1.08] tracking-[-0.03em]">Choose a new password</h1>
          <p className="t-small mt-2">For <b className="text-ink">{user.email}</b>. Every other device signed in to this account will be signed out.</p>
          <ResetForm token={token} />
        </>
      ) : (
        <>
          <h1 className="serif text-[clamp(1.8rem,4vw,2.2rem)] leading-[1.08] tracking-[-0.03em]">That link has run out</h1>
          <p className="t-small mt-2">Links work for 30 minutes and only once. Ask for a fresh one — it takes a moment.</p>
          <Link href="/signin/forgot" className="btn btn-accent mt-6 w-full">Send a new link</Link>
        </>
      )}
    </AuthCard>
  );
}
