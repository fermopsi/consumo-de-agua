import { ConsumoItem, NOMBRES_MESES } from "../types";

interface Props {
  consumos: ConsumoItem[];
  anio: number;
}

const WIDTH = 760;
const HEIGHT = 200;
const MARGIN_X = 40;
const BASELINE_Y = 180;
const TOP_Y = 30;

/** Smooth line through midpoints — the same technique water-level gauges
 * use to draw a wavy surface instead of a jagged line-chart default. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${pts[0].y}`;

  let d = `M ${pts[0].x} ${pts[0].y} `;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    if (i === pts.length - 1) {
      d += `Q ${p0.x} ${p0.y} ${p1.x} ${p1.y} `;
    } else {
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      d += `Q ${p0.x} ${p0.y} ${mx} ${my} `;
    }
  }
  return d.trim();
}

export default function ConsumoChart({ consumos, anio }: Props) {
  const known = NOMBRES_MESES.map((_, idx) => {
    const mes = idx + 1;
    const registro = consumos.find((c) => c.anio === anio && c.mes === mes);
    return registro ? { idx, valor: registro.consumo_m3 } : null;
  }).filter((r): r is { idx: number; valor: number } => r !== null);

  const maxVal = Math.max(...known.map((k) => k.valor), 1) * 1.15;
  const xStep = (WIDTH - MARGIN_X * 2) / 11;

  const pixelPts = known.map((r) => ({
    x: MARGIN_X + r.idx * xStep,
    y: BASELINE_Y - (r.valor / maxVal) * (BASELINE_Y - TOP_Y),
  }));

  const linePath = smoothPath(pixelPts);
  const areaPath =
    pixelPts.length > 0
      ? `${linePath} L ${pixelPts[pixelPts.length - 1].x} ${BASELINE_Y} L ${pixelPts[0].x} ${BASELINE_Y} Z`
      : "";

  return (
    <div className="py-4">
      <h3 className="mb-3 text-sm font-semibold text-ink-soft">Nivel de consumo mensual (m³)</h3>

      {pixelPts.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">
          Sin datos suficientes para graficar.
        </p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            className="h-40 w-full sm:h-52"
            role="img"
            aria-label="Gráfica de consumo mensual de agua en metros cúbicos"
          >
            <defs>
              <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1C8C93" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#1C8C93" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#waveFill)" />
            <path d={linePath} fill="none" stroke="#0E5A68" strokeWidth={2.5} />
            <line
              x1={MARGIN_X}
              y1={BASELINE_Y}
              x2={WIDTH - MARGIN_X}
              y2={BASELINE_Y}
              stroke="#D8E3E1"
              strokeWidth={1}
            />
          </svg>
          <div className="mt-1 flex justify-between px-1 text-[10px] text-ink-soft">
            {NOMBRES_MESES.map((n) => (
              <span key={n}>{n.slice(0, 3)}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
