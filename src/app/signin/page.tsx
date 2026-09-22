import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarCheck, IndianRupee, KeyRound, LogOut, MapPinned, Timer } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { currentUser } from "@/lib/auth";
import { switchAccount } from "@/lib/actions";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Open your StillYours account — reports, visits and decisions for every property you own in India.",
  robots: { index: false, follow: true },
};

/* One sign-in, two audiences. An inspector arriving from /network should
   not be read a list of owner promises — same form, their own words. */
const PANELS = {
  owner: {
    title: <>Far away.<br />Still yours.</>,
    points: [
      { I: BadgeCheck, t: "Every visit, on the record", b: "Photo and video of every room, time-stamped, with the inspector's name on it." },
      { I: KeyRound, t: "Nothing happens without you", b: "No repair is ever started until you have approved it, from wherever you are." },
      { I: Timer, t: "The report, within the hour", b: "Not a WhatsApp forward. A proper report you can open at 2 AM and act on." },
    ],
    foot: "Bengaluru · verified inspectors · your media stays private",
  },
  inspector: {
    title: <>Your jobs,<br />in one place.</>,
    points: [
      { I: MapPinned, t: "The board, nearest first", b: "Every open job in your city, sorted from where you start your day." },
      { I: CalendarCheck, t: "One job at a time", b: "Claim it, walk it, submit it. Then the board comes back." },
      { I: IndianRupee, t: "What it pays, before you take it", b: "The rate is on the job, not a surprise at the end of the week." },
    ],
    foot: "Same number you applied with · settled weekly",
  },
} as const;

export default async function Page({ searchParams }: PageProps<"/signin">) {
  const user = await currentUser();
  const sp = await searchParams;
  const wants = sp.as === "inspector" ? "inspector" : "owner";
  const panel = PANELS[wants];
  /* Somebody already signed in is not necessarily in the wrong place —
     they may have come here to switch. Bouncing them silently is what
     made an inspector link look like it opened the owner app. */
  const home = user?.role === "inspector" ? "/field" : "/app";
  const mismatch = !!user && ((wants === "inspector") !== (user.role === "inspector"));

  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* the promise, kept in view while they sign in */}
      <section className="on-dark relative hidden flex-col justify-between overflow-hidden bg-accent p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-32 -left-20 h-[380px] w-[380px] rounded-full bg-white/[0.03]" />
        <Link href="/" className="relative"><Logo inverted size={40} /></Link>
        <div className="relative max-w-[42ch]">
          <h2 className="serif text-[clamp(2.2rem,3vw,3rem)] leading-[1.06] tracking-[-0.035em]">{panel.title}</h2>
          <ul className="mt-10 grid gap-6">
            {panel.points.map(({ I, t, b }) => (
              <li key={t} className="flex gap-4">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10"><I size={17} /></span>
                <div><div className="text-[15.5px] font-semibold">{t}</div><p className="mt-1 text-[14px] leading-relaxed text-white/70">{b}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[13px] text-white/45">{panel.foot}</p>
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
          {user ? (
            <div className="w-full max-w-[400px]">
              <h1 className="serif text-[clamp(2rem,4vw,2.6rem)] leading-[1.05] tracking-[-0.035em]">
                {mismatch ? "That is a different account." : "You are already signed in."}
              </h1>
              <p className="t-small mt-2.5">
                This browser is signed in as <b className="text-ink">{user.name || "your account"}</b> ·{" "}
                {user.role === "inspector" ? "inspector" : "owner"} · +91 {user.phone.slice(0, 5)} {user.phone.slice(5)}.
                {mismatch && wants === "inspector" && " The inspector app needs the number you applied with."}
                {mismatch && wants === "owner" && " Your properties are on a different number."}
              </p>

              <Link href={home as Route} className="btn btn-accent mt-7 w-full">
                {user.role === "inspector" ? "Go to my jobs" : "Go to my properties"} <ArrowRight size={16} />
              </Link>

              <form action={switchAccount} className="mt-3">
                <input type="hidden" name="as" value={wants} />
                <button className="btn btn-white w-full">
                  <LogOut size={15} /> Sign in as somebody else
                </button>
              </form>

              <p className="t-small mt-4 text-center leading-snug">
                One number, one account. Signing in as somebody else ends this session on this device — nothing on either account changes.
              </p>
            </div>
          ) : (
            <SignInForm />
          )}
        </div>
        <p className="t-small text-center">
          New here? Signing in with your number creates your account. By continuing you agree to how we handle your property media — private, never resold.
          <br />
          <span className="text-text-3">Inspectors use this same page — your number takes you straight to your jobs.</span>
        </p>
      </section>
    </main>
  );
}
