"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share, SquarePlus, X } from "lucide-react";
import { Mark } from "@/components/ui/Logo";
import { usePlatform, useInstalled } from "@/components/app/usePlatform";
import { EASE } from "@/lib/motion";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = "sy-install-dismissed";
const dismissed = () => { try { return !!localStorage.getItem(KEY); } catch { return false; } };

/** A quiet invitation to install, shown once. Android gets the real
    browser prompt; iOS has no such API, so it gets the two taps spelled
    out — that is the whole difference between the platforms here. */
export function InstallHint() {
  const platform = usePlatform();
  const installed = useInstalled();
  const [deferred, setDeferred] = useState<Prompt | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (installed || dismissed()) return;

    if (platform === "ios") {
      const t = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as Prompt);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [installed, platform]);

  const close = () => {
    setShow(false);
    try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    close();
  };

  const ios = platform === "ios";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed inset-x-3 z-[55] mx-auto max-w-[460px] lg:left-auto lg:right-6 lg:mx-0 print:hidden"
          style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}
        >
          <div className="card border border-line bg-white p-4 shadow-float">
            <div className="flex items-start gap-3">
              <Mark size={34} />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold">Keep this on your home screen</div>
                <p className="t-small mt-1 leading-snug">
                  {ios
                    ? <>Tap <Share size={12} className="inline -translate-y-px" /> below, then <b>Add to Home Screen</b>. It opens full screen, like an app.</>
                    : <>Install it and it opens full screen, with your properties one tap away.</>}
                </p>
                {!ios && <button onClick={install} className="btn btn-accent btn-sm mt-3 w-full"><SquarePlus size={15} /> Install</button>}
              </div>
              <button onClick={close} aria-label="Not now" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-3 transition hover:bg-beige"><X size={15} /></button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
