import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";

/** Abstract map tile (Opendoor-style) with city pins. No geography — roads, blocks, water. */
export function MapCard({ className }: { className?: string }) {
  const pins = [
    { x: 30, y: 52, l: "Whitefield", n: "homes & plots" },
    { x: 66, y: 70, l: "Koramangala · HSR", n: "homes & plots" },
    { x: 24, y: 88, l: "Yelahanka · Devanahalli", n: "plots & land" },
  ];
  return (
    <div className={cn("card relative overflow-hidden bg-[#e9efe6] shadow-card", className)}>
      <svg viewBox="0 0 600 400" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="600" height="400" fill="#e6ede2" />
        {/* water */}
        <path d="M0 300 C 80 260, 140 330, 220 300 S 380 250, 460 300 S 560 360, 600 330 V 400 H 0 Z" fill="#cfe0ea" />
        {/* parks */}
        <rect x="360" y="40" width="130" height="90" rx="14" fill="#d3e4c8" />
        <rect x="60" y="150" width="90" height="70" rx="12" fill="#d3e4c8" />
        {/* blocks */}
        {[[40,40,90,50],[150,40,120,60],[290,60,50,40],[190,120,110,70],[320,150,140,60],[480,150,90,70],[40,250,70,30],[220,220,80,50],[330,240,120,40],[480,250,80,40]].map(([x,y,w,h],i)=><rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="#f3f4ef" stroke="rgba(35,32,29,0.08)" />)}
        {/* roads */}
        <g stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none">
          <path d="M0 110 H 600" /><path d="M0 235 H 600" /><path d="M170 0 V 400" /><path d="M470 0 V 400" /><path d="M300 0 C 320 120, 260 200, 310 400" />
        </g>
        <g stroke="#e8c96a" strokeWidth="5" strokeLinecap="round" fill="none"><path d="M0 110 H 600" /><path d="M170 0 V 400" /></g>
      </svg>
      {pins.map((p) => (
        <div key={p.l} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <div className="mb-1 whitespace-nowrap rounded-[10px] bg-white px-2 py-1 text-[11px] shadow-card sm:px-2.5 sm:py-1.5 sm:text-[12px]"><span className="font-medium">{p.l}</span><span className="text-text-2 max-lg:hidden"> · {p.n}</span></div>
          <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-accent text-white shadow-[0_6px_14px_-4px_rgba(20,102,74,.7)]"><MapPin size={15} /></div>
        </div>
      ))}
      <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-text-2">Bengaluru · live now</div>
    </div>
  );
}
