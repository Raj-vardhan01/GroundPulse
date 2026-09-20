"use client";

import { Check, ChefHat, Minus, Plus, Sofa, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { bhkKeys, bhkLabel, coverage, extraGroups, inr, tiers, type Extra } from "@/lib/cleaning";
import type { CleanOrder } from "./useCleanOrder";

const groupIcon = { kitchen: ChefHat, soft: Sofa, space: Sun } as const;

/** Extras that are genuinely part of the clean render as a claim, not a control. */
function Included({ e }: { e: Extra }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-pass/25 bg-pass-soft/60 p-3">
      <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-pass text-white"><Check size={11} strokeWidth={3} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-medium">{e.name} <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#157a44]">included</span></div>
        <p className="t-small mt-0.5 text-[13px]">{e.note}</p>
      </div>
    </div>
  );
}

/** The three questions a cleaning quote actually needs: how big, how deep,
    and what beyond the standard. Numbered from `n` so it can slot into a
    longer form without renumbering by hand. */
export function CleanConfig({ o, n = 1 }: { o: CleanOrder; n?: number }) {
  const { size, setSize, tierId, setTierId, qty, bump, toggle, tier, cov } = o;

  return (
    <>
      {/* size */}
      <div className="card bg-white p-6 shadow-card sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[18px] font-medium">{n}. How big is the home?</h2>
          <span className="t-small">Priced by size — nothing changes at the door.</span>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {bhkKeys.map((k) => {
            const on = size === k;
            return (
              <button type="button" key={k} onClick={() => setSize(k)} aria-pressed={on}
                className={cn("rounded-[12px] border px-2 py-3 text-center transition", on ? "border-accent bg-accent-tint ring-4 ring-accent/10" : "border-line-2 hover:border-ink/40")}>
                <div className="text-[14.5px] font-medium">{bhkLabel[k]}</div>
                <div className="mt-0.5 text-[12.5px] tabular-nums text-text-2">{inr(tier.price[k])}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-5 overflow-hidden rounded-[14px] border border-line-2">
          <div className="flex items-center justify-between gap-2 bg-beige px-4 py-2.5">
            <span className="text-[13.5px] font-medium">What the size covers</span>
            <span className="text-[12.5px] text-text-2">in addition to living / dining &amp; kitchen</span>
          </div>
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-t border-line text-text-2">
                <th className="px-4 py-2 text-left font-normal">Home</th>
                {["Bedrooms", "Bathrooms", "Balconies"].map((l) => <th key={l} className="px-2 py-2 text-center font-normal">{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {bhkKeys.map((k) => {
                const on = size === k;
                return (
                  <tr key={k} className={cn("border-t border-line", on && "bg-accent-tint")}>
                    <td className={cn("px-4 py-2", on && "font-medium")}>{bhkLabel[k]}</td>
                    {(["bed", "bath", "balcony"] as const).map((f) => (
                      <td key={f} className={cn("px-2 py-2 text-center tabular-nums", on ? "font-medium" : "text-text-2")}>{coverage[k][f]}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="t-small mt-2.5">More bathrooms, balconies or a store room than that? Add them below at a fixed price — we never renegotiate on the day.</p>
      </div>

      {/* tier */}
      <div className="card bg-white p-6 shadow-card sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[18px] font-medium">{n + 1}. Which clean does it need?</h2>
          <span className="t-small">Both include the inspector, the report and before/after photos.</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Cleaning tier">
          {tiers.map((t) => {
            const on = tierId === t.id;
            return (
              <button type="button" key={t.id} role="radio" aria-checked={on} onClick={() => setTierId(t.id)}
                className={cn("relative rounded-[16px] border p-5 text-left transition", on ? "border-accent bg-accent-tint ring-4 ring-accent/10" : "border-line-2 hover:border-ink/40")}>
                <span className={cn("absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border", on ? "border-accent bg-accent text-white" : "border-line-2")}>{on && <Check size={11} strokeWidth={3} />}</span>
                <div className="flex items-center gap-2 pr-7">
                  <Sparkles size={15} className={on ? "text-accent" : "text-text-3"} />
                  <span className="text-[15.5px] font-medium">{t.name}</span>
                </div>
                <div className="mt-2 text-[30px] font-medium leading-none tracking-[-0.04em]">{inr(t.price[size])}</div>
                <div className="mt-1.5 text-[12.5px] text-text-2">{bhkLabel[size]} · {t.hours[size]} · {t.crew[size]} + inspector</div>
                <p className="mt-3 text-[13.5px] font-medium">{t.tagline}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {t.does.slice(0, 4).map((d) => (
                    <li key={d} className="flex items-start gap-2 text-[13px] leading-snug text-text-2">
                      <span className={cn("mt-[3px] grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full", on ? "bg-accent text-white" : "bg-beige-2 text-text-2")}><Check size={9} strokeWidth={3} /></span>{d}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-[14px] bg-beige p-4">
          <p className="text-[13.5px] font-medium">{tier.pick}</p>
          <p className="t-small mt-1.5 text-[13px]">{tier.doesnt}</p>
        </div>
      </div>

      {/* extras */}
      {extraGroups.map((g, gi) => {
        const I = groupIcon[g.id as keyof typeof groupIcon];
        return (
          <div key={g.id} className="card bg-white p-6 shadow-card sm:p-7">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={17} /></span>
              <div className="min-w-0">
                <h2 className="text-[18px] font-medium">{gi === 0 ? `${n + 2}. ` : ""}{g.name} <span className="text-[13px] font-normal text-text-2">(optional)</span></h2>
                <p className="t-small mt-1 max-w-[70ch]">{g.lede}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {g.items.map((e) => {
                if (e.price === 0) return <Included key={e.id} e={e} />;
                const q = qty[e.id] || 0;
                const countable = Boolean(e.per);
                const cap = e.max ?? 1;
                const baseCount = e.id === "balcony" ? cov.balcony : e.id === "bathroom" ? cov.bath : 0;
                return (
                  <div key={e.id} className={cn("flex items-center gap-3 rounded-[12px] border p-3 transition", q ? "border-accent bg-accent-tint" : "border-line-2")}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-medium">
                        {e.name} · {inr(e.price)}{e.per && <span className="text-[12px] font-normal text-text-2"> {e.per}</span>}
                      </div>
                      <div className="t-small mt-0.5 text-[13px]">
                        {baseCount > 0 && <span className="text-text-3">{bhkLabel[size]} already covers {baseCount}. </span>}{e.note}
                      </div>
                    </div>
                    {countable ? (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => bump(e, -1)} disabled={!q} aria-label={`Remove ${e.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-line-2 bg-white disabled:opacity-30"><Minus size={13} /></button>
                        <span className="w-5 text-center text-[14px] font-medium tabular-nums">{q}</span>
                        <button type="button" onClick={() => bump(e, 1)} disabled={q >= cap} aria-label={`Add ${e.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white disabled:opacity-30"><Plus size={13} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => toggle(e)} aria-pressed={Boolean(q)}
                        className={cn("h-9 shrink-0 rounded-full px-4 text-[13.5px] font-medium transition", q ? "bg-accent text-white" : "border border-line-2 bg-white hover:border-ink/40")}>
                        {q ? "Added" : "Add"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {g.id === "soft" && <p className="t-small mt-3 text-[12.5px]">Shampooed fabric needs four to five hours under a fan. Your inspector sets the fans and opens the windows before locking up, and notes the time in the report.</p>}
          </div>
        );
      })}
    </>
  );
}
