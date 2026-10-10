"use client";

import { Quadrant } from "@/lib/macroEngine";

const QUADRANT_ANGLES: Record<Quadrant, number> = {
  // 0° = pointing up. Clockwise, matching the classic Merrill Lynch clock:
  // Reflation (9 o'clock) -> Recovery (12) -> Overheat (3) -> Stagflation (6)
  Recovery: 0,
  Overheat: 90,
  Stagflation: 180,
  Reflation: 270,
};

const QUADRANT_META: Record<Quadrant, { color: string; label: string }> = {
  Recovery: { color: "#4FBF8B", label: "Recovery" },
  Overheat: { color: "#E0A83E", label: "Overheat" },
  Stagflation: { color: "#D9614F", label: "Stagflation" },
  Reflation: { color: "#5B8FD9", label: "Reflation" },
};

export function InvestmentClockDial({ quadrant }: { quadrant: Quadrant }) {
  const angle = QUADRANT_ANGLES[quadrant];
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Quadrant arcs */}
        {(Object.keys(QUADRANT_ANGLES) as Quadrant[]).map((q) => {
          const start = QUADRANT_ANGLES[q] - 90;
          const end = start + 90;
          const isActive = q === quadrant;
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const x1 = cx + r * Math.cos(toRad(start));
          const y1 = cy + r * Math.sin(toRad(start));
          const x2 = cx + r * Math.cos(toRad(end));
          const y2 = cy + r * Math.sin(toRad(end));
          return (
            <path
              key={q}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
              fill={QUADRANT_META[q].color}
              opacity={isActive ? 0.9 : 0.15}
              stroke="#0B0F14"
              strokeWidth={2}
            />
          );
        })}

        {/* Center hub */}
        <circle cx={cx} cy={cy} r={10} fill="#0B0F14" stroke="#E8E3D9" strokeWidth={2} />

        {/* Needle */}
        <g style={{ transition: "transform 0.6s ease-out" }} transform={`rotate(${angle} ${cx} ${cy})`}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - r + 14} stroke="#E8E3D9" strokeWidth={3} strokeLinecap="round" />
          <circle cx={cx} cy={cy - r + 14} r={5} fill="#E8E3D9" />
        </g>

        {/* Labels */}
        <text x={cx} y={cy - r - 10} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#8B95A1">RECOVERY</text>
        <text x={cx + r + 10} y={cy + 4} textAnchor="start" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#8B95A1">OVERHEAT</text>
        <text x={cx} y={cy + r + 20} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#8B95A1">STAGFLATION</text>
        <text x={cx - r - 10} y={cy + 4} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#8B95A1">REFLATION</text>
      </svg>

      <div
        className="rounded-full px-4 py-1 text-sm font-mono tracking-wide"
        style={{ backgroundColor: `${QUADRANT_META[quadrant].color}22`, color: QUADRANT_META[quadrant].color }}
      >
        Current phase: {QUADRANT_META[quadrant].label}
      </div>
    </div>
  );
}
