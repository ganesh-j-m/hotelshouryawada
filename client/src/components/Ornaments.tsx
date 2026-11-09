/** Decorative brand marks drawn in SVG — no external assets required. */

export function ArchEmblem({ className = 'h-10 w-10', strokeWidth = 3 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden="true" fill="none">
      <path
        d="M14 116 V58 C14 34 36 24 50 6 C64 24 86 34 86 58 V116"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 116 V64 C28 48 42 40 50 28 C58 40 72 48 72 64 V116"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path d="M50 84 C44 76 46 68 50 60 C54 68 56 76 50 84 Z" fill="currentColor" opacity="0.9" />
      <path d="M40 92 H60" stroke="currentColor" strokeWidth={strokeWidth * 0.75} strokeLinecap="round" />
    </svg>
  );
}

export function Divider({ className = 'text-saffron-400', light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className={`h-px w-12 ${light ? 'bg-saffron-300/50' : 'bg-saffron-400/60'}`} />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M12 2 L14.5 12 L12 22 L9.5 12 Z" />
        <path d="M2 12 L12 9.5 L22 12 L12 14.5 Z" opacity="0.55" />
      </svg>
      <span className={`h-px w-12 ${light ? 'bg-saffron-300/50' : 'bg-saffron-400/60'}`} />
    </div>
  );
}

/** Large line-art wada gateway used in the hero when no photograph is set. */
export function WadaGate({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 480" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <g strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 470 V200 C30 120 120 90 200 18 C280 90 370 120 370 200 V470" />
        <path d="M60 470 V214 C60 148 136 120 200 58 C264 120 340 148 340 214 V470" opacity=".75" />
        <path d="M110 470 V250 C110 200 160 176 200 132 C240 176 290 200 290 250 V470" opacity=".55" />
        <path d="M200 18 V0" />
        <circle cx="200" cy="32" r="4" fill="currentColor" stroke="none" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} d={`M14 ${250 + i * 32} H46`} opacity=".4" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={`r${i}`} d={`M354 ${250 + i * 32} H386`} opacity=".4" />
        ))}
        <path d="M200 330 C184 308 188 286 200 264 C212 286 216 308 200 330 Z" fill="currentColor" fillOpacity=".35" className="animate-flicker" style={{ transformOrigin: "200px 330px", transformBox: "view-box" }} />
        <path d="M172 350 H228" />
        <path d="M150 470 V390 M250 470 V390 M150 390 H250" opacity=".45" />
      </g>
    </svg>
  );
}

export function VegMark({ type, className = '' }: { type: 'VEG' | 'NON_VEG' | 'EGG'; className?: string }) {
  const color = type === 'VEG' ? '#2E7D32' : type === 'EGG' ? '#C77700' : '#9B2C2C';
  const label = type === 'VEG' ? 'Vegetarian' : type === 'EGG' ? 'Contains egg' : 'Non-vegetarian';
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] ${className}`}
      style={{ borderColor: color }}
      title={label}
      role="img"
      aria-label={label}
    >
      {type === 'NON_VEG' ? (
        <svg viewBox="0 0 10 10" className="h-2 w-2">
          <path d="M5 1 L9 9 H1 Z" fill={color} />
        </svg>
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
    </span>
  );
}
