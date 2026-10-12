// Club helpers safe for client components (no data reading here: that's lib/data).
import type { Organisation } from "./types";

/** "/au/clubs/canungra-hang-gliding-club"; next/link adds basePath and the trailing slash. */
export function clubPath(org: Pick<Organisation, "country" | "slug">): string {
  return `/${org.country.toLowerCase()}/clubs/${org.slug}`;
}
