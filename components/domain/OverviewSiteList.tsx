// An overview country's sites (D83): a plain list that works without JavaScript and stays light
// for a thousand entries. Each entry opens to its facts, a link to its full page on
// ParaglidingEarth, and the outlook on request (OverviewOutlooks).
import { OverviewOutlooks } from "@/components/domain/OverviewOutlooks";
import { t } from "@/lib/messages";
import { siteAnchor } from "@/lib/overview";
import type { OverviewSite } from "@/lib/types";
import { labelArcs } from "@/lib/wind";

const osm = (p: { lat: number; lon: number }) =>
  `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=16/${p.lat}/${p.lon}`;

export function OverviewSiteList({ sites, dataPath }: { sites: OverviewSite[]; dataPath: string }) {
  const newTab = ` ${t("links.newTab")}`;
  return (
    <OverviewOutlooks dataPath={dataPath}>
      <ul className="overview-sites" data-testid="overview-sites">
        {sites.map((s) => {
          const parsed = s.windRanges === "all" || s.windRanges.length > 0;
          const facts = [
            parsed ? t("site.wind.published", { label: s.windLabel }) : undefined,
            s.windMarginal?.length
              ? t("site.wind.possible", { label: labelArcs(s.windMarginal) })
              : undefined,
            s.altitudeM
              ? t("site.facts.takeoffAltitude", { metres: String(s.altitudeM) })
              : undefined,
            s.flyingTypes?.length
              ? s.flyingTypes.map((k) => t(`site.facts.flyingTypes.${k}`)).join(", ")
              : undefined,
            s.disciplines.length
              ? s.disciplines.map((d) => t(`disciplines.${d}`)).join(", ")
              : undefined,
          ].filter((x): x is string => !!x);
          return (
            <li key={s.id} id={siteAnchor(s)}>
              <details>
                <summary>
                  <b>{s.name}</b>
                  {parsed && <span> · {s.windLabel}</span>}
                </summary>
                {facts.length > 0 && <p>{facts.join(" · ")}</p>}
                <p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {t("world.openFull")}
                    <span className="sr-only">{newTab}</span>
                  </a>
                  {s.landing && (
                    <>
                      {" · "}
                      <a href={osm(s.landing)} target="_blank" rel="noopener noreferrer">
                        {t("world.landingMap")}
                        <span className="sr-only">{newTab}</span>
                      </a>
                    </>
                  )}
                </p>
                <button type="button" data-outlook={s.id}>
                  {t("world.showOutlook")}
                </button>
                <div data-outlook-slot={s.id} />
              </details>
            </li>
          );
        })}
      </ul>
    </OverviewOutlooks>
  );
}
