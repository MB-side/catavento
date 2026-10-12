// Everything club pages and the clubs directory show, gathered from lib/data at build time.
// "Clubs" here includes regional associations, which also manage sites (e.g. ACTHPA).
import "server-only";
import {
  getEvents,
  getNotices,
  getOrganisation,
  getOrganisations,
  getSites,
  getStations,
} from "@/lib/data";
export { clubPath } from "@/lib/clubs";
import type { Country, EventItem, Notice, Organisation, Site, Station } from "@/lib/types";

const CLUB_KINDS = new Set(["club", "regional_association"]);

export function isClubLike(o: Organisation): boolean {
  return CLUB_KINDS.has(o.kind);
}

/** Clubs and associations in a country, by name. */
export function clubsIn(country: Country): Organisation[] {
  return getOrganisations({ country: country.code })
    .filter(isClubLike)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function clubBySlug(country: Country, slug: string): Organisation | undefined {
  return clubsIn(country).find((o) => o.slug === slug);
}

export interface ClubView {
  managed: Site[]; // the club is the confirmed steward (D47)
  listed: Site[]; // a site guide lists the club as contact, not yet confirmed
  notices: Notice[];
  events: EventItem[];
  stations: Station[];
  association?: Organisation;
  members: Organisation[]; // for an association: clubs linked to it
  nearby: Organisation[]; // other clubs in the same region
}

export function clubView(org: Organisation, today: string): ClubView {
  const sites = getSites(org.country);
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  const managed = sites
    .filter(
      (s) => s.stewardOrgId === org.id || s.alsoAdministeredBy?.some((a) => a.orgId === org.id),
    )
    .sort(byName);
  const listed = sites
    .filter((s) => s.listedContact?.orgId === org.id && !managed.includes(s))
    .sort(byName);
  const notices = getNotices({ orgId: org.id })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  const events = getEvents(org.country).filter(
    (e) => e.organiserOrgId === org.id && (e.endDate ?? e.startDate).slice(0, 10) >= today,
  );
  const stations = getStations().filter((s) => s.ownerOrgId === org.id && s.url);
  const associationId =
    "regionalAssociationId" in org ? (org.regionalAssociationId as string | undefined) : undefined;
  const all = getOrganisations({ country: org.country }).filter(isClubLike);
  const members =
    org.kind === "regional_association"
      ? all
          .filter((o) => "regionalAssociationId" in o && o.regionalAssociationId === org.id)
          .sort(byName)
      : [];
  const nearby = org.regionCode
    ? all
        .filter((o) => o.id !== org.id && o.regionCode === org.regionCode && !members.includes(o))
        .sort(byName)
    : [];
  return {
    managed,
    listed,
    notices,
    events,
    stations,
    association: associationId ? getOrganisation(associationId) : undefined,
    members,
    nearby,
  };
}

/** Sites a club manages and sites listing it as contact, for the directory's counts. */
export function clubCounts(org: Organisation): { managed: number; listed: number } {
  const sites = getSites(org.country);
  const managed = sites.filter((s) => s.stewardOrgId === org.id).length;
  const listed = sites.filter(
    (s) => s.listedContact?.orgId === org.id && s.stewardOrgId !== org.id,
  ).length;
  return { managed, listed };
}
