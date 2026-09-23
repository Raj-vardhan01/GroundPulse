"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { rateVisit, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { cn } from "@/lib/cn";

/** One rating per visit, once the report is in. It goes on the
    inspector's record — the number owners see before they are assigned. */
export function RateVisit({ id, inspector, done }: { id: string; inspector: string; done: { stars: number; note: string } | null }) {
  const [state, submit] = useActionState(rateVisit, { ok: false } as FormState);
  const [stars, setStars] = useState(0);

  if (done) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-text-2">
        <span className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} className={n <= done.stars ? "fill-gold text-gold" : "text-line-2"} />)}</span>
        You rated {inspector}.{done.note && <span className="w-full italic">“{done.note}”</span>}
      </div>
    );
  }
  if (state.ok) return <p className="text-[13.5px] font-medium text-pass" role="status">{state.message}</p>;

  return (
    <form action={submit} className="grid gap-2.5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="stars" value={stars} />
      <div className="text-[14px] font-medium">How did {inspector} do?</div>
      <div className="flex gap-1" role="radiogroup" aria-label="Stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setStars(n)}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-gold-soft">
            <Star size={22} className={cn(n <= stars ? "fill-gold text-gold" : "text-line-2")} />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <>
          <textarea name="note" rows={2} maxLength={400} placeholder={stars >= 4 ? "Anything they did especially well? (optional)" : "What should they have done differently? (optional)"}
            className="w-full rounded-[12px] border border-line-2 bg-white px-3.5 py-2.5 text-[14px] leading-snug outline-none focus:border-accent" />
          {state.error && <p className="text-[13px] text-fail" role="alert">{state.error}</p>}
          <SubmitButton className="btn-sm justify-self-start" pendingLabel="Saving…">Save rating</SubmitButton>
        </>
      )}
    </form>
  );
}
