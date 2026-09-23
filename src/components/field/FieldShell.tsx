"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { BadgeCheck, ClipboardList, IndianRupee, LayoutGrid, LogOut, Star, UserRound } from "lucide-react";
import { Mark, Wordmark } from "@/components/ui/Logo";
import { doSignOut } from "@/lib/actions";
import { cn } from "@/lib/cn";

/* A work tool, not a brochure. Big targets, high contrast, four
   destinations and nothing else — this is read at a gate, one-handed,
   in the sun. */
const TABS = [
  { href: "/field", label: "Today", I: ClipboardList },
  { href: "/field/jobs", label: "Board", I: LayoutGrid },
  { href: "/field/earnings", label: "Earnings", I: IndianRupee },
  { href: "/field/record", label: "Me", I: UserRound },
] as const;

export function FieldShell({
  initials, rating, statusLabel, statusTone, children,
}: {
  initials: string; rating: number;
  statusLabel: string; statusTone: "pass" | "warn" | "fail" | "";
  children: React.ReactNode;
}) {
  const path = usePathname();
  const on = (href: string) => (href === "/field" ? path === "/field" : path.startsWith(href));

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur-md" style={{ paddingTop: "max(10px, env(safe-area-inset-top))" }}>
        <div className="mx-auto flex max-w-[760px] items-center gap-3 px-4 pb-2.5">
          <Link href="/field" className="flex items-center gap-2"><Mark size={26} /><Wordmark size={18} /></Link>
          <span className={cn("chip ml-auto shrink-0",
            statusTone === "pass" && "chip-pass", statusTone === "warn" && "chip-warn", statusTone === "fail" && "chip-fail")}>
            {statusLabel}
          </span>
          <Link href="/field/record" className="flex shrink-0 items-center gap-2 rounded-full bg-white px-2 py-1 shadow-card">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white">{initials}</span>
            <span className="flex items-center gap-1 pr-1 text-[12.5px] font-medium tabular-nums">
              <Star size={11} className="fill-gold text-gold" />{rating}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-[104px] pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-lg" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto grid max-w-[520px] grid-cols-4 px-2 pt-2">
          {TABS.map(({ href, label, I }) => (
            <Link key={href} href={href as Route} className={cn("grid place-items-center gap-1 rounded-[12px] py-1.5 transition", on(href) ? "text-accent" : "text-text-3")}>
              <I size={21} />
              <span className="text-[10.5px] font-semibold tracking-[-0.01em]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function SignOutRow({ name, phone }: { name: string; phone: string }) {
  return (
    <div className="card mt-4 border border-line bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 text-[14.5px] font-medium"><BadgeCheck size={15} className="text-accent" /> {name}</div>
      <div className="t-small mt-0.5 tabular-nums">+91 {phone.slice(0, 5)} {phone.slice(5)}</div>
      <form action={doSignOut}><button className="btn btn-white btn-sm mt-3 w-full"><LogOut size={14} /> Sign out</button></form>
    </div>
  );
}
