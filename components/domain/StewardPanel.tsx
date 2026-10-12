// Steward panel (docs/02 §5.4, docs/06 §6): who manages the site, how to contact them, and the
// first-flight and national-body lines. Same prominence for every role. A site guide's contact on
// its own is shown as "Contact listed in the Site Guide", never as "Managed by" (D47).
import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";
import { clubPath } from "@/lib/clubs";
import { correctionFormUrl } from "@/lib/links";
import { t } from "@/lib/messages";
import { absoluteUrl } from "@/lib/paths";
import { sitePath, stewardLabel } from "@/lib/sites";
import type { Country, Organisation, Site, StewardRole } from "@/lib/types";

const STEWARD_WORD: Partial<Record<StewardRole, "club" | "site_holder" | "operator">> = {
  club: "club",
  national_body: "club",
  site_holder: "site_holder",
  landowner: "site_holder",
  municipality: "site_holder",
  flight_park: "operator",
  operator: "operator",
};

interface StewardPanelProps {
  site: Site;
  country: Country;
  steward?: Organisation;
  listed?: Organisation;
  also: { org: Organisation; note?: string }[];
}

/** The organisation's name, linked to its club page when it has one. */
function OrgName({ org, fallback }: { org?: Organisation; fallback?: string }) {
  const name = org?.name ?? fallback;
  const linked = org && (org.kind === "club" || org.kind === "regional_association");
  return (
    <p className="mt-1 font-condensed text-[1.5rem] leading-tight font-bold">
      {linked ? <Link href={clubPath(org)}>{name}</Link> : name}
    </p>
  );
}

function ContactButtons({
  email,
  website,
  name,
}: {
  email?: string;
  website?: string;
  name: string;
}) {
  if (!email && !website) return null;
  const button =
    "inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 font-semibold no-underline";
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {email && (
        <a href={`mailto:${email}`} className={`${button} bg-ink text-white hover:text-white`}>
          <Mail className="size-4" aria-hidden="true" />
          {t("site.steward.contact")}
          <span className="sr-only">: {name}</span>
        </a>
      )}
      {website && (
        <a
          href={website}
          className={`${button} border border-border-strong bg-surface text-ink hover:text-ink`}
        >
          {t("site.steward.website")}
          <span className="sr-only">: {name}</span>
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

export function StewardPanel({ site, country, steward, listed, also }: StewardPanelProps) {
  const label = stewardLabel(site);
  const confirmedByClub = site.sources.some((s) => s.providerId === "club-websites");
  const word = STEWARD_WORD[site.stewardRole];
  const listedName = listed?.name ?? site.listedContact?.name;

  return (
    <section
      aria-labelledby="steward"
      className="rounded-[14px] border-2 border-link bg-surface p-4 lg:p-5"
      data-testid="steward-panel"
    >
      <h2 id="steward" className="text-[0.875rem] font-semibold tracking-wide text-link uppercase">
        {t(`site.steward.${label}`)}
      </h2>

      {steward && (
        <>
          <OrgName org={steward} />
          {confirmedByClub && label === "managedBy" && (
            <p className="mt-1 text-[0.875rem] text-muted">{t("site.steward.confirmed")}</p>
          )}
          <ContactButtons
            email={steward.emailPublic}
            website={steward.website}
            name={steward.name}
          />
        </>
      )}

      {!steward && label === "listedContact" && listedName && (
        <>
          <OrgName org={listed} fallback={listedName} />
          <ContactButtons
            email={listed?.emailPublic}
            website={listed?.website ?? site.listedContact?.url}
            name={listedName}
          />
        </>
      )}

      {site.siteAccessNote && (
        <p className="mt-3">
          <span className="font-semibold">{t("site.steward.access")}: </span>
          {site.siteAccessNote}
        </p>
      )}

      {also.length > 0 && (
        <ul className="mt-3 space-y-1">
          {also.map(({ org, note }) => (
            <li key={org.id}>
              <span className="font-semibold">{t("site.steward.also")}: </span>
              {org.website ? <a href={org.website}>{org.name}</a> : org.name}
              {note ? ` (${note})` : ""}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-[10px] bg-info-tint p-3 text-[0.9375rem] text-muted-strong">
        <p>
          {steward && word
            ? t("site.steward.firstFlight", { steward: t(`site.steward.word.${word}`) })
            : listedName
              ? t("site.steward.firstFlightListed", { name: listedName })
              : t("site.steward.noSteward")}
        </p>
        <p className="mt-1">{country.nationalBody.membershipLine}</p>
      </div>

      {label === "notListed" && (
        <a
          href={correctionFormUrl(absoluteUrl(sitePath(site)), site.id)}
          className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          {t("site.steward.tellUs")}
        </a>
      )}
    </section>
  );
}
