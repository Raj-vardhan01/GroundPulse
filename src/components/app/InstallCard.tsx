"use client";

import { useEffect, useState } from "react";
import { Check, Share, SquarePlus, Smartphone } from "lucide-react";
import { usePlatform, useInstalled } from "@/components/app/usePlatform";
import { cn } from "@/lib/cn";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/* Always available in Account, unlike the one-time nudge — an owner who
   dismissed that and later wants the app on their phone needs somewhere
   to go. Written for both platforms because iOS gives no install API. */
export function InstallCard() {
  const platform = usePlatform();
  const installed = useInstalled();
  const [deferred, setDeferred] = useState<Prompt | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as Prompt); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const steps = platform === "ios"
    ? ["Open this page in Safari", "Tap the Share button at the bottom", "Scroll down and tap “Add to Home Screen”", "Tap Add — it opens full screen from then on"]
    : ["Open the browser menu (⋮)", "Tap “Add to Home screen” or “Install app”", "Confirm — it opens full screen from then on"];

  return (
    <div className="p-5">
      {installed ? (
        <div className="flex items-center gap-3 rounded-[12px] bg-pass-soft px-4 py-3.5 text-[14px] font-medium text-[#157a44]">
          <Check size={16} strokeWidth={3} /> You are running the installed app.
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><Smartphone size={17} /></span>
            <p className="t-small leading-relaxed">
              Added to your home screen it opens full screen, without a browser bar — and it keeps working well enough to show you the last thing you read when the signal drops.
            </p>
          </div>

          {deferred && (
            <button onClick={async () => { await deferred.prompt(); await deferred.userChoice; }} className="btn btn-accent btn-sm mt-4 w-full">
              <SquarePlus size={15} /> Install now
            </button>
          )}

          <ol className="mt-4 grid gap-2">
            {steps.map((s, i) => (
              <li key={s} className="flex items-start gap-2.5 text-[13.5px]">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-beige font-mono text-[10.5px] font-semibold text-text-2">{i + 1}</span>
                <span className={cn("leading-snug", s.includes("Share") && "flex items-center gap-1")}>
                  {s}{s.includes("Share") && <Share size={12} className="inline" />}
                </span>
              </li>
            ))}
          </ol>
          <p className="t-small mt-3 leading-snug">
            On a phone reaching this laptop over wifi, the browser may not offer a true install — the home-screen shortcut still works, and a real install appears once this is served over HTTPS.
          </p>
        </>
      )}
    </div>
  );
}
