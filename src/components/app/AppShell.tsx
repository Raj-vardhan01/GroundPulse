"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, CalendarDays, CreditCard, FileText, Home, LifeBuoy, LogOut, Menu, Plus,
  Settings, ShieldCheck, Sparkles, X,
} from "lucide-react";
import { Mark, Wordmark } from "@/components/ui/Logo";
import { doSignOut, markAllRead } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import type { Event } from "@/lib/types";
import { relative } from "@/lib/format";
import { prettyPhone } from "@/lib/phone";

type Nav = { href: Route; label: string; I: typeof Home; badge?: number };

export function AppShell({
  user, unread, counts, children,
}: {
  user: { name: string; phone: string };
  unread: Event[];
  counts: { visits: number; reports: number; due: number };
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [bell, setBell] = useState(false);

  const main: Nav[] = [
    { href: "/app", label: "Home", I: Home },
    { href: "/app/properties", label: "Properties", I: ShieldCheck },
    { href: "/app/visits", label: "Visits", I: CalendarDays, badge: counts.visits },
    { href: "/app/reports", label: "Reports", I: FileText, badge: counts.reports },
  ];
  const secondary: Nav[] = [
    { href: "/app/plan", label: "Plan & cover", I: Sparkles },
    { href: "/app/billing", label: "Billing", I: CreditCard, badge: counts.due },
    { href: "/app/account", label: "Account", I: Settings },
    { href: "/app/help", label: "Help", I: LifeBuoy },
  ];

  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

  /* Navigating closes the drawer. Done at render rather than in an effect
     so there is no frame where the new page is under an open panel. */
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); if (bell) setBell(false); }

  return (
    <div className="app-scope min-h-dvh bg-paper lg:grid lg:grid-cols-[268px_1fr]">
      {/* ── desktop rail ─────────────────────────────────────── */}
      <aside className="on-dark sticky top-0 hidden h-dvh flex-col bg-accent px-4 py-6 lg:flex print:!hidden">
        <Link href="/app" className="mb-8 flex items-center gap-2.5 px-2">
          <Mark size={34} inverted />
          <Wordmark size={23} inverted />
        </Link>

        <Link href="/app/book" className="btn btn-accent mb-6 w-full bg-white text-accent shadow-none ring-0 hover:bg-white [box-shadow:inset_0_-3px_0_0_rgba(0,0,0,.12)]">
          <Plus size={16} /> Book a visit
        </Link>

        <nav className="flex-1 space-y-1">
          {main.map((n) => <RailLink key={n.href} n={n} on={active(n.href)} />)}
          <div className="my-4 h-px bg-white/12" />
          {secondary.map((n) => <RailLink key={n.href} n={n} on={active(n.href)} />)}
        </nav>

        <div className="mt-6 rounded-[16px] bg-white/[0.07] p-4">
          <div className="text-[13.5px] font-semibold">{user.name || "Your account"}</div>
          <div className="mt-0.5 text-[12px] text-white/55">{prettyPhone(user.phone)}</div>
          <form action={doSignOut}>
            <button className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white/70 transition hover:text-white">
              <LogOut size={13} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── content ──────────────────────────────────────────── */}
      <div className="flex min-h-dvh flex-col">
        {/* mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-paper/92 px-4 py-3 backdrop-blur-md lg:hidden print:hidden" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
          <Link href="/app" className="flex items-center gap-2"><Mark size={28} /><Wordmark size={19} /></Link>
          <button onClick={() => setBell(true)} aria-label="Notifications" className="relative ml-auto grid h-10 w-10 place-items-center rounded-full bg-white shadow-card">
            <Bell size={17} />
            {unread.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-fail ring-2 ring-white" />}
          </button>
        </header>

        {/* desktop top bar */}
        <header className="sticky top-0 z-40 hidden items-center gap-3 border-b border-line bg-paper/85 px-8 py-3.5 backdrop-blur-md lg:flex print:!hidden">
          <Breadcrumb path={path} />
          <button onClick={() => setBell(true)} className="relative ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-medium shadow-card transition hover:shadow-float">
            <Bell size={15} /> Activity
            {unread.length > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-fail px-1 text-[10.5px] font-bold text-white">{unread.length}</span>}
          </button>
        </header>

        <main className="flex-1 px-4 pb-[104px] pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7 print:p-0">
          <div className="mx-auto w-full max-w-[1120px]">{children}</div>
        </main>

        {/* mobile tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/94 backdrop-blur-lg lg:hidden print:hidden" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto grid max-w-[520px] grid-cols-5 items-end px-2 pt-2">
            <Tab href="/app" label="Home" I={Home} on={active("/app")} />
            <Tab href="/app/visits" label="Visits" I={CalendarDays} on={active("/app/visits")} badge={counts.visits} />
            <Link href="/app/book" aria-label="Book a visit" className="grid place-items-center">
              <span className="grid h-12 w-12 -translate-y-1.5 place-items-center rounded-full bg-accent text-white shadow-float"><Plus size={21} /></span>
            </Link>
            <Tab href="/app/reports" label="Reports" I={FileText} on={active("/app/reports")} badge={counts.reports} />
            {/* Everything that is not a tab lives behind this one: properties,
                plan, billing, activity, help, account. */}
            <Tab href="/app/account" label="More" I={Menu} on={["/app/account", "/app/properties", "/app/plan", "/app/billing", "/app/activity", "/app/help"].some((h) => active(h))} />
          </div>
        </nav>
      </div>

      {/* ── activity drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {bell && (
          <>
            <motion.button key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBell(false)} aria-label="Close" className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[2px]" />
            <motion.aside
              key="panel"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: EASE }}
              className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[400px] flex-col bg-paper shadow-float"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
                <div>
                  <div className="text-[16px] font-semibold">Activity</div>
                  <div className="t-small">{unread.length ? `${unread.length} new` : "Everything is read"}</div>
                </div>
                <div className="flex items-center gap-2">
                  {unread.length > 0 && (
                    <form action={markAllRead}><button className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-text-2 transition hover:bg-beige">Mark read</button></form>
                  )}
                  <button onClick={() => setBell(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-card"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                {unread.length === 0 && <p className="t-small px-1 py-6 text-center">Nothing waiting. We will tell you the moment an inspector is on the way, or a report lands.</p>}
                <ul className="grid gap-2">
                  {unread.map((e) => (
                    <li key={e.id}>
                      <Link href={e.href as Route} onClick={() => setBell(false)} className={cn("block rounded-[14px] border border-line bg-white p-4 transition hover:shadow-card", e.action && "border-accent/30 bg-accent-tint")}>
                        <div className="flex items-start gap-2">
                          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", e.action ? "bg-accent" : "bg-gold")} />
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold leading-snug">{e.title}</div>
                            <div className="t-small mt-0.5 leading-snug">{e.body}</div>
                            <div className="mt-1.5 text-[11.5px] text-text-3">{relative(e.at)}</div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/app/activity" onClick={() => setBell(false)} className="btn btn-white btn-sm mt-3 w-full">See everything</Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function RailLink({ n, on }: { n: Nav; on: boolean }) {
  return (
    <Link href={n.href} className={cn("flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14.5px] font-medium transition", on ? "bg-white/[0.14] text-white" : "text-white/70 hover:bg-white/[0.07] hover:text-white")}>
      <n.I size={17} />
      {n.label}
      {!!n.badge && <span className="ml-auto grid h-[20px] min-w-[20px] place-items-center rounded-full bg-white/18 px-1 text-[11px] font-semibold text-white">{n.badge}</span>}
    </Link>
  );
}

function Tab({ href, label, I, on, badge }: { href: Route; label: string; I: typeof Home; on: boolean; badge?: number }) {
  return (
    <Link href={href} className={cn("relative grid place-items-center gap-1 rounded-[12px] py-1.5 transition", on ? "text-accent" : "text-text-3")}>
      <span className="relative"><I size={20} />{!!badge && <span className="absolute -right-1.5 -top-1 h-[7px] w-[7px] rounded-full bg-fail ring-2 ring-white" />}</span>
      <span className="text-[10.5px] font-semibold tracking-[-0.01em]">{label}</span>
    </Link>
  );
}

const CRUMBS: Record<string, string> = {
  "/app": "Home", "/app/properties": "Properties", "/app/visits": "Visits", "/app/reports": "Reports",
  "/app/book": "Book a visit", "/app/plan": "Plan & cover", "/app/billing": "Billing",
  "/app/account": "Account", "/app/activity": "Activity", "/app/help": "Help",
};
function Breadcrumb({ path }: { path: string }) {
  const key = Object.keys(CRUMBS).filter((k) => (k === "/app" ? path === "/app" : path.startsWith(k))).sort((a, b) => b.length - a.length)[0];
  return <span className="text-[14px] font-medium text-text-2">{CRUMBS[key] ?? "Home"}</span>;
}
