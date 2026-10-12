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
