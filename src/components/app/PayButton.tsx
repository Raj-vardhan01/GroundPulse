"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, FlaskConical, Loader2 } from "lucide-react";
import { confirmPayment, startPayment, type PayStart } from "@/lib/payActions";
import { money } from "@/components/app/money";
import { cn } from "@/lib/cn";
import type { PaymentPurpose } from "@/lib/types";

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (e: string, fn: (x: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => RazorpayInstance }
}

const CHECKOUT = "https://checkout.razorpay.com/v1/checkout.js";
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = CHECKOUT;
    s.onload = () => ok();
    s.onerror = () => fail(new Error("Razorpay did not load."));
    document.head.appendChild(s);
  });
}

/* One button for every payment the owner makes. The amount it shows is
   the one the server works out again before charging anything. */
export function PayButton({
  purpose, refId, amount, label, className, autoStart = false, small = false,
}: {
  purpose: PaymentPurpose;
  refId: string;
  amount: number;
  label?: string;
  className?: string;
  /** open the checkout as soon as the page loads — straight after booking */
  autoStart?: boolean;
  small?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dev, setDev] = useState<Extract<PayStart, { ok: true }> | null>(null);
  const started = useRef(false);

  const done = async (r: { ok: boolean; error?: string }) => {
    if (!r.ok) { setError(r.error ?? "Something went wrong."); setBusy(false); return; }
    setDev(null);
    router.refresh();
    setBusy(false);
  };

  const pay = async () => {
    setError("");
    setBusy(true);
    const s = await startPayment(purpose, refId);
    if (!s.ok) { setError(s.error); setBusy(false); return; }
    if (s.mode === "dev") { setDev(s); return; }
    try {
      await loadCheckout();
    } catch {
      setError("The payment window could not load. Check your connection and try again.");
      setBusy(false);
      return;
    }
    const rzp = new window.Razorpay!({
      key: s.keyId, order_id: s.orderId, amount: s.amountInr * 100, currency: "INR",
      name: "StillYours", description: s.description, prefill: s.prefill,
      theme: { color: "#134027" },
      handler: async (resp: RazorpayResponse) => {
        await done(await confirmPayment({ paymentId: s.paymentId, orderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature }));
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", (e) => setError(e.error?.description ?? "The payment did not go through. Nothing was taken."));
    rzp.open();
  };

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void pay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  if (dev) {
    return (
      <div className={cn("rounded-[12px] border border-gold/40 bg-gold-soft p-3.5 text-left", className)}>
        <p className="flex items-start gap-2 text-[13px] leading-snug text-[#7a5209]">
          <FlaskConical size={14} className="mt-0.5 shrink-0" />
          No Razorpay keys on this server, so this payment of {money(dev.amountInr)} is simulated. Nothing is charged.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-accent btn-sm"
            onClick={async () => done(await confirmPayment({ paymentId: dev.paymentId, orderId: dev.orderId, razorpayPaymentId: `dev_pay_${Date.now()}`, signature: "" }))}>
            Simulate payment
          </button>
          <button type="button" className="btn btn-white btn-sm" onClick={() => { setDev(null); setBusy(false); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button type="button" onClick={pay} disabled={busy}
        className={cn("btn btn-accent w-full disabled:opacity-60", small && "btn-sm")}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
        {label ?? `Pay ${money(amount)}`}
      </button>
      {error && <p className="mt-2 text-[13px] text-fail" role="alert">{error}</p>}
    </div>
  );
}
