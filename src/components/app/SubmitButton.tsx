"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/** A submit button that tells the truth about what it is doing. Every
    form in the owner app uses it, so "saving" never looks like nothing. */
export function SubmitButton({
  children, className, pendingLabel = "One moment…", icon,
}: { children: React.ReactNode; className?: string; pendingLabel?: string; icon?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("btn btn-accent", pending && "opacity-80", className)}>
      {pending ? <><Loader2 size={16} className="animate-spin" /> {pendingLabel}</> : <>{children}{icon}</>}
    </button>
  );
}
