// Events from several sources (SAFA and club calendars) often describe the same event.
import type { BuildWarning, EventItem } from "@/lib/types";
import { normaliseName } from "./match";

/**
 * Keeps one event per title and start day. The first one wins, and providers are read in order,
 * so the national body's listing is kept over a club calendar's copy.
 */
export function dedupeEvents(events: EventItem[], warnings: BuildWarning[]): EventItem[] {
  const seen = new Map<string, EventItem>();
  for (const e of events) {
    const key = `${e.country}|${e.startDate.slice(0, 10)}|${normaliseName(e.title)}`;
    const first = seen.get(key);
    if (first) {
      warnings.push({ code: "event-duplicate", message: `${e.id} repeats ${first.id}; kept the first`, recordId: e.id });
      if (!first.organiserOrgId && e.organiserOrgId) first.organiserOrgId = e.organiserOrgId;
      continue;
    }
    seen.set(key, { ...e });
  }
  return [...seen.values()];
}
