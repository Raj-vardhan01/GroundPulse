import Link from "next/link";
import { Bell, LogOut, Mail, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { otherSide, requireOwner } from "@/lib/auth";
import { doSignOut, switchApp } from "@/lib/actions";
import { ProfileForm } from "@/app/welcome/ProfileForm";
import { InstallCard } from "@/components/app/InstallCard";
import { PageHead, Panel, PanelHead } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDate } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata = { title: "Account" };

export default async function Page() {
  const user = await requireOwner();
  const inspector = (await otherSide()) === "inspector";

  return (
    <>
      <PageHead eyebrow="You" title="Account" lede={`With us since ${fmtDate(user.createdAt, { year: true })}.`} />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <div className="grid gap-4">
          <Reveal>
            <Panel>
              <PanelHead title="Your details" meta="What goes on your reports, and where they land" />
              <div className="p-5">
                <ProfileForm compact phone={user.phone} name={user.name} email={user.email} livesIn={user.livesIn} />
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.05}>
            <Panel>
              <PanelHead title="How we reach you" meta="We keep it to what matters" />
              <ul className="divide-y divide-line">
                {[
                  { I: Phone, k: "SMS", v: `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}`, n: "Inspector assigned, on the way, and the report link" },
                  { I: Mail, k: "Email", v: user.email || "Not set", n: "The full report, and every bill" },
                  { I: Bell, k: "In the app", v: "On", n: "Everything, kept in Activity" },
                ].map(({ I, k, v, n }) => (
                  <li key={k} className="flex items-center gap-4 px-5 py-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-text-2"><I size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-medium">{k}</div>
                      <div className="t-small mt-0.5 truncate">{n}</div>
                    </div>
                    <span className="t-small shrink-0 truncate font-medium text-ink">{v}</span>
                  </li>
                ))}
              </ul>
              <p className="t-small border-t border-line px-5 py-3.5">
                We never send marketing to this number. If it is not about your property, we do not send it.
              </p>
            </Panel>
          </Reveal>

          <Reveal delay={0.08}>
            <Panel>
              <PanelHead title="Privacy" meta="Short, because there is not much to it" />
              <ul className="grid gap-3 p-5">
                {[
                  "Your photographs are private: only you and the inspector assigned to that visit can open them. Every one is taken live in the inspector's camera, never picked from a gallery.",
                  "We never sell or share your property data. There is no advertising business here to feed.",
                  "Every decision you make is written to an audit log that nobody — including us — can edit afterwards.",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-text-2">
                    <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" /> {t}
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        </div>

        <div className="grid gap-4 self-start">
          <Reveal>
            <Panel>
              <PanelHead title={<span className="flex items-center gap-2"><Smartphone size={15} /> Add to home screen</span>} meta="Android and iPhone" />
              <InstallCard />
            </Panel>
          </Reveal>

          <Reveal delay={0.05}>
            <Panel>
              <PanelHead title="Need a person?" meta={site.city} />
              <div className="grid gap-3 p-5">
                <a href={`mailto:${site.email}`} className="btn btn-white btn-sm w-full"><Mail size={14} /> {site.email}</a>
                <Link href="/app/help" className="btn btn-white btn-sm w-full">Read the common questions</Link>
                <p className="t-small leading-snug">{site.company} · {site.address}</p>
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.08}>
            <Panel>
              <div className="p-5">
                {inspector && (
                  <form action={switchApp} className="mb-2.5">
                    <input type="hidden" name="as" value="inspector" />
                    <button className="btn btn-accent btn-sm w-full"><ShieldCheck size={14} /> Open the inspector app — same number</button>
                  </form>
                )}
                <form action={doSignOut}>
                  <button className="btn btn-white btn-sm w-full"><LogOut size={14} /> Sign out</button>
                </form>
                <p className="t-small mt-3 leading-snug">Signing out only ends this session. Your properties, reports and decisions stay exactly as they are.</p>
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </>
  );
}
