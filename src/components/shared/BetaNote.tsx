import { Smartphone } from "lucide-react";
import { cn } from "@/lib/cn";

/** Shown on pages that describe the app, so nothing reads as live before it is. */
export function BetaNote({ className }: { className?: string }) {
  return (
    <div className={cn("wrap", className)}>
      <div className="flex items-start gap-3 rounded-[14px] border border-line bg-white p-4 text-[14.5px] shadow-card sm:p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Smartphone size={16} /></span>
        <p className="text-text-2">
          <span className="font-medium text-ink">Our app is in beta.</span> The screens on this page show the app we&apos;re building.
          Until it&apos;s ready, you get every report on WhatsApp and as a PDF, approve repairs by message, and your inspector
          video-calls you at the start and end of each visit.
        </p>
      </div>
    </div>
  );
}
