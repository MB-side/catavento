// /data/search.json: what the search page looks through (docs/02 §5.10), built at export time.
import { clubPath, orgPath } from "@/lib/clubs";
import { clubsIn } from "@/lib/club-view";
import { getEnabledCountries } from "@/lib/country";
import { getSites } from "@/lib/data";
import { directoryOrgs } from "@/lib/directory";
import { eventSummary, upcomingEvents } from "@/lib/events-view";
import { sitePath } from "@/lib/sites";
import type { SearchDoc } from "@/lib/search";

export const dynamic = "force-static";

export function GET(): Response {
  const today = new Date().toISOString().slice(0, 10);
  const docs: SearchDoc[] = [];
  for (const c of getEnabledCountries()) {
    const region = (code?: string) => (code ? (c.regionNames[code] ?? code) : undefined);
    for (const s of getSites(c.code)) {
      docs.push({ id: s.id, kind: "site", title: s.name, sub: [region(s.regionCode), c.name].filter(Boolean).join(", "), href: sitePath(s), country: c.code, text: s.typeText ?? "" });
    }
    for (const o of clubsIn(c)) {
      docs.push({ id: o.id, kind: "club", title: o.name, sub: [region(o.regionCode), c.name].filter(Boolean).join(", "), href: clubPath(o), country: c.code, text: (o.aliases ?? []).join(" ") });
    }
    for (const o of directoryOrgs(c)) {
      docs.push({ id: o.id, kind: "org", title: o.name, sub: [o.locality, region(o.regionCode), c.name].filter(Boolean).join(", "), href: orgPath(o), country: c.code, text: [...(o.aliases ?? []), ...o.disciplines].join(" ") });
    }
    for (const e of upcomingEvents(c, today)) {
      const s = eventSummary(e, c);
      docs.push({ id: e.id, kind: "event", title: e.title, sub: [s.when, s.place].filter(Boolean).join(" · "), href: e.url, country: c.code, text: s.organiser?.name ?? "" });
    }
  }
  return Response.json(docs);
}
