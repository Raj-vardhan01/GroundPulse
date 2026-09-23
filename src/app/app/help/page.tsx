import Link from "next/link";
import { ArrowUpRight, BadgeCheck, KeyRound, Mail, MessageSquare, ShieldAlert } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { PageHead, Panel, PanelHead } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { faqs } from "@/lib/faq";
import { site } from "@/lib/site";

export const metadata = { title: "Help" };

/* The questions an owner actually asks once they are inside, not the ones
   a visitor asks before buying. */
const PICKED = [
  "How do I know the inspector actually checked every room?",
  "Can a repair happen without my approval?",
  "Where are my photos stored?",
  "How quickly do I get the report?",
  "How do I know I can trust the inspector?",
  "Who is there when the cleaning or repair happens?",
  "How do you make money on repairs?",
  "What exactly does the Care+ cover include?",
];

export default async function Page() {
  await requireOwner();
  const picked = PICKED.map((q) => faqs.find((f) => f.q === q)).filter(Boolean) as typeof faqs;

  return (
    <>
      <PageHead eyebrow="Help" title="How this works" lede="The short answers. If yours is not here, write to us — a person replies, usually the same day." />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Reveal>
          <Panel>
            <PanelHead title="Common questions" meta={`${picked.length} answers`} />
            <div className="divide-y divide-line">
              {picked.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper text-text-2 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="t-small mt-2.5 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <Link href="/how-it-works" className="flex items-center justify-between border-t border-line px-5 py-4 text-[14px] font-medium transition hover:bg-paper">
              The whole process, step by step <ArrowUpRight size={15} className="text-text-3" />
            </Link>
          </Panel>
        </Reveal>

        <div className="grid gap-4">
          <Reveal>
            <Panel>
              <PanelHead title="The three rules" meta="They do not bend" />
              <ul className="grid gap-4 p-5">
                {[
                  { I: KeyRound, t: "Entry only on your OTP", b: "The checklist does not open until you share the code. Nobody holds a key you did not give." },
                  { I: BadgeCheck, t: "No repair without approval", b: "A flagged issue is a question, never a work order. You see the photographs and the quote first." },
                  { I: ShieldAlert, t: "Nothing gets edited later", b: "Reports and decisions are written once. What you read today is what it will say in a year." },
                ].map(({ I, t, b }) => (
                  <li key={t} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><I size={16} /></span>
                    <div><div className="text-[14.5px] font-medium">{t}</div><p className="t-small mt-0.5 leading-snug">{b}</p></div>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>

          <Reveal delay={0.05}>
            <Panel>
              <PanelHead title="Something wrong with a visit?" meta="Tell us the same day if you can" />
              <div className="grid gap-3 p-5">
                <p className="t-small leading-relaxed">
                  If an inspector missed a room, a photograph does not match what you see, or anything felt off — say so. We re-open the visit, look at the GPS and time stamps ourselves, and send somebody back at our cost if we got it wrong.
                </p>
                <a href={`mailto:${site.email}?subject=About a visit`} className="btn btn-accent btn-sm w-full"><Mail size={14} /> Write to us</a>
                <a href={`mailto:${site.email}`} className="btn btn-white btn-sm w-full"><MessageSquare size={14} /> {site.email}</a>
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </>
  );
}
