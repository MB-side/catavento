// Wind rose (docs/06 §6): a circle with the published wind range shaded, and directions a source
// rates only "possible" shaded in the marginal colour (D81). 48 px on cards, about
// 160 px on site pages with N/E/S/W labels. "All" fills the circle. Decorative: the range is
// always given as text next to it.
import type { WindArc } from "@/lib/types";

const norm = (d: number) => ((d % 360) + 360) % 360;

function point(cx: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cx - r * Math.cos(rad)];
}

/** SVG path for a pie slice from `from` clockwise to `to` (compass degrees). */
export function slicePath(cx: number, r: number, arc: WindArc): string {
  const span = norm(arc.toDeg - arc.fromDeg) || 360;
  if (span >= 360)
    return `M ${cx - r} ${cx} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  const [x1, y1] = point(cx, r, arc.fromDeg);
  const [x2, y2] = point(cx, r, arc.toDeg);
  const f = (n: number) => Number(n.toFixed(2));
  return `M ${cx} ${cx} L ${f(x1)} ${f(y1)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${f(x2)} ${f(y2)} Z`;
}

/** Theme colours by default; share images pass plain hex values (no CSS there). */
export const ROSE_COLOURS = {
  face: "var(--color-surface)",
  edge: "var(--color-border-strong)",
  range: "var(--color-in-range)",
  marginal: "var(--color-marginal)",
  ink: "var(--color-ink)",
  label: "var(--color-muted-strong)",
};

interface WindRoseProps {
  ranges: WindArc[] | "all";
  marginal?: WindArc[];
  size?: number;
  labels?: boolean;
  className?: string;
  colours?: typeof ROSE_COLOURS;
}

export function WindRose({
  ranges,
  marginal = [],
  size = 48,
  labels = false,
  className,
  colours = ROSE_COLOURS,
}: WindRoseProps) {
  const box = 100;
  const cx = box / 2;
  const r = labels ? 36 : 46;
  const arcs = ranges === "all" ? [{ fromDeg: 0, toDeg: 360 }] : ranges;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden="true"
      className={className}
      data-testid="wind-rose"
    >
      <circle cx={cx} cy={cx} r={r} fill={colours.face} stroke={colours.edge} strokeWidth="1.5" />
      {marginal.map((a, i) => (
        <path key={`m${i}`} d={slicePath(cx, r, a)} fill={colours.marginal} fillOpacity="0.85" />
      ))}
      {arcs.map((a, i) => (
        <path key={i} d={slicePath(cx, r, a)} fill={colours.range} fillOpacity="0.85" />
      ))}
      {/* North tick */}
      <line
        x1={cx}
        y1={cx - r - 1}
        x2={cx}
        y2={cx - r + 7}
        stroke={colours.ink}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cx} r="2" fill={colours.ink} />
      {labels &&
        (["N", "E", "S", "W"] as const).map((l, i) => {
          const [x, y] = point(cx, r + 8, i * 90);
          return (
            <text
              key={l}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fontWeight="700"
              fill={colours.label}
            >
              {l}
            </text>
          );
        })}
    </svg>
  );
}
