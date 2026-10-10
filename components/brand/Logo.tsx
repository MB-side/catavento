// HouseThermal mark and lockups (docs/06 §9): a glider climbing in a thermal above a roofline.
import { siteConfig } from "@/site.config";
import { cn } from "@/lib/utils";

interface MarkProps {
  size?: number;
  onDark?: boolean;
  className?: string;
}

export function LogoMark({ size = 28, onDark = false, className }: MarkProps) {
  const roof = onDark ? "#FFFFFF" : "var(--color-ink)";
  const thermal = onDark ? "var(--color-marginal)" : "var(--color-action)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 23 L14 15 L24 23" stroke={roof} strokeWidth="2.4" />
      <path d="M8.5 12 C 8.5 14.4, 19.5 14.4, 19.5 12" stroke={thermal} strokeWidth="2.2" />
      <path d="M10.5 7.5 C 10.5 9.3, 17.5 9.3, 17.5 7.5" stroke={thermal} strokeWidth="2.2" />
      <circle cx="14" cy="3.6" r="1.7" fill={thermal} />
    </svg>
  );
}

interface LockupProps {
  withDescriptor?: boolean;
  onDark?: boolean;
  className?: string;
}

/** Mark + name, optionally with the descriptor stacked beneath (desktop top bar, About, share images). */
export function Lockup({ withDescriptor = false, onDark = false, className }: LockupProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={withDescriptor ? 30 : 24} onDark={onDark} />
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
