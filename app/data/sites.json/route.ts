// /data/sites.json: every site's summary, for pages that work in the browser (My Sites).
import { getEnabledCountries } from "@/lib/country";
import { siteSummaries } from "@/lib/site-view";

export const dynamic = "force-static";

export function GET(): Response {
  return Response.json(getEnabledCountries().flatMap((c) => siteSummaries(c)));
}
