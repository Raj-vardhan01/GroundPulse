"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibre, StyleSpecification } from "maplibre-gl";
import { Check, Loader2, LocateFixed, Map as MapIcon, MapPin, Search, X } from "lucide-react";
import { where } from "@/lib/where";
import type { Here, MapConfig, Place } from "@/lib/ola";

/* ════════════════════════════════════════════════════════════════
   Marking where a property actually is.

   The pin stays in the middle and the map moves under it — the way
   every delivery app here asks for a location, so nobody has to learn
   it, and a thumb never has to land on a small marker.

   Three ways to a pin: stand at the gate and press "I am at the
   property"; search the building and nudge; or drag the map there. Or
   none of them — the first inspector marks it at the gate and the
   owner confirms.

   The map is only drawn once somebody asks for it. Every map drawn is
   a billed map load, and an owner adding a flat from abroad usually
   searches first and only then needs to see it.

   Dragging only moves the map. The pin is set when they press "Set the
   pin here" — one deliberate choice, and one lookup of what is there,
   instead of a lookup every time the map comes to rest.
   ════════════════════════════════════════════════════════════════ */

export type PinValue = { lat: number; lng: number; accuracyM: number | null; source: "map" | "gps" };

const BENGALURU: [number, number] = [77.5946, 12.9716];
/** Further out than this, a pin marks a neighbourhood, not a gate. */
const MIN_PIN_ZOOM = 16;
const OLA_STYLE = "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json";
const OLA_PRIVACY = "https://maps.olakrutrim.com/legal-docs/platform-privacy-policy-2026.pdf";
/** Ola's terms: credit "Ola Maps" and the OpenStreetMap data beneath it, visibly. */
const OLA_CREDIT = '<a href="https://maps.olakrutrim.com" target="_blank" rel="noopener">Ola Maps</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors (ODbL)';
/* Only ever used by a local dev server with no Ola key — see lib/ola. */
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const round = (n: number) => Math.round(n * 1e6) / 1e6;
/** About eleven metres — nudges smaller than this do not ask Ola again. */
const spot = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

/* Everything asked of our own /api/places, remembered for the page's life. */
const asked = new Map<string, unknown>();
async function ask<T>(qs: string, signal?: AbortSignal): Promise<T> {
  if (asked.has(qs)) return asked.get(qs) as T;
  const res = await fetch(`/api/places?${qs}`, { signal });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "failed");
  asked.set(qs, j);
  return j as T;
}

export function PinPicker({ value, onChange, config, plot = false, onPlace, startOpen = false }: {
  value: PinValue | null;
  onChange: (v: PinValue | null) => void;
  config: MapConfig;
  plot?: boolean;
  /** what is at the pin, for filling in the locality */
  onPlace?: (here: Here) => void;
  startOpen?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibre | null>(null);
  const userMoved = useRef(false);
  const latest = useRef({ value, onChange, onPlace });
  useEffect(() => { latest.current = { value, onChange, onPlace }; });

  const canMap = config.tiles !== "none";
  const [open, setOpen] = useState(canMap && (startOpen || !!value));
  const [hint, setHint] = useState("");
  const [near, setNear] = useState("");
  const [locating, setLocating] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  /** the map has been dragged off the pin and not set there yet */
  const [moved, setMoved] = useState(false);
  const [zoomOk, setZoomOk] = useState(false);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState("");
  /** the text of a suggestion just picked, so filling it in does not search again */
  const picked = useRef("");
  /** the spot last described, so the same spot is never looked up twice */
  const described = useRef("");

  /* ── the map, once asked for ─────────────────────────────── */
  useEffect(() => {
    if (!open || !canMap || !box.current) return;
    let gone = false;
    (async () => {
      const ml = (await import("maplibre-gl")).default;
      if (gone || !box.current) return;
      const v = latest.current.value;
      const m = new ml.Map({
        container: box.current,
        style: config.tiles === "ola" ? OLA_STYLE : OSM_STYLE,
        center: v ? [v.lng, v.lat] : BENGALURU,
        zoom: v ? 17.5 : 11,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        transformRequest: (url) =>
          config.tiles === "ola" && config.key && url.startsWith("https://api.olamaps.io")
            ? { url: `${url}${url.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(config.key)}` }
            : { url },
      });
      m.touchZoomRotate.disableRotation();
      /* A refused key (not allowed on this site, out of credit) would
         otherwise leave a blank box. Say so — search and GPS still work. */
      m.on("error", (e) => {
        const status = (e.error as { status?: number } | undefined)?.status;
        if (status === 401 || status === 403 || status === 429) setMapFailed(true);
      });
      m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      m.addControl(new ml.AttributionControl({ compact: false, customAttribution: config.tiles === "ola" ? OLA_CREDIT : undefined }), "bottom-right");
      /* A move the person made offers "Set the pin here" — it sets nothing
         by itself. The fly-to after a search or a GPS fix is ours, and
         those have already set the pin. */
      m.on("load", () => setZoomOk(m.getZoom() >= MIN_PIN_ZOOM));
      m.on("movestart", (e) => { userMoved.current = !!(e as { originalEvent?: unknown }).originalEvent; });
      m.on("moveend", () => {
        setZoomOk(m.getZoom() >= MIN_PIN_ZOOM);
        if (!userMoved.current) return;
        userMoved.current = false;
        /* A zoom that left the centre where it was is a look, not a move. */
        const c = m.getCenter(), was = latest.current.value;
        setMoved(!was || Math.abs(was.lat - c.lat) >= 1e-5 || Math.abs(was.lng - c.lng) >= 1e-5);
        setHint("");
      });
      map.current = m;
    })();
    return () => { gone = true; map.current?.remove(); map.current = null; };
  }, [open, canMap, config.tiles, config.key]);

  /** "Set the pin here": the centre of the map becomes the pin. */
  const setHere = () => {
    const m = map.current;
    if (!m) return;
    if (m.getZoom() < MIN_PIN_ZOOM) { setHint("Zoom in closer — from this far the pin could land on the wrong building."); return; }
    const c = m.getCenter();
    onChange({ lat: round(c.lat), lng: round(c.lng), accuracyM: null, source: "map" });
    setMoved(false);
    setHint("");
  };

  const fly = (lat: number, lng: number, zoom: number) => {
    if (map.current) map.current.flyTo({ center: [lng, lat], zoom, duration: 900 });
    else if (canMap) setOpen(true);
  };

  /* ── "near …" under the pin, and the locality ────────────── */
  useEffect(() => {
    if (!value || !config.search) return;
    const k = spot(value.lat, value.lng);
    if (described.current === k) return;
    const t = setTimeout(async () => {
      described.current = k;
      const j = await ask<{ here: Here | null }>(`lat=${value.lat}&lng=${value.lng}`).catch(() => null);
      if (!j?.here) return;
      setNear(j.here.address);
      latest.current.onPlace?.(j.here);
    }, 700);
    return () => clearTimeout(t);
  }, [value, config.search]);

  /* ── searching ───────────────────────────────────────────── */
  useEffect(() => {
    const term = q.trim();
    if (!config.search || term.length < 3 || term === picked.current) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const j = await ask<{ results: Place[] }>(`q=${encodeURIComponent(term.toLowerCase())}`, ctl.signal);
        setResults(j.results);
        setSearchNote(j.results.length ? "" : "Nothing found — try the building, the street, or a landmark nearby.");
      } catch {
        if (!ctl.signal.aborted) setSearchNote("Search is not answering right now — drag the map to the spot instead.");
      } finally {
        if (!ctl.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, config.search]);

  const pick = async (p: Place) => {
    setResults([]);
    picked.current = p.title;
    setQ(p.title);
    let pt = p.lat !== null && p.lng !== null ? { lat: p.lat, lng: p.lng } : null;
    if (!pt && p.id) pt = (await ask<{ point: { lat: number; lng: number } | null }>(`place=${encodeURIComponent(p.id)}`).catch(() => null))?.point ?? null;
    if (!pt) { setSearchNote("Could not place that one — try another, or drag the map to it."); return; }
    const label = [p.title, p.subtitle].filter(Boolean).join(", ");
    described.current = spot(pt.lat, pt.lng);
    setNear(label);
    setSearchNote("");
    onChange({ lat: round(pt.lat), lng: round(pt.lng), accuracyM: null, source: "map" });
    if (p.locality) onPlace?.({ locality: p.locality, address: label });
    setMoved(false);
    setHint(canMap ? "That is the building or street — drag the map onto the gate and set the pin there." : "");
    fly(pt.lat, pt.lng, 17.5);
  };

  /* ── standing at the gate ────────────────────────────────── */
  const here = async () => {
    setLocating(true);
    const c = await where({ precise: true });
    setLocating(false);
    if (c.lat === null || c.lng === null) {
      setHint("Your phone did not share its location. Allow location for this site, or mark the spot on the map.");
      return;
    }
    const acc = c.accuracy !== null ? Math.round(c.accuracy) : null;
    onChange({ lat: round(c.lat), lng: round(c.lng), accuracyM: acc, source: "gps" });
    setMoved(false);
    setHint(acc !== null && acc > 50 ? `Your phone is only sure to about ±${acc} m — drag the map onto the gate and set the pin there.` : "");
    fly(c.lat, c.lng, 18);
  };

  const clear = () => { onChange(null); setNear(""); setHint(""); setMoved(false); described.current = ""; };

  const onMap = hint
    || (moved ? "Press “Set the pin here” to keep this spot"
      : value ? "Pin set. Drag the map to move it"
      : "Drag the map until the pin sits on the gate");
  const offerSet = !mapFailed && (moved || !value);

  return (
    /* minmax(0,1fr): a long "near …" address must truncate, not widen the form */
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <input type="hidden" name="pinLat" value={value?.lat ?? ""} />
      <input type="hidden" name="pinLng" value={value?.lng ?? ""} />
      <input type="hidden" name="pinAccuracy" value={value?.accuracyM ?? ""} />
      <input type="hidden" name="pinSource" value={value?.source ?? ""} />

      {config.search && (
        <div className="relative">
          <div className="flex items-center gap-2 rounded-[12px] border border-line-2 bg-white px-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
            {searching ? <Loader2 size={15} className="shrink-0 animate-spin text-text-3" /> : <Search size={15} className="shrink-0 text-text-3" />}
            <input
              value={q} autoComplete="off" aria-label="Search for the property on the map"
              placeholder={plot ? "Search the village, layout or a landmark" : "Search the building or street"}
              onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length < 3) { setResults([]); setSearchNote(""); } }}
              onKeyDown={(e) => {
                /* Enter here must not submit the whole property form. */
                if (e.key === "Enter") { e.preventDefault(); if (results[0]) pick(results[0]); }
                if (e.key === "Escape") setResults([]);
              }}
              onBlur={() => setResults([])}
              className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-text-3"
            />
          </div>
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-[12px] border border-line bg-white shadow-float">
              {results.map((r) => (
                <li key={r.id || `${r.title}|${r.subtitle}`}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r)}
                    className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition hover:bg-paper">
                    <MapPin size={14} className="mt-1 shrink-0 text-text-3" />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{r.title}</span>
                      {r.subtitle && <span className="t-small block truncate">{r.subtitle}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchNote && <p className="t-small mt-1.5">{searchNote}</p>}
        </div>
      )}

      {open && (
        <div className="relative h-[300px] overflow-hidden rounded-[14px] border border-line-2 bg-paper sm:h-[340px]">
          {/* in flow, full size: maplibre's own stylesheet makes its container position:relative */}
          <div ref={box} className="h-full w-full" />
          {/* the pin: fixed in the middle, its point on the exact centre */}
          <MapPin size={38} strokeWidth={2} aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[calc(100%-3px)] fill-accent text-white drop-shadow-[0_2px_3px_rgba(0,0,0,.35)]" />
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/70" />
          <div className="pointer-events-none absolute left-3 right-14 top-3 z-10">
            <span className="inline-block rounded-[10px] bg-white/95 px-3 py-1.5 text-[12.5px] font-medium leading-snug text-ink shadow-card">{onMap}</span>
          </div>
          {offerSet && (
            <div className="absolute inset-x-0 bottom-9 z-20 flex justify-center px-3">
              {zoomOk ? (
                <button type="button" onClick={setHere} className="btn btn-accent btn-sm shadow-float"><Check size={14} /> Set the pin here</button>
              ) : (
                <span className="rounded-full bg-white/95 px-3.5 py-2 text-[12.5px] font-medium text-text-2 shadow-card">Zoom in to set the pin</span>
              )}
            </div>
          )}
          {mapFailed && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-paper/95 p-6 text-center">
              <p className="t-small max-w-[34ch]">The map could not load here. Search and “I am at the property now” still set the pin.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={here} disabled={locating} className="btn btn-white btn-sm">
          {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
          {locating ? "Finding you…" : "I am at the property now"}
        </button>
        {!open && canMap && (
          <button type="button" onClick={() => setOpen(true)} className="btn btn-white btn-sm"><MapIcon size={14} /> Mark it on the map</button>
        )}
        {value && (
          <button type="button" onClick={clear} className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-text-2 underline underline-offset-4">
            <X size={13} /> Remove pin
          </button>
        )}
      </div>

      {!open && hint && <p className="t-small text-[#94560a]">{hint}</p>}
      {moved && <p className="t-small font-medium text-[#94560a]">Not set yet — press “Set the pin here” on the map to keep that spot.</p>}
      {value && (
        <p className="t-small tabular-nums">
          <span className="font-medium text-pass">Pinned</span> · {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          {value.accuracyM !== null && ` · ±${value.accuracyM} m`}
          {near && <span className="block truncate">near {near}</span>}
        </p>
      )}
      {(config.tiles === "ola" || config.search) && (
        <p className="text-[11.5px] leading-snug text-text-3">
          Map and address search by Ola Maps: what you search and the pin are sent to them to draw it.{" "}
          <a href={OLA_PRIVACY} target="_blank" rel="noopener" className="underline underline-offset-2">Their privacy policy</a>.
        </p>
      )}
    </div>
  );
}
