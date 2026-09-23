import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db, mutate } from "@/lib/store";
import { settlePayment } from "@/lib/payments";
import { webhookSignatureOk } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Razorpay telling us a payment went through — the backstop for an owner
   who closed the tab before the checkout could say so itself. Settling
   is idempotent, so whichever arrives second does nothing. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!webhookSignatureOk(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad body." }, { status: 400 }); }
  if (event.event !== "payment.captured" && event.event !== "order.paid") return NextResponse.json({ ok: true });

  const entity = event.payload?.payment?.entity;
  const orderId = entity?.order_id ?? "";
  const paymentId = entity?.id ?? "";
  if (!orderId || !paymentId) return NextResponse.json({ ok: true });

  const known = (await db()).payments.some((p) => p.orderId === orderId);
  if (!known) return NextResponse.json({ ok: true });
  await mutate((d) => {
    const pay = d.payments.find((p) => p.orderId === orderId);
    if (pay) settlePayment(d, pay, paymentId, `Razorpay · ${paymentId}`);
  });
  revalidatePath("/app", "layout");
  return NextResponse.json({ ok: true });
}
