import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleAlert } from "lucide-react";
import { APPS_LIVE } from "@/lib/flags";
import { confirmEmail } from "@/lib/auth";
import { AuthCard } from "../AuthCard";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false, follow: false } };

export default async function Verify({ searchParams }: PageProps<"/signin/verify">) {
  if (!APPS_LIVE) notFound();
  const sp = await searchParams;
  const ok = typeof sp.token === "string" && (await confirmEmail(sp.token));

  return (
    <AuthCard>
      <span className={ok ? "grid h-12 w-12 place-items-center rounded-full bg-pass-soft text-pass" : "grid h-12 w-12 place-items-center rounded-full bg-warn-soft text-warn"}>
        {ok ? <CircleCheck size={22} /> : <CircleAlert size={22} />}
      </span>
      <h1 className="serif mt-4 text-[clamp(1.8rem,4vw,2.2rem)] leading-[1.08] tracking-[-0.03em]">{ok ? "Email confirmed." : "That link did not work."}</h1>
      <p className="t-small mt-2">
        {ok
          ? "Thank you. Your reports and bills go to this address, and it is how you get back in if you ever forget your password."
          : "It may have expired, or the email on the account has changed since. Send a fresh one from your account page."}
      </p>
      <Link href={ok ? "/app" : "/app/account"} className="btn btn-accent mt-6 w-full">{ok ? "Go to my properties" : "Open my account"}</Link>
    </AuthCard>
  );
}
