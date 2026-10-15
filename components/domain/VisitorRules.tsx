// "Before you fly" on a visiting-pilots page (D89): the official rules for visitors, how visiting
// pilots find local knowledge, and the sources, each checked on a date.
import { formatDate } from "@/lib/format";
import { t } from "@/lib/messages";
import type { CountryGuide } from "@/lib/types";
import { Anchor } from "@/components/ui/anchor";

const h3 = "font-condensed text-[1.25rem] font-bold";

export function VisitorRules({
  guide,
  showBody = true,
}: {
  guide?: CountryGuide;
  showBody?: boolean;
}) {
  if (!guide || (guide.visitors.length === 0 && !guide.practice?.length)) {
    return <p className="text-muted-strong">{t("visiting.rulesMissing")}</p>;
  }
  return (
    <div className="flex flex-col gap-4" data-testid="visitor-rules">
      {showBody && guide.nationalBody && (
        <p>
          <span className="font-semibold">{t("world.nationalBody")}:</span>{" "}
          <Anchor href={guide.nationalBody.url}>{guide.nationalBody.name}</Anchor>
        </p>
      )}
      {guide.visitors.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {guide.visitors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      {guide.practice && guide.practice.length > 0 && (
        <div>
          <h3 className={h3}>{t("visiting.practiceHeading")}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {guide.practice.map((f) => (
              <li key={f}>{f}</li>
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
