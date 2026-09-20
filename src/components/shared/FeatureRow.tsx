import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

/** Alternating text + visual row used on inner pages. */
export function FeatureRow({ n, k, title, body, children, flip, bullets }: { n?: string; k?: string; title: React.ReactNode; body: React.ReactNode; children: React.ReactNode; flip?: boolean; bullets?: string[] }) {
  return (
    <Reveal>
      <div className={cn("grid items-center gap-8 lg:grid-cols-12 lg:gap-12", flip && "lg:[&>*:first-child]:order-2")}>
        <div className="lg:col-span-4">
          {(n || k) && <div className="flex items-center gap-3">{n && <span className="text-[13px] font-semibold text-accent">{n}</span>}{k && <span className="t-label">{k}</span>}</div>}
          <h3 className="t-2 mt-4 max-w-[16ch]">{title}</h3>
          <p className="t-body mt-4 max-w-[44ch]">{body}</p>
          {bullets && (
            <ul className="mt-5 space-y-2">
              {bullets.map((b) => <li key={b} className="flex items-start gap-2.5 text-[15px] text-text-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{b}</li>)}
            </ul>
          )}
        </div>
        <div className="lg:col-span-8"><div className="panel bg-paper p-2.5 sm:p-6">{children}</div></div>
      </div>
    </Reveal>
  );
}
