import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/** The small pages around signing in — forgot, reset, confirm — on one
    quiet card, with the way back always in reach. */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-paper px-6 py-8 sm:px-10">
      <div className="flex items-center justify-between">
        <Link href="/"><Logo size={34} /></Link>
        <Link href="/signin" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink">
          <ArrowLeft size={14} /> Sign in
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[420px] rounded-[22px] border border-line bg-white p-6 shadow-card sm:p-8">{children}</div>
      </div>
    </main>
  );
}

/** On a laptop no email is sent — the link is shown here instead, clearly
    marked, the way the SMS code is. Production never gets one. */
export function DevLink({ href }: { href: string }) {
  return (
    <p className="mt-4 rounded-[12px] border border-gold/40 bg-gold-soft px-4 py-3 text-[12.5px] leading-snug text-[#7a5209]">
      Development — no email is sent from a laptop.
      <a href={href} className="mt-1 block w-fit font-semibold underline underline-offset-2">Open the link →</a>
    </p>
  );
}
