/* ════════════════════════════════════════════════════════════════
   Razorpay, by hand — three calls and two signatures, no SDK.

     RAZORPAY_KEY_ID          rzp_live_… (or rzp_test_… while testing)
     RAZORPAY_KEY_SECRET      from the same key pair
     RAZORPAY_WEBHOOK_SECRET  set when the webhook is added in the
                              dashboard → /api/razorpay/webhook,
                              events: payment.captured, order.paid

   Without keys a laptop still walks every flow — the payment is
   simulated and says so. In production, no keys means no payments:
   the button explains instead of pretending.
   ════════════════════════════════════════════════════════════════ */

import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.razorpay.com/v1";

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID?.trim() ?? "";
const keySecret = () => process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";

export type PayMode = "razorpay" | "dev" | "off";
export function payMode(): PayMode {
  if (razorpayKeyId() && keySecret()) return "razorpay";
  return process.env.NODE_ENV === "production" ? "off" : "dev";
}

const auth = () => `Basic ${Buffer.from(`${razorpayKeyId()}:${keySecret()}`).toString("base64")}`;

/** An order for the exact amount; Razorpay's checkout can only pay that. */
export async function createOrder(amountInr: number, receipt: string, notes: Record<string, string>) {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { authorization: auth(), "content-type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: "INR", receipt: receipt.slice(0, 40), notes }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`[razorpay] order failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return ((await res.json()) as { id: string }).id;
}

/** Give money back — the whole payment, or part of it. */
export async function refundPayment(paymentId: string, amountInr: number) {
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: { authorization: auth(), "content-type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amountInr * 100) }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`[razorpay] refund failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return true;
}

const hmac = (key: string, body: string) => createHmac("sha256", key).update(body).digest("hex");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** What the checkout hands back is only believed once this matches. */
export const checkoutSignatureOk = (orderId: string, paymentId: string, signature: string) =>
  !!keySecret() && !!signature && same(hmac(keySecret(), `${orderId}|${paymentId}`), signature);

export function webhookSignatureOk(rawBody: string, signature: string) {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  return !!s && !!signature && same(hmac(s, rawBody), signature);
}
