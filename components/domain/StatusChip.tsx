import { t } from "@/lib/messages";
import type { Site } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLE: Record<Site["status"], string> = {
  open: "bg-info-tint text-link",
  restricted: "bg-notice-tint text-notice-text",
  closed: "bg-outside text-ink",
  unknown: "bg-ground text-muted",
};

/** Open / Closed / Restricted / not published (docs/06 §6). */
export function StatusChip({ status, className }: { status: Site["status"]; className?: string }) {
  const label =
    status === "open"
      ? t("sitesList.open")
      : status === "closed"
        ? t("sitesList.closed")
        : status === "restricted"
          ? t("sitesList.restricted")
          : t("sitesList.unknownStatus");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold",
        STYLE[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
