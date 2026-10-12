// Club helpers safe for client components (no data reading here: that's lib/data).
import type { Organisation } from "./types";

/** "/au/clubs/canungra-hang-gliding-club"; next/link adds basePath and the trailing slash. */
export function clubPath(org: Pick<Organisation, "country" | "slug">): string {
  return `/${org.country.toLowerCase()}/clubs/${org.slug}`;
}

/** Any organisation's page: clubs and associations have club pages, everyone else a profile. */
export function orgPath(org: Pick<Organisation, "country" | "slug" | "kind">): string {
  return org.kind === "club" || org.kind === "regional_association"
    ? clubPath(org)
    : `/${org.country.toLowerCase()}/directory/${org.slug}`;
}
