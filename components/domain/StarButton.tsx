"use client";

// Save a site to My Sites (docs/02 §5.2, S1). Stored on this device only.
import { useSyncExternalStore } from "react";
import { Star } from "lucide-react";
import { t } from "@/lib/messages";
import { mySitesSnapshot, subscribeMySites, toggleSite } from "@/lib/my-sites";
import type { SiteSummary } from "@/lib/site-summary";
import { cn } from "@/lib/utils";

export function StarButton({
  site,
  withLabel = false,
}: {
  site: SiteSummary;
  withLabel?: boolean;
}) {
  const snapshot = useSyncExternalStore(subscribeMySites, mySitesSnapshot, () => "");
  const saved = snapshot.split("|").includes(site.id);
  const label = saved ? t("star.saved") : t("star.save");
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={withLabel ? undefined : `${label}: ${site.name}`}
      onClick={() => toggleSite(site)}
      data-testid="star"
      className={cn(
        "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 self-start rounded-[10px] border font-semibold",
        withLabel ? "px-4" : "",
        saved
          ? "border-action bg-action-tint text-action"
          : "border-border-strong bg-surface text-ink",
      )}
    >
      <Star className={cn("size-5", saved && "fill-current")} aria-hidden="true" />
      {withLabel && label}
    </button>
  );
}
