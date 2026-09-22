import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, KeyRound, Timer } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { currentUser } from "@/lib/auth";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Open your StillYours account — reports, visits and decisions for every property you own in India.",
  robots: { index: false, follow: true },
};

const points = [
  { I: BadgeCheck, t: "Every visit, on the record", b: "Photo and video of every room, time-stamped, with the inspector's name on it." },
  { I: KeyRound, t: "Nothing happens without you", b: "No repair is ever started until you have approved it, from wherever you are." },
  { I: Timer, t: "The report, within the hour", b: "Not a WhatsApp forward. A proper report you can open at 2 AM and act on." },
];

export default async function Page() {
  if (await currentUser()) redirect("/app");

  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* the promise, kept in view while they sign in */}
      <section className="on-dark relative hidden flex-col justify-between overflow-hidden bg-accent p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-32 -left-20 h-[380px] w-[380px] rounded-full bg-white/[0.03]" />
        <Link href="/" className="relative"><Logo inverted size={40} /></Link>
        <div className="relative max-w-[42ch]">
          <h2 className="serif text-[clamp(2.2rem,3vw,3rem)] leading-[1.06] tracking-[-0.035em]">Far away.<br />Still yours.</h2>
          <ul className="mt-10 grid gap-6">
            {points.map(({ I, t, b }) => (
              <li key={t} className="flex gap-4">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10"><I size={17} /></span>
                <div><div className="text-[15.5px] font-semibold">{t}</div><p className="mt-1 text-[14px] leading-relaxed text-white/70">{b}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[13px] text-white/45">Bengaluru · police-verified inspectors · your media stays private</p>
      </section>

      {/* the form */}
      <section className="flex min-h-dvh flex-col bg-paper px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden"><Logo size={34} /></Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink">
            <ArrowLeft size={14} /> Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <SignInForm />
        </div>
        <p className="t-small text-center">
          New here? Signing in with your number creates your account. By continuing you agree to how we handle your property media — private, never resold.
        </p>
      </section>
    </main>
  );
}
