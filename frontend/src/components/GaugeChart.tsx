import { useEffect, useState } from "react";

interface Props {
  /** Current reading to point the needle at. */
  value: number;
  /** Scale upper bound (value maps 0..max across the dial). */
  max: number;
  label: string;
  unit?: string;
}

/**
 * Semicircle "water meter" dial: three fixed zones (bajo / normal / alto)
 * with a needle that sweeps to the current reading's position on load.
 */
export default function GaugeChart({ value, max, label, unit = "m³" }: Props) {
  const safeMax = max > 0 ? max : 1;
  const fraction = Math.min(Math.max(value / safeMax, 0), 1);
  const targetRotation = fraction * 180 - 90;

  const [rotation, setRotation] = useState(-90);

  useEffect(() => {
    const timeout = setTimeout(() => setRotation(targetRotation), 80);
    return () => clearTimeout(timeout);
  }, [targetRotation]);

  return (
    <div className="text-center">
      <svg viewBox="0 0 200 130" className="mx-auto w-full max-w-[220px]" aria-hidden="true">
        <path d="M10 110 A90 90 0 0 1 55 32" fill="none" stroke="#4B8F6B" strokeWidth={10} strokeLinecap="round" />
        <path d="M55 32 A90 90 0 0 1 145 32" fill="none" stroke="#1C8C93" strokeWidth={10} strokeLinecap="round" />
        <path d="M145 32 A90 90 0 0 1 190 110" fill="none" stroke="#D98E2B" strokeWidth={10} strokeLinecap="round" />
        <circle cx="100" cy="110" r="5" fill="#12242B" />
        <g
          className="gauge-needle"
          style={{
            transformOrigin: "100px 110px",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 1.1s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <line x1="100" y1="110" x2="100" y2="30" stroke="#12242B" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      </svg>

      <p className="-mt-1" aria-live="polite">
        <span className="font-mono text-3xl font-semibold text-water-600">{value}</span>
        <span className="ml-1 text-sm text-ink-soft">{unit}</span>
      </p>
      <p className="mt-0.5 text-xs text-ink-soft">{label}</p>

      <div className="mt-2 flex justify-center gap-3 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-moss" />
          Bajo
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-water-500" />
          Normal
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-clay" />
          Alto
        </span>
      </div>
    </div>
  );
}
