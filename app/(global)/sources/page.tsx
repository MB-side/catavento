import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getCountries, getProviders } from "@/lib/data";
import { t, tOr, type MessageKey } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import type { Provider, Tier } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Anchor } from "@/components/ui/anchor";

export const metadata = pageMetadata({
  title: t("pages.sources.title"),
  description: t("pages.sources.summary"),
  path: "/sources",
});

const TIERS: { tier: Tier; label: MessageKey; text: MessageKey; chip: string }[] = [
  {
    tier: "green",
    label: "sources.tierGreen",
    text: "sources.tierGreenText",
    chip: "bg-info-tint text-link",
  },
  {
    tier: "amber",
    label: "sources.tierAmber",
    text: "sources.tierAmberText",
    chip: "bg-notice-tint text-notice-text",
  },
  { tier: "red", label: "sources.tierRed", text: "sources.tierRedText", chip: "bg-ink text-white" },
];

/** "Live wind: {club name} station" → text with the placeholder in italics. */
function Attribution({ text }: { text: string }) {
  const parts = text.split(/(\{[^}]+\})/);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("{") ? <em key={i}>{part.slice(1, -1)}</em> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

function ProviderCard({
  provider,
  countryNames,
}: {
  provider: Provider;
  countryNames: Map<string, string>;
}) {
  const tier = TIERS.find((x) => x.tier === provider.tier);
  const countries = provider.countries.includes("*")
    ? t("sources.allCountries")
    : provider.countries.map((c) => countryNames.get(c) ?? c).join(", ");
  const rows: [MessageKey, React.ReactNode][] = [
    ["sources.uses", provider.uses],
    ["sources.method", provider.method],
    ["sources.schedule", provider.schedule],
    ["sources.credit", <Attribution key="a" text={provider.attribution} />],
    [
      "sources.licence",
      tOr(`sources.licenceNames.${provider.licence}`, "sources.licenceNames.unknown"),
    ],
    ["sources.countries", countries],
  ];
  return (
    <li
      className="rounded-[14px] border border-border bg-surface p-4 lg:p-5"
      id={`provider-${provider.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-condensed text-[1.25rem] font-bold">{provider.name}</h3>
        {tier && (
          <span
            className={cn("rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold", tier.chip)}
          >
            {t(tier.label)}
          </span>
        )}
        {!provider.enabled && (
          <span className="rounded-full bg-outside px-2.5 py-0.5 text-[0.75rem] font-semibold text-muted-strong">
            {t("sources.notUsed")}
          </span>
        )}
      </div>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-[0.9375rem] sm:grid-cols-[10rem_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[0.8125rem] font-medium text-muted sm:pt-0.5">{t(label)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {provider.homepage && (
        <Anchor
          href={provider.homepage}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4"
        >
          {t("sources.website")}
          <span className="sr-only">: {provider.name}</span>
          <ExternalLink className="size-4" aria-hidden="true" />
        </Anchor>
      )}
    </li>
  );
}

/** Sources and attribution (docs/07 §8): every provider with tier, licence, use and credit. */
export default function SourcesPage() {
  const providers = getProviders();
  const countryNames = new Map(getCountries().map((c) => [c.code, c.name]));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-condensed text-[2rem] leading-tight font-bold">
        {t("pages.sources.title")}
      </h1>
      <p className="mt-2 text-[1.0625rem]">{t("sources.intro")}</p>

      <section aria-labelledby="tiers" className="mt-8">
        <h2 id="tiers" className="font-condensed text-[1.375rem] font-bold">
          {t("sources.tiersHeading")}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {TIERS.map(({ tier, label, text, chip }) => (
            <li key={tier} className="rounded-[14px] border border-border bg-surface p-4">
              <span className={cn("rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold", chip)}>
                {t(label)}
              </span>
              <p className="mt-2 text-[0.9375rem] text-muted-strong">{t(text)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="providers" className="mt-10">
        <h2 id="providers" className="font-condensed text-[1.375rem] font-bold">
          {t("sources.providersHeading")}
        </h2>
        <p className="mt-1 text-[0.875rem] text-muted">{t("sources.creditNote")}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} countryNames={countryNames} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="changes" className="mt-10 rounded-[14px] bg-info-tint p-4 lg:p-5">
        <h2 id="changes" className="font-condensed text-[1.25rem] font-bold">
          {t("sources.changesHeading")}
        </h2>
        <p className="mt-1 text-muted-strong">{t("sources.changesText")}</p>
        <Link
          href="/feedback/"
          className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          {t("sources.changesLink")}
        </Link>
      </section>
    </div>
  );
}
