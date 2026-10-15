// Shared Playwright setup: every test gets a fake Open-Meteo, so tests never depend on (or load)
// the real forecast service. The fake wind blows from 45° (NE) at 15 km/h, 18 km/h after 14:00.
import { test as base, expect, type Route } from "@playwright/test";

export const FAKE_DAYS = ["2026-10-13", "2026-10-14", "2026-10-15"];

export function fakeForecast(route: Route) {
  const url = new URL(route.request().url());
  const count = (url.searchParams.get("latitude") ?? "").split(",").filter(Boolean).length || 1;
  const times = FAKE_DAYS.flatMap((d) =>
    Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, "0")}:00`),
  );
  const one = {
    hourly: {
      time: times,
      wind_speed_10m: times.map((t) => (Number(t.slice(11, 13)) >= 14 ? 18 : 15)),
      wind_direction_10m: times.map(() => 45),
      wind_gusts_10m: times.map(() => 25),
    },
  };
  return route.fulfill({ json: count === 1 ? one : Array.from({ length: count }, () => one) });
}

export const test = base.extend<{ fakeWeather: void }>({
  fakeWeather: [
    async ({ page }, use) => {
      await page.route("**/api.open-meteo.com/**", fakeForecast);
      // Visit counting never runs in tests: it would slow every page and add test visits to the real counts.
      await page.route(/gc\.zgo\.at|goatcounter\.com/, (route) => route.abort());
      // A stand-in counter, so tests can see what the site would count.
      await page.addInitScript(() => {
        const w = window as unknown as { __counted: unknown[]; goatcounter: unknown };
        w.__counted = [];
        w.goatcounter = { count: (vars: unknown) => w.__counted.push(vars) };
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect };
