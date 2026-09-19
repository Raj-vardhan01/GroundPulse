import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { Logo } from "@/components/ui/Logo";

const rows = [
  { k: "Who checks", a: "A background-verified inspector, on schedule", b: "A neighbour or relative, whenever they can" },
  { k: "Local agents", a: "No brokerage, no commission — inspection is the job", b: "\"We'll inspect once we find you a tenant\" — commission first, work rarely" },
  { k: "What you get", a: "42-item home checklist or GPS boundary walk · photos & video", b: "\"Sab theek hai\" 👍" },
  { k: "How fast", a: "Report within the hour (usually minutes)", b: "Days — if at all" },
  { k: "Repairs", a: "Only after you approve, by a verified provider", b: "Whoever the caretaker knows, whenever" },
  { k: "The record", a: "Immutable, timestamped audit log", b: "WhatsApp scrollback" },
  { k: "Cost of checking", a: "₹0 in flights", b: "One anxious trip home" },
];

export function Compare() {
  return (
    <section className="section" aria-labelledby="compare-title">
      <div className="wrap">
        <SectionHead title={<span id="compare-title">GroundPulse vs. the usual way</span>} lede="Every workaround is missing something. Here's the whole picture, side by side." />
        <Reveal className="mt-10 md:mt-14">
          <div className="grid gap-4 md:grid-cols-[180px_1fr_1fr] md:gap-0">
            <div className="hidden md:block" />
            <div className="hidden md:block px-5 pb-3"><Logo /></div>
            <div className="hidden md:block px-5 pb-3 text-[18px] font-medium text-text-2">The usual way</div>
            {rows.map((r, i) => (
              <div key={r.k} className="contents">
                <div className="hidden items-center px-0 py-4 text-[14px] font-semibold text-text-2 md:flex" style={{ borderTop: i ? "1px solid var(--line)" : undefined }}>{r.k}</div>
                <div className={`flex items-center bg-accent-tint px-5 py-4 text-[15px] font-medium text-ink md:border-t md:border-line ${i === 0 ? "rounded-t-[16px] md:rounded-tl-[16px] md:rounded-tr-none" : ""} ${i === rows.length - 1 ? "md:rounded-bl-[16px]" : ""}`}>
                  <span className="mr-3 text-[12px] font-semibold text-text-3 md:hidden">{r.k}</span>{r.a}
                </div>
                <div className={`flex items-center bg-white px-5 py-4 text-[15px] text-text-2 md:border-t md:border-line ${i === 0 ? "md:rounded-tr-[16px]" : ""} ${i === rows.length - 1 ? "rounded-b-[16px] md:rounded-bl-none md:rounded-br-[16px]" : ""}`}>
                  {r.b}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
