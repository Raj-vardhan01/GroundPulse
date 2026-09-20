import type { Metadata } from "next";
import { Activity, Database, Lock, Radio, Server, Workflow } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { FeatureRow } from "@/components/shared/FeatureRow";
import { SectionHead } from "@/components/shared/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { AdminMock, InspectorJobsMock, OwnerDashMock, ProviderJobsMock } from "@/components/shared/Mocks";
import { Trust } from "@/components/home/Trust";
import { CTA } from "@/components/home/CTA";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "Four roles, one audit trail. Owners schedule and approve, inspectors walk the checklist, providers quote, admin verifies — every photo GPS- and time-stamped, every decision written to a log nobody can edit.",
  alternates: { canonical: "/platform" },
  openGraph: { title: "Platform · StillYours", description: "Four roles, one audit trail. Owners schedule and approve, inspectors walk the checklist, providers quote, admin verifies — every photo GPS- and time-stamped, every decision written to a log nobody can edit.", url: "/platform" },
};

const seats = [
  { r: "Owner", c: "bg-accent text-white", b: "Registers properties, schedules inspections, reads reports, approves or declines every repair." },
  { r: "Inspector", c: "bg-ink text-white", b: "Sees assigned jobs, walks the checklist, attaches media, flags issues, submits." },
  { r: "Admin", c: "bg-beige-2 text-ink", b: "Live counts, verification queue, provider assignment, manual reassignment." },
  { r: "Provider", c: "bg-white text-ink border border-line", b: "Accepts approved jobs, completes them with a note and after-photos." },
];
const stack = [
  { I: Workflow, k: "Web", v: "Next.js · React · TypeScript", n: "App Router with role-scoped route groups; TanStack Query + Zustand" },
  { I: Server, k: "API", v: "NestJS · CASL guards · JWT", n: "Role-based access enforced on every controller, not hidden in the UI" },
  { I: Database, k: "Data", v: "PostgreSQL · Prisma", n: "8 related entities, ACID transactions, versioned migrations" },
  { I: Activity, k: "Async", v: "Redis · BullMQ", n: "Report generation and notification fan-out off the request path" },
  { I: Radio, k: "Live", v: "Socket.IO", n: "repair.status.updated · issue.flagged · report.ready — push, not polling" },
  { I: Lock, k: "Media", v: "S3 · CloudFront", n: "Signed, expiring URLs; Postgres stores only the pointer" },
];
const next = ["Provider ratings", "In-app thread per issue", "Cost estimates before approval", "Calendar sync", "Document vault (deeds, insurance)", "Custom checklist templates", "AI damage detection (YOLOv8) · v2"];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="The platform" title={<>One platform.<br className="hidden md:block" /> Four seats.</>} lede="Owner, inspector, admin and provider all work inside the same record — each seeing only what their role should. Not hidden in the interface. Enforced by the server." />

      <section className="wrap mt-6 grid gap-3 sm:grid-cols-2 md:mt-8 lg:grid-cols-4">
        {seats.map((s, i) => (
          <Reveal key={s.r} delay={i * 0.05}><div className={cn("card h-full p-6", s.c)}><div className="flex items-center justify-between"><span className="text-[20px] font-bold tracking-[-0.03em]">{s.r}</span><span className="text-[11px] font-semibold opacity-60">SEAT 0{i + 1}</span></div><p className={cn("mt-3 text-[14.5px] leading-relaxed", s.c.includes("text-white") ? "text-white/75" : "text-text-2")}>{s.b}</p></div></Reveal>
        ))}
      </section>

      <section className="section">
        <div className="wrap grid gap-14 md:gap-20">
          <FeatureRow k="Owner" title="Portfolio at a glance, detail on tap." body="Health score rings, last inspection dates and open-issue counts on every property card. Inside: the timeline, the latest report and anything waiting on you." bullets={["Skeleton loading, clear empty states", "Real-time status pills via Socket.IO", "Works on a phone — the owner is usually on one"]}><div className="mx-auto max-w-[440px]"><OwnerDashMock /></div></FeatureRow>
          <FeatureRow k="Admin" title="Everything, live, in one place." body="Active properties, pending inspections, open issues and repairs in progress — always accurate to the underlying data. Click a count to drill into the filtered table. Verify people. Reassign when needed." flip bullets={["Verification queue for inspectors and providers", "Manual reassignment when someone drops out", "Designed for multiple admin seats from day one"]}><div className="mx-auto max-w-[520px]"><AdminMock /></div></FeatureRow>
          <FeatureRow k="Inspector & provider" title="Two focused apps for people on the move." body="Inspectors get today's jobs and a checklist that saves itself. Providers get approved jobs, accept or decline, and mark complete with a required note." bullets={["Mobile-web first, 44px touch targets", "Local-first optimistic UI on the checklist", "No feature more than two taps from home"]}><div className="grid gap-3 sm:grid-cols-2"><InspectorJobsMock /><ProviderJobsMock /></div></FeatureRow>
        </div>
      </section>

      <section className="section bg-white">
        <div className="wrap">
          <SectionHead eyebrow="Under the hood" title="Built like production, not like a demo." lede="Server-enforced roles. A normalised relational schema. Async jobs off the request path. Real-time push instead of polling. And a queue boundary ready for machine-learning damage detection — without a re-architecture." />
          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {stack.map(({ I, k, v, n }, i) => (
              <Reveal key={k} delay={i * 0.04}><div className="card h-full border border-line bg-paper p-5"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-full bg-white text-accent shadow-card"><I size={16} /></span><span className="t-label">{k}</span></div><div className="mt-4 text-[15.5px] font-semibold">{v}</div><div className="t-small mt-1">{n}</div></div></Reveal>
            ))}
          </div>
          <Reveal className="mt-8 flex flex-col gap-3 rounded-[20px] border border-line bg-paper p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="t-label shrink-0">Also</span>
            <div className="flex flex-wrap gap-2">{["Jest", "Supertest", "Playwright", "GitHub Actions CI", "Docker", "Sentry", "Pino logs", "Bull Board"].map((t) => <span key={t} className="chip">{t}</span>)}</div>
          </Reveal>
          <Reveal className="mt-4 flex flex-col gap-3 rounded-[20px] border border-line bg-paper p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="t-label shrink-0">Next up</span>
            <div className="flex flex-wrap gap-2">{next.map((n) => <span key={n} className={cn("rounded-full border border-line-2 bg-white px-3 py-1.5 text-[12.5px] font-medium", n.includes("YOLO") && "border-accent text-accent-2")}>{n}</span>)}</div>
          </Reveal>
        </div>
      </section>

      <Trust />
      <CTA />
    </>
  );
}
