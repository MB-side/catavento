import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { countryPageMetadata, CountryCountsLine, LiveWind } from "@/components/layout/CountryPage";
import { card, h2, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { countryFromParams } from "@/lib/country";
import { eventSummary, upcomingEvents } from "@/lib/events-view";
import { t, type MessageKey } from "@/lib/messages";
import { Anchor } from "@/components/ui/anchor";

export function generateMetadata({ params }: PageProps<"/[country]">) {
  return countryPageMetadata(params, "countryHome");
}

const SECTIONS: { path: string; title: MessageKey; summary: MessageKey }[] = [
  { path: "/sites", title: "pages.sites.title", summary: "pages.sites.summary" },
  { path: "/clubs", title: "pages.clubs.title", summary: "pages.clubs.summary" },
  { path: "/whats-on", title: "pages.whatsOn.title", summary: "pages.whatsOn.summary" },
  { path: "/gear", title: "pages.gear.title", summary: "pages.gear.summary" },
  {
    path: "/new-to-flying",
    title: "pages.newToFlying.title",
    summary: "pages.newToFlying.summary",
  },
  {
    path: "/visiting-pilots",
    title: "pages.visitingPilots.title",
    summary: "pages.visitingPilots.summary",
  },
];

/** Country home (docs/02 §4): sections, national body, coming up and live wind. */
export default async function CountryHome({ params }: PageProps<"/[country]">) {
  const country = await countryFromParams(params);
  if (!country) notFound();
  const seg = `/${country.code.toLowerCase()}`;
  const coming = upcomingEvents(country, new Date().toISOString().slice(0, 10))
    .slice(0, 3)
    .map((e) => eventSummary(e, country));
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={country.name} intro={t("countryHome.intro", { country: country.name })}>
        <CountryCountsLine code={country.code} />
      </PageHeader>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.path} className={card}>
            <Link href={`${seg}${s.path}`} className="font-condensed text-[1.375rem] font-bold">
              {t(s.title, { country: country.name })}
            </Link>
            <p className="mt-1 text-muted-strong">{t(s.summary, { country: country.name })}</p>
          </li>
        ))}
      </ul>
      {coming.length > 0 && (
        <section aria-labelledby="coming" className={card}>
          <h2 id="coming" className={h2}>
            {t("countryHome.comingUp")}
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {coming.map((e) => (
              <li key={e.id}>
                <Anchor href={e.url}>{e.title}</Anchor>{" "}
                <span className="text-[0.875rem] text-muted">· {e.when}</span>
              </li>
            ))}
          </ul>
          <Link href={`${seg}/whats-on`} className={`${linkButton} mt-3`}>
            {t("pages.whatsOn.title")}
          </Link>
        </section>
      )}
      <section aria-labelledby="body" className={card}>
        <h2 id="body" className={h2}>
          {t("countryHome.bodyHeading")}
        </h2>
        <p className="mt-2">{country.nationalBody.membershipLine}</p>
        <Anchor href={country.nationalBody.url} className={`${linkButton} mt-3`}>
          {country.nationalBody.name}
          <ExternalLink className="size-4" aria-hidden="true" />
        </Anchor>
      </section>
      <LiveWind country={country} />
    </div>
  );
}
