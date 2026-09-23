"use client";

import { useActionState, useState } from "react";
import { Check, X } from "lucide-react";
import { decideIssue, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { money } from "@/components/app/money";

/* The moment the product exists for. One tap used to spend the money —
   now the tap asks, and the second one says exactly what it commits to. */
export function DecisionButtons({ id, payable, canApprove }: { id: string; payable: number | null; canApprove: boolean }) {
  const [state, act] = useActionState(decideIssue, { ok: false } as FormState);
  const [asking, setAsking] = useState<null | "approve" | "decline">(null);

  if (asking) {
    return (
      <form action={act} className="mt-4 rounded-[12px] border border-line-2 bg-white p-3.5">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value={asking} />
        <p className="text-[13.5px] font-medium leading-snug">
          {asking === "approve"
            ? payable ? `Approve this repair? ${money(payable)} is added to your bills, and we line up the pro for a day you choose.` : "Approve this repair? It is fully covered — nothing is added to your bills."
            : "Decline this repair? Nothing is done about it. You can still ask us about it later from Help."}
        </p>
        {state.error && <p className="mt-2 text-[13px] text-fail" role="alert">{state.error}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SubmitButton className={asking === "approve" ? "btn-sm" : "btn-sm bg-ink"} pendingLabel="Saving…">{asking === "approve" ? <><Check size={14} /> Yes, approve</> : <><X size={14} /> Yes, decline</>}</SubmitButton>
          <button type="button" onClick={() => setAsking(null)} className="btn btn-white btn-sm">Go back</button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => canApprove && setAsking("approve")} disabled={!canApprove}
        className="btn btn-accent btn-sm w-full px-2 text-[13.5px] disabled:cursor-not-allowed disabled:opacity-45">
        <Check size={14} /> {canApprove ? `Approve${payable !== null ? ` ${money(payable)}` : ""}` : "Waiting for a quote"}
      </button>
      <button type="button" onClick={() => setAsking("decline")} className="btn btn-white btn-sm w-full px-2 text-[13.5px]"><X size={14} /> Decline</button>
    </div>
  );
}
