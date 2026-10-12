// Upcoming events and notices for What's on and the home page, from lib/data at build time.
import "server-only";
import { orgPath } from "@/lib/clubs";
import { getEvents, getNotices, getOrganisation } from "@/lib/data";
import { dateBlock, formatDate } from "@/lib/format";
import type { Country, EventItem } from "@/lib/types";
import type { EventSummary } from "@/components/domain/EventsExplorer";

const DAY = 86_400_000;

/** Events that haven't finished, starting within six months (docs/02 §5.7). */
export function upcomingEvents(country: Country, today: string): EventItem[] {
  const limit = new Date(Date.parse(`${today}T00:00:00Z`) + 183 * DAY).toISOString().slice(0, 10);
  return getEvents(country.code).filter(
    (e) => (e.endDate ?? e.startDate).slice(0, 10) >= today && e.startDate.slice(0, 10) <= limit,
  );
}

export function eventSummary(e: EventItem, country: Country): EventSummary {
  const zone = country.timezones[0] ?? "UTC";
  const d = dateBlock(e.startDate, zone);
  const start = formatDate(e.startDate, zone);
  const end = e.endDate ? formatDate(e.endDate, zone) : undefined;
  const org = e.organiserOrgId ? getOrganisation(e.organiserOrgId) : undefined;
  const name = org?.name ?? e.organiserName;
  return {
    id: e.id,
    title: e.title,
    url: e.url,
    month: d.month,
    day: d.day,
    when: end && end !== start ? `${start} to ${end}` : start,
    place:
      [e.locationText, e.regionCode ? country.regionNames[e.regionCode] : undefined]
        .filter(Boolean)
        .join(", ") || undefined,
    regionCode: e.regionCode,
    type: e.type,
    organiser: name ? { name, href: org ? orgPath(org) : undefined } : undefined,
  };
}

export function nationalNotices(country: Country) {
  return getNotices({ country: country.code })
    .filter((n) => n.scope === "national")
    .sort((a, b) => b.date.localeCompare(a.date));
}
