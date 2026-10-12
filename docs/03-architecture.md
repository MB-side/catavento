# 03 · Architecture (Iteration 1)

**Status:** current · **Last updated:** 12 Oct 2026

## 1. Overview

```
                 GitHub repository (single source of truth)
 ┌──────────────────────────────────────────────────────────────────┐
 │ data/seed/*.csv      data/manual/*.yaml      ingest/ (scrapers)  │
 │         │                    │                     │             │
 │         └──────────► scripts/build-data.ts ◄───────┘             │
 │                              │                                   │
 │                     data/generated/*.json (+ _report.json)       │
 │                              │                                   │
 │                   Next.js static export (out/)                   │
 └──────────────────────────────┬───────────────────────────────────┘
                                ▼
                         GitHub Pages (static)
                                │
             Browser: localStorage (My Sites) · Open-Meteo (outlook)
                      · map tiles · outbound links to providers
```

- **No server.** Everything a visitor sees is pre-rendered HTML plus small client-side features.
- **Scheduled ingest** (GitHub Actions, a daily check-in that runs each source only when its own schedule says it is due; D49) refreshes public data, validates it, writes JSON, commits if changed, and redeploys.
- **Iteration 2** reuses the same Next.js app on Vercel with Supabase (§9).

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router) with `output: "export"`** | Static HTML per route via `generateStaticParams` |
| Language | **TypeScript, strict** | Shared types in `lib/types.ts`, Zod schemas in `lib/schemas.ts` |
| Styling | **Tailwind CSS** with tokens from `docs/06`; **shadcn/ui** components where useful | No CSS-in-JS runtime |
| Fonts | **Barlow** and **Barlow Condensed** via `next/font/google` | Downloaded at build and self-hosted; no runtime calls to Google |
| Map | **MapLibre GL JS**, loaded only on map views | Tile provider chosen at M3 (`docs/02` §10); attribution shown |
| Search | **MiniSearch** (or similar) index generated at build | Loaded on first search interaction |
| UI text | All interface strings in `messages/en.json`, read through one small `t()` helper (or next-intl) | English only in Iteration 1; translation-ready |
| Forecast | **Open-Meteo** forecast API from the browser | Attribution required; prototype use only (`docs/05` §4.9) |
| Share images | **Satori + resvg** at build time | One PNG per site and club |
| Ingest | **Node + tsx**, **undici/fetch**, **cheerio**, **robots-parser**, **p-limit** (or Bottleneck), **csv-parse**, **yaml**, **Zod** | Runs in GitHub Actions and locally |
| Tests | **Vitest** (unit, parsers with fixtures), **Playwright** (e2e on the built site), **linkinator** (link check) | Lighthouse CI optional |
| Package manager | **pnpm** | Node LTS |
| Hosting | **GitHub Pages** via `actions/deploy-pages` | Pages source set to "GitHub Actions" |

Use current stable versions at the time of building; record versions in `package.json` and note any significant choice in `docs/10`.

## 3. Repository layout

```
/
├─ CLAUDE.md
├─ KICKOFF_PROMPT.md
├─ README.md                      # for humans; Claude Code adds a "Run locally" section
├─ site.config.ts                 # name, basePath, feedback URL, flags (§7)
├─ messages/en.json               # every UI string
├─ app/                           # Next.js routes (docs/02 §4)
│  ├─ [country]/...               # country-first routes
│  ├─ (global)/...                # /, /my-sites, /search, policy pages
│  └─ layout.tsx                  # banner, nav, footer
├─ components/
│  ├─ ui/                         # shadcn primitives
│  └─ domain/                     # SiteCard, OutlookStrip, OutlookGrid, WindRose, StewardPanel, CountrySwitcher, StationRow, ...
├─ lib/
│  ├─ types.ts                    # docs/04 types
│  ├─ schemas.ts                  # Zod schemas mirroring types
│  ├─ data/                       # the ONLY module that reads data files (swap to DB in Iteration 2)
│  ├─ wind.ts                     # range parsing helpers, classification (shared by ingest and UI)
│  ├─ geo.ts                      # distance, nearest, bounding boxes
│  ├─ country.ts                  # country config access, current-country resolution, units
│  ├─ forecast.ts                 # Open-Meteo client, caching, error states
│  ├─ storage.ts                  # localStorage My Sites and settings
│  └─ seo.ts                      # meta tags, JSON-LD builders
├─ ingest/
│  ├─ core/                       # fetcher (robots, rate limit, cache), runner, change guard, report
│  └─ sources/<provider>/         # fetch.ts, parse.ts, normalise.ts, fixtures/, parse.test.ts
├─ scripts/
│  ├─ build-data.ts               # merge seed + manual + ingest → data/generated
│  ├─ build-search-index.ts
│  └─ build-share-images.ts
├─ data/
│  ├─ seed/                       # CSVs from this pack (read-only inputs)
│  ├─ manual/                     # hand-curated YAML (always wins)
│  ├─ ingest/                     # latest normalised output per provider (committed)
│  ├─ generated/                  # merged JSON the site reads (committed) + _report.json
│  └─ cache/                      # raw HTTP cache (gitignored)
├─ public/                        # icons, manifest, static assets
├─ tests/                         # Playwright specs
├─ design/mockups/                # reference only, never imported
├─ docs/                          # this documentation
└─ .github/workflows/             # ci.yml, deploy.yml, ingest.yml
```

## 4. Build configuration

- `next.config` : `output: "export"`, `images: { unoptimized: true }`, `trailingSlash: true`, `basePath` and `assetPrefix` from `site.config.ts` (empty when a custom domain is used, `/<repo-name>` for a project page).
- Every internal link and asset must respect `basePath` (use Next's `Link` and helpers; never hard-code `/`).
- Build order: `build-data` → `build-search-index` → `build-share-images` → `next build`.
- Fail the build if `data/generated` fails schema validation.

## 5. Workflows

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | Pull requests and pushes to non-main branches | install → lint → typecheck → unit tests → build → Playwright against the static output → link check |
| `deploy.yml` | Push to `main`, manual dispatch, and **`workflow_call`** | install → build → `actions/upload-pages-artifact` → `actions/deploy-pages` |
| `ingest.yml` | Daily check-in (02:30 Australian Eastern standard time; cron in UTC), manual dispatch (optionally one provider, optionally forced) | install → run the providers that are due → `build-data` → if `data/` changed: commit with a bot identity, then **call `deploy.yml`** as a reusable workflow |

**Gotcha:** commits pushed with the default `GITHUB_TOKEN` do not trigger other workflows, so `ingest.yml` must call `deploy.yml` directly (reusable workflow) rather than relying on the push.

Ingest runs must be polite (`docs/05` §3) and finish well inside GitHub's job limits; providers run sequentially per host and in parallel across hosts.

## 6. Data flow and precedence

1. **Seed** (`data/seed/*.csv`) provides the starting set of organisations and stations.
2. **Ingest** (`data/ingest/<provider>.json`) adds and refreshes records from providers.
3. **Manual overrides** (`data/manual/*.yaml`) correct, hide, link or supplement anything.
4. `build-data.ts` merges with precedence **manual > ingest > seed**, resolves IDs and relationships (site ↔ club, site ↔ stations, organisation ↔ location), computes derived fields (distances, nearby lists), and validates with Zod.
5. The app reads only `data/generated/*.json` through `lib/data`.

Details: `docs/04`.

## 7. `site.config.ts`

```ts
export const siteConfig = {
  name: "Catavento",
  descriptor: "Paragliding and hang gliding, all in one place",
  titleDescriptor: "Paragliding and hang gliding in Australia, all in one place",
  whyTheName: "Catavento is Portuguese for pinwheel: it means “catch the wind”. Like a pinwheel, everything here turns around one centre: the sites, clubs, schools and pilots of free flight.",
  basePath: "",                    // "/<repo>" for a GitHub project page
  siteUrl: "",                     // full public URL, used for canonical and share images
  feedbackFormUrl: "",             // external form; empty shows the email fallback on /feedback
  contactEmail: "",                // for takedown, bot policy and feedback fallback
  analytics: { enabled: false, provider: "" },
  showPartnerPreviews: false,      // docs/02 §5.13
  defaultCountry: "AU",
  enabledCountries: ["AU", "NZ"],   // details in data/manual/countries.yaml
  defaultUnits: "kmh" as "kmh" | "kt",   // per-country defaults override
  prototypeBanner: true,
};
```

## 8. Testing strategy

- **Unit (Vitest):** wind-range parser (examples in `docs/05` §5), classification, distance helpers, merge precedence, change guard, every provider parser against saved HTML/JSON fixtures.
- **E2E (Playwright, against `out/` served locally):** the stories in `docs/02` §6.
- **Link check:** internal links must pass; external link failures are reported, not blocking.
- **Accessibility:** axe checks in Playwright on key pages.

## 9. Path to Iteration 2 (do not build now, do not block)

| Iteration 1 | Iteration 2 change |
|---|---|
| Static export on GitHub Pages | Remove `output: "export"`; deploy to Vercel |
| JSON files read by `lib/data` | Same `lib/data` interface backed by Supabase Postgres (+PostGIS); import script loads JSON |
| Nightly GitHub Actions ingest | Scheduled jobs (Vercel Cron or Supabase scheduled functions); same `ingest/` modules |
| localStorage My Sites | Supabase Auth; local list syncs to the account on sign-in |
| Station links only | Server-side, permission-gated live values and widgets |
| External feedback form | Native forms: corrections, enquiries, club claims |
| Open-Meteo free API | Paid forecast plan or other licensed provider |
| Australia (full) + New Zealand (sample) | NZ full coverage; further countries added by configuration and per-country providers |

Keep business logic in `lib/` (pure functions), keep pages thin, and avoid browser-only assumptions in shared modules.
