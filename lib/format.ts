// Date formatting for pages, in the country's main time zone (never hard-coded).

/** "2026-10-12…" → "12 Oct 2026". */
export function formatDate(iso: string, timeZone: string): string {
  const date = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Month and day for an event's date block: { month: "OCT", day: "17" }. */
export function dateBlock(iso: string, timeZone: string): { month: string; day: string } {
  const date = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  return {
    month: (parts.find((p) => p.type === "month")?.value ?? "").toUpperCase(),
    day: parts.find((p) => p.type === "day")?.value ?? "",
  };
}
