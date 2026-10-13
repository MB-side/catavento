// "How flying works here" for an overview country or region (D83): short facts from official
// sources, the national body, and where to find more. Says so plainly when there's no guide yet.
import { formatDate } from "@/lib/format";
import { t } from "@/lib/messages";
import type { CountryGuide } from "@/lib/types";
import { Anchor } from "@/components/ui/anchor";

const h3 = "font-condensed text-[1.25rem] font-bold";

export function OverviewGuide({ guide, name }: { guide?: CountryGuide; name: string }) {
  if (!guide) {
    return (
      <p className="rounded-[14px] bg-info-tint p-4 text-muted-strong" data-testid="guide-missing">
        {t("world.guideMissing", { country: name })}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4" data-testid="overview-guide">
      {guide.nationalBody && (
        <p>
          <span className="font-semibold">{t("world.nationalBody")}:</span>{" "}
          <Anchor href={guide.nationalBody.url}>{guide.nationalBody.name}</Anchor>
        </p>
      )}
      {guide.visitors.length > 0 && (
        <div>
          <h3 className={h3}>{t("world.visitorsHeading")}</h3>
          <ul className="mt-1 list-disc pl-5">
            {guide.visitors.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {guide.learners.length > 0 && (
        <div>
          <h3 className={h3}>{t("world.learnersHeading")}</h3>
          <ul className="mt-1 list-disc pl-5">
            {guide.learners.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {guide.links.length > 0 && (
        <div>
          <h3 className={h3}>{t("world.linksHeading")}</h3>
          <ul className="mt-1 flex flex-col gap-1">
            {guide.links.map((l) => (
              <li key={l.url}>
                <Anchor href={l.url}>{l.label}</Anchor>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[0.875rem] text-muted">
        {t("world.guideChecked", { date: formatDate(guide.checked, "UTC") })}{" "}
        {guide.sources.map((s, i) => (
          <span key={s}>
            {i > 0 && " · "}
            <Anchor href={s}>{t("world.source", { n: String(i + 1) })}</Anchor>
          </span>
        ))}
      </p>
    </div>
  );
}
