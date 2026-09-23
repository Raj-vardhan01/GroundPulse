/* Not a server action on purpose: only server code decides whose money
   goes back. Called after a cancellation has marked bills "being
   refunded". */

import { db, mutate } from "@/lib/store";
import { payMode, refundPayment } from "@/lib/razorpay";

/** Send back what is owed on this visit's bills, where Razorpay took it.
    Anything that cannot be refunded online stays "being refunded" for a
    person to finish. A simulated payment is simply marked refunded. */
export async function refundOwed(ownerId: string, visitId: string) {
  const mode = payMode();
  const d = await db();
  const owed = d.invoices.filter((i) => i.ownerId === ownerId && i.visitId === visitId && i.status === "refund_due" && i.paymentId);
  for (const inv of owed) {
    const simulated = inv.paymentId!.startsWith("dev_");
    if (simulated ? mode !== "dev" : mode !== "razorpay") continue;
    try {
      if (!simulated) await refundPayment(inv.paymentId!, inv.amountInr);
      await mutate((s) => {
        const x = s.invoices.find((i) => i.id === inv.id);
        if (x) { x.status = "refunded"; x.method = `${x.method} · refunded to the original payment`; }
      });
    } catch (err) {
      console.error(err);
    }
  }
}
