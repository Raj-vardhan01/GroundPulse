import { BadgeCheck, Ban, FileCheck2, Fingerprint, KeyRound, MapPinned, ShieldCheck, Star, UserCheck } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { cn } from "@/lib/cn";

const providers = [
  { n: "Suresh M.", init: "SM", t: "Plumbing", loc: "Malviya Nagar", r: "4.9", jobs: 212, ok: true },
  { n: "Nadeem A.", init: "NA", t: "Plumbing", loc: "Tonk Road", r: "4.7", jobs: 96, ok: true },
  { n: "R. Meena", init: "RM", t: "Plumbing", loc: "Sanganer", r: "—", jobs: 0, ok: false },
];
const audit = [
  ["13:41", "ISSUE_FLAGGED", "Ravi K. (inspector)"],
  ["16:22", "APPROVED", "Priya S. (owner)"],
  ["16:31", "PROVIDER_ASSIGNED", "Meera (admin)"],
  ["09:12", "IN_PROGRESS", "Suresh M. (provider)"],
  ["12:48", "COMPLETED", "Suresh M. (provider)"],
];

export function Trust() {
  return (
    <section className="section" aria-labelledby="trust-title">
      <div className="wrap">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHead title={<span id="trust-title">Only verified hands touch your home</span>} lede="Nobody walks in off the street. Every inspector is referred or scouted, vetted in person, and verified before their first visit — and the system itself refuses to assign anyone who isn't. Then every visit leaves a trail you can check." />
            <Reveal delay={0.15} className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { I: Fingerprint, t: "Aadhaar + police verification", b: "Government ID, address proof and a police-verification certificate before day one." },
                { I: UserCheck, t: "References & a trial visit", b: "Two references called. A supervised trial inspection before they go alone." },
                { I: KeyRound, t: "Visit starts with your OTP", b: "The checklist can't open until the OTP you (or your caretaker) share is entered at the door." },
                { I: MapPinned, t: "GPS + time-stamped, always", b: "Every photo carries location and time. You see when they arrived and when they left." },
                { I: BadgeCheck, t: "You know who's coming", b: "Name, photo and verified badge sent to you before the visit — no surprises at the door." },
                { I: Star, t: "Rated after every job", b: "Owners rate every visit. Drop below the bar and you quietly leave the network." },
                { I: FileCheck2, t: "Append-only audit log", b: "Who did what, when — on every issue and repair. Nobody can edit it." },
                { I: ShieldCheck, t: "Protected up to ₹1,00,000", b: "For the very, very rare case. One verified person, your OTP, every room on video — it almost never comes up. But if it ever does, we pay. Not you." },
              ].map(({ I, t, b }) => (
                <div key={t} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={16} /></span><div><div className="text-[15px] font-medium">{t}</div><div className="t-small mt-0.5">{b}</div></div></div>
              ))}
            </Reveal>
          </div>
          <div className="grid gap-4 lg:col-span-7">
            <Reveal>
              <div className="card shadow-card bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between"><span className="text-[14px] font-semibold">Assign a provider · Plumbing · Jaipur</span><span className="chip">Admin view</span></div>
                <ul className="mt-3 divide-y divide-line">
                  {providers.map((p) => (
                    <li key={p.n} className={cn("flex items-center gap-3 py-3.5", !p.ok && "opacity-60")}>
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-bold", p.ok ? "bg-accent text-white" : "bg-beige text-text-3")}>{p.init}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[14px] font-semibold">{p.n} {p.ok ? <BadgeCheck size={14} className="text-accent" /> : <Ban size={13} className="text-fail" />}</div>
                        <div className="t-small">{p.t} · {p.loc} · <span className="inline-flex items-center gap-0.5"><Star size={9} className="fill-warn text-warn" /> {p.r}</span>{p.jobs ? ` · ${p.jobs} jobs` : ""}</div>
                      </div>
                      {p.ok ? <span className="btn btn-accent h-9 px-4 text-[13px]">Assign</span> : <span className="rounded-full bg-fail-soft px-3 py-1.5 text-[11.5px] font-semibold text-fail">Not verified · blocked</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="card shadow-card bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between"><span className="text-[14px] font-semibold">Audit log · Issue #0917</span><span className="chip chip-accent">Append-only</span></div>
                <table className="mt-3 w-full text-[13px]">
                  <tbody>
                    {audit.map((r, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="py-2.5 pr-3 font-mono text-[12px] text-text-3">{r[0]}</td>
                        <td className={cn("py-2.5 pr-3 font-mono text-[12px]", r[1] === "COMPLETED" ? "text-[#157a44]" : "text-ink")}>{r[1]}</td>
                        <td className="py-2.5 text-right text-text-2">{r[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
