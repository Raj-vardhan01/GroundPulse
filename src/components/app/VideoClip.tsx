import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Video } from "@/lib/types";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** A clip, ready to play: the poster costs nothing, the file is only
    fetched when somebody presses play — through the route that checks
    they may watch it. `share` is the family link's token. */
export function VideoClip({ v, label, share, className }: { v: Video; label: string; share?: string; className?: string }) {
  const src = `/api/media/view?key=${encodeURIComponent(v.key)}${share ? `&t=${encodeURIComponent(share)}` : ""}`;
  return (
    <figure className={cn("grid gap-1.5", className)}>
      <video controls preload="none" playsInline poster={v.poster || undefined} src={src} aria-label={label}
        className="aspect-video w-full rounded-[12px] bg-ink object-cover" />
      <figcaption className="t-small">
        {label} · {fmt(v.durationS)} · {fmtDateTime(v.at)} IST{v.lat !== null ? " · GPS-stamped" : ""}
      </figcaption>
    </figure>
  );
}
