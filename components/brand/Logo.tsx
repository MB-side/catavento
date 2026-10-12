// Catavento mark and lockups (docs/06 §9, D34): a pinwheel of eight gliders, paragliders and hang
// gliders alternating, circling clockwise as if sharing a thermal. Colours follow the founder's
// reference pinwheel, clockwise from the top.
import { siteConfig } from "@/site.config";
import { cn } from "@/lib/utils";

const PINWHEEL_COLOURS = [
  "#F28C28", // orange
  "#D6336C", // pink
  "#D7263D", // red
  "#7B3FB5", // purple
  "#2A4FB8", // blue
  "#0F8A7E", // teal
  "#3BA55C", // green
  "#F2C230", // yellow
] as const;

// Drawn at the top of a 28 × 28 box flying clockwise (to the right), wingspan pointing at the
// centre; each glider is the same shape rotated 45° further round.
const PARAGLIDER = "M13.2 2.2 Q14.93 6.4 13.2 10.6"; // canopy seen from above (stroked)
const HANG_GLIDER = "M17.24 6.4 L12.9 1 Q13.5 4.02 13.9 6.4 Q13.5 8.78 12.9 11.8 Z"; // delta, nose first

interface MarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 28, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {PINWHEEL_COLOURS.map((colour, i) => {
        const rotate = `rotate(${i * 45} 14 14)`;
        return i % 2 === 0 ? (
          <path
            key={colour}
            d={PARAGLIDER}
            transform={rotate}
            stroke={colour}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ) : (
          <path
            key={colour}
            d={HANG_GLIDER}
            transform={rotate}
            fill={colour}
            stroke={colour}
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

interface LockupProps {
  withDescriptor?: boolean;
  onDark?: boolean;
  /** The mark's size in pixels. Below about 40 px the gliders' shapes blur together. */
  markSize?: number;
  className?: string;
}

/** Mark + name, optionally with the descriptor stacked beneath (desktop top bar, About, share images). */
export function Lockup({
  withDescriptor = false,
  onDark = false,
  markSize = withDescriptor ? 48 : 40,
  className,
}: LockupProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-condensed text-[1.375rem] font-bold tracking-[0.02em]",
            onDark ? "text-white" : "text-ink",
          )}
        >
          {siteConfig.name}
        </span>
        {withDescriptor && (
          <span
            className={cn(
              "mt-0.5 text-[0.75rem] font-medium",
              onDark ? "text-white/80" : "text-muted",
            )}
          >
            {siteConfig.descriptor}
          </span>
        )}
      </span>
    </span>
  );
}
