import { notFound } from "next/navigation";
import { EventsExplorer } from "@/components/domain/EventsExplorer";
import { countryPageMetadata } from "@/components/layout/CountryPage";
import { card, h2, PageHeader } from "@/components/layout/PageHeader";
import { countryFromParams } from "@/lib/country";
import { eventSummary, eventsJsonLd, nationalNotices, upcomingEvents } from "@/lib/events-view";
import { jsonLdScript } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/messages";

export function generateMetadata({ params }: PageProps<"/[country]/whats-on">) {
  return countryPageMetadata(params, "whatsOn");
}

/** What's on (docs/02 §5.7): upcoming events, and national safety and defect notices. */
export default async function WhatsOnPage({ params }: PageProps<"/[country]/whats-on">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const zone = country.timezones[0] ?? "UTC";
  const upcoming = upcomingEvents(country, new Date().toISOString().slice(0, 10));
  const events = upcoming.map((e) => eventSummary(e, country));
  const regions = country.regions
    .filter((r) => events.some((e) => e.regionCode === r))
    .map((code) => ({ code, name: country.regionNames[code] ?? code }));
  const notices = nationalNotices(country);
  const body = country.nationalBody.shortName ?? country.nationalBody.name;
  return (
    <div className="flex flex-col gap-8">
      {upcoming.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(eventsJsonLd(upcoming, country)) }}
        />
      )}
      <PageHeader title={t("pages.whatsOn.title")} intro={t("whatsOn.intro")} />
      <section aria-labelledby="events">
        <h2 id="events" className={`${h2} mb-3`}>
          {t("whatsOn.eventsHeading")}
        </h2>
        <EventsExplorer events={events} regions={regions} regionLabel={country.regionLabel} />
      </section>
      <section aria-labelledby="notices" className={card}>
        <h2 id="notices" className={h2}>
          {t("whatsOn.noticesHeading")}
        </h2>
        <p className="mt-1 text-[0.875rem] text-muted">{t("whatsOn.noticesIntro", { body })}</p>
        {notices.length === 0 ? (
          <p className="mt-2 text-muted">{t("whatsOn.noticesNone")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5" data-testid="notices">
            {notices.map((n) => (
              <li key={n.id}>
                <a href={n.url}>{n.title}</a>{" "}
                <span className="text-[0.875rem] text-muted">· {formatDate(n.date, zone)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
