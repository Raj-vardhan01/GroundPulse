/** A carabiner with two keys — the polaroid's companion, like Opendoor's. Pure SVG. */
export function Keys({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden>
      <defs>
        <linearGradient id="k-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d7d3cc" /><stop offset="0.5" stopColor="#a9a39b" /><stop offset="1" stopColor="#75706a" /></linearGradient>
        <linearGradient id="k-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9c76a" /><stop offset="1" stopColor="#b8892b" /></linearGradient>
        <filter id="k-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#23201d" floodOpacity="0.28" /></filter>
      </defs>
      <g filter="url(#k-shadow)">
        {/* carabiner */}
        <path d="M112 18c-22-10-46 6-46 30v28c0 8 6 14 14 14h6" fill="none" stroke="#2b2825" strokeWidth="11" strokeLinecap="round" />
        <path d="M112 18c14 6 22 18 22 32v28c0 10-8 18-18 18h-6" fill="none" stroke="#3a3632" strokeWidth="11" strokeLinecap="round" />
        <path d="M118 22c8 4 12 12 12 20" fill="none" stroke="#6b665f" strokeWidth="4" strokeLinecap="round" />
        {/* ring */}
        <circle cx="96" cy="112" r="22" fill="none" stroke="url(#k-brass)" strokeWidth="7" />
        <circle cx="96" cy="112" r="22" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
        {/* key 1 */}
        <g transform="rotate(-28 96 130)">
          <circle cx="96" cy="140" r="17" fill="url(#k-metal)" />
          <circle cx="96" cy="140" r="6" fill="#f4f1ec" />
          <rect x="91" y="152" width="10" height="62" rx="3" fill="url(#k-metal)" />
          <path d="M101 190h8v6h-8zM101 202h6v5h-6z" fill="#8d8780" />
        </g>
        {/* key 2 */}
        <g transform="rotate(-8 96 130)">
          <circle cx="98" cy="142" r="15" fill="#c9c4bc" />
          <circle cx="98" cy="142" r="5" fill="#f4f1ec" />
          <rect x="94" y="154" width="8" height="58" rx="3" fill="#b6b0a8" />
          <path d="M102 184h7v5h-7zM102 196h5v5h-5z" fill="#8d8780" />
        </g>
      </g>
    </svg>
  );
}
