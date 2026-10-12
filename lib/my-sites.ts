// My Sites storage (docs/02 §5.2): kept on this device only, in localStorage, never sent anywhere.
// Client-side only.

export const MY_SITES_KEY = "catavento.mySites.v1";
const CHANGE_EVENT = "catavento:my-sites";

export interface MySitesStore {
  siteIds: string[];
  units: "kmh" | "kt";
  speedLimits?: { min?: number; max?: number };
}

const EMPTY: MySitesStore = { siteIds: [], units: "kmh" };

export function readMySites(): MySitesStore {
  try {
    const raw = window.localStorage.getItem(MY_SITES_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<MySitesStore>;
    return {
      ...EMPTY,
      ...parsed,
      siteIds: Array.isArray(parsed.siteIds)
        ? parsed.siteIds.filter((x) => typeof x === "string")
        : [],
    };
  } catch {
    return EMPTY;
  }
}

function write(store: MySitesStore): void {
  try {
    window.localStorage.setItem(MY_SITES_KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked (e.g. private mode): nothing more we can do.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addSites(ids: string[]): void {
  const store = readMySites();
  write({ ...store, siteIds: [...new Set([...store.siteIds, ...ids])] });
}

export function removeSites(ids: string[]): void {
  const drop = new Set(ids);
  const store = readMySites();
  write({ ...store, siteIds: store.siteIds.filter((id) => !drop.has(id)) });
}

/** For useSyncExternalStore: re-render when My Sites changes here or in another tab. */
export function subscribeMySites(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === MY_SITES_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** A stable snapshot string (useSyncExternalStore needs equal values between calls). */
export function mySitesSnapshot(): string {
  return readMySites().siteIds.join("|");
}

// ---------- settings: units and personal speed limits (docs/02 §5.1, §5.3) ----------

export function setUnits(units: MySitesStore["units"]): void {
  write({ ...readMySites(), units });
}

/** Personal limits in km/h; blank means none. Speeds are never judged without them. */
export function setSpeedLimits(limits: { min?: number; max?: number }): void {
  const clean = {
    min: Number.isFinite(limits.min) ? limits.min : undefined,
    max: Number.isFinite(limits.max) ? limits.max : undefined,
  };
  write({
    ...readMySites(),
    speedLimits: clean.min === undefined && clean.max === undefined ? undefined : clean,
  });
}

/** Snapshot of the settings for useSyncExternalStore: "kmh|min|max". */
export function settingsSnapshot(): string {
  const s = readMySites();
  return `${s.units}|${s.speedLimits?.min ?? ""}|${s.speedLimits?.max ?? ""}`;
}

export function parseSettings(snapshot: string): {
  units: MySitesStore["units"];
  min?: number;
  max?: number;
} {
  const [units, min, max] = snapshot.split("|");
  return {
    units: units === "kt" ? "kt" : "kmh",
    min: min ? Number(min) : undefined,
    max: max ? Number(max) : undefined,
  };
}

// ---------- a local copy of saved sites, so My Sites works without a connection (S1) ----------

const SUMMARY_KEY = "catavento.siteCache.v1";

export function readSummaryCache<T extends { id: string }>(): Record<string, T> {
  try {
    return JSON.parse(window.localStorage.getItem(SUMMARY_KEY) ?? "{}") as Record<string, T>;
  } catch {
    return {};
  }
}

export function cacheSummaries<T extends { id: string }>(summaries: T[]): void {
  try {
    const cache = readSummaryCache<T>();
    for (const s of summaries) cache[s.id] = s;
    window.localStorage.setItem(SUMMARY_KEY, JSON.stringify(cache));
  } catch {
    // Not fatal: the list is rebuilt from /data/sites.json when online.
  }
}

export function toggleSite<T extends { id: string }>(summary: T): void {
  if (readMySites().siteIds.includes(summary.id)) removeSites([summary.id]);
  else {
    cacheSummaries([summary]);
    addSites([summary.id]);
  }
}
