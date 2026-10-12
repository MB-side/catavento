"use client";

// My Sites (docs/02 §5.2), first part: the sites saved on this device, with a way to remove them.
// Stars on every site and the 3-day outlook arrive in M5.
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SiteCard } from "@/components/domain/SiteCard";
import { t } from "@/lib/messages";
import { mySitesSnapshot, removeSites, subscribeMySites } from "@/lib/my-sites";
import { withBasePath } from "@/lib/paths";
import type { SiteSummary } from "@/lib/site-summary";

export function MySitesList({ sitesHref }: { sitesHref: string }) {
  const snapshot = useSyncExternalStore(subscribeMySites, mySitesSnapshot, () => "");
  const ids = snapshot ? snapshot.split("|") : [];
  const [all, setAll] = useState<SiteSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(withBasePath("/data/sites.json"))
      .then((r) =>
        r.ok ? (r.json() as Promise<SiteSummary[]>) : Promise.reject(new Error(String(r.status))),
      )
      .then(setAll)
      .catch(() => setFailed(true));
  }, []);

  if (ids.length === 0) {
    return (
      <div
        className="rounded-[14px] border border-border bg-surface p-4 lg:p-5"
        data-testid="my-sites-empty"
      >
        <p>{t("mySites.empty")}</p>
        <Link
          href={sitesHref}
          className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          {t("mySites.browse")}
        </Link>
      </div>
    );
  }
  if (failed) return <p className="text-muted">{t("mySites.loadFailed")}</p>;
  if (!all) return <p className="text-muted">{t("mySites.loading")}</p>;

  const byId = new Map(all.map((s) => [s.id, s]));
  const saved = ids.map((id) => byId.get(id)).filter((s): s is SiteSummary => !!s);
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="my-sites-list">
        {saved.map((s) => (
          <SiteCard key={s.id} site={s}>
            <button
              type="button"
              onClick={() => removeSites([s.id])}
              className="mt-1 min-h-11 text-[0.875rem] font-semibold text-link underline underline-offset-4"
            >
              {t("mySites.remove")}
              <span className="sr-only">: {s.name}</span>
            </button>
          </SiteCard>
        ))}
      </ul>
    </div>
  );
}
