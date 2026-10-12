"use client";

// "Follow club" (docs/02 §5.2, S4): adds all of a club's sites to My Sites on this device.
import { useSyncExternalStore } from "react";
import { Check, Star } from "lucide-react";
import { tOr, t } from "@/lib/messages";
import { addSites, mySitesSnapshot, removeSites, subscribeMySites } from "@/lib/my-sites";

export function FollowClubButton({ siteIds }: { siteIds: string[] }) {
  const snapshot = useSyncExternalStore(subscribeMySites, mySitesSnapshot, () => "");
  const saved = new Set(snapshot ? snapshot.split("|") : []);
  const following = siteIds.length > 0 && siteIds.every((id) => saved.has(id));
  const form = new Intl.PluralRules("en").select(siteIds.length) === "one" ? "one" : "other";

  if (siteIds.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {following ? (
        <>
          <p className="inline-flex items-center gap-2 font-semibold text-link" role="status">
            <Check className="size-5" aria-hidden="true" />
            {tOr(`club.following.${form}`, "club.following.other", {
              count: String(siteIds.length),
            })}
          </p>
          <button
            type="button"
            onClick={() => removeSites(siteIds)}
            className="min-h-11 self-start font-semibold text-link underline underline-offset-4"
          >
            {t("club.unfollow")}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => addSites(siteIds)}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-[10px] bg-action px-4 font-semibold text-white"
          >
            <Star className="size-5" aria-hidden="true" />
            {t("club.follow")}
          </button>
          <p className="text-[0.875rem] text-muted">{t("club.followHelp")}</p>
        </>
      )}
    </div>
  );
}
