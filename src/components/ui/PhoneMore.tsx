"use client";

import { Children, cloneElement, isValidElement, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** A list that shows its first few items on a phone and the rest behind
    one tap — the whole of it is still there, just not a screen and a half
    of scrolling. From sm up every item shows and the button does not. */
export function PhoneMore({
  as: Tag = "ul", show = 5, label, more, className, dark = false, children,
}: {
  as?: "ul" | "ol" | "div";
  show?: number;
  /** what the list is, for the button: "terms" → "All 9 terms" */
  label: string;
  /** the button's words instead, when "All 9 terms" is not how to say it */
  more?: string;
  className?: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  const hidden = items.length - show;
  return (
    <div>
      <Tag className={className}>
        {items.map((c, i) =>
          !open && i >= show && isValidElement<{ className?: string }>(c)
            ? cloneElement(c, { className: cn(c.props.className, "max-sm:hidden") })
            : c,
        )}
      </Tag>
      {hidden > 0 && (
        <button
          type="button" onClick={() => setOpen(!open)} aria-expanded={open}
          className={cn("mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium sm:hidden", dark ? "text-white/85" : "text-accent")}
        >
          {open ? "Show less" : more ?? `All ${items.length} ${label}`}
          <ChevronDown size={15} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
