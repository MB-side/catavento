# 05 · Data Sources and Ingest

**Status:** current · **Last updated:** 9 Oct 2026

The hub aggregates publicly available information **with attribution**, and upgrades to official feeds and permissions as relationships form. This document is the single source of truth for which sources are used, how, and how they are credited.

## 1. Principles

1. **Attribute everything.** Every record carries `sources[]`; every page shows a sources line; `/sources` lists every provider.
2. **Facts, not prose.** Take names, coordinates, short fields, dates and links. Never republish descriptive text, rules, hazard notes or articles; link to them.
3. **Be polite.** Respect robots.txt, identify the bot honestly, rate-limit, cache.
4. **Never scrape red-tier sources.** Link to them only.
5. **Respect restricted information** (approximate or members-only coordinates, logged-in areas).
6. **Make removal easy.** Per-provider kill switch, `/takedown` page, action within 24 hours.
7. **Tell sources what we use** in launch week and offer adjustments (`docs/09` §5).

## 2. Tiers

| Tier | Meaning | What may be shown |
|---|---|---|
| **Green** | Facts from public directories, open-licensed data, official APIs | Facts with attribution and link |
| **Amber** | Public but volunteer-run, no published terms, or bandwidth-sensitive | Facts and short labels only, plus a link to the full content; low-frequency collection; owner notified |
| **Red** | Terms forbid automated collection, logged-in content, or copyrighted creative content | **Nothing collected.** Links only (or embeds with written permission, Iteration 2+) |

## 3. Fetcher rules (implemented once in `ingest/core/`)

- Check and obey robots.txt for every host before fetching.
- User agent: `HouseThermalBot/0.1 (+<siteUrl>/bot; <contactEmail>)`.
- **One request at a time per host**, minimum 3 seconds apart (configurable per provider, never lower).
- 30-second timeout, 2 retries with exponential backoff, then record a failure.
- Conditional requests (`If-None-Match`, `If-Modified-Since`) and a raw-response cache in `data/cache/` (gitignored).
- Never send cookies, never log in, never fetch URLs behind authentication.
- **Change guard:** if a provider's record count drops by more than 20% versus its last successful run, or required fields are missing in more than 10% of records, keep the previous data, mark the provider `blocked` in `_report.json`, and continue with other providers.
- Every parser has saved fixtures in `ingest/sources/<provider>/fixtures/` and tests; a parser change without passing fixtures fails CI.
- Store `fetchedAt`, `url` and a `contentHash` for each record's source.

## 4. Provider registry (seed `data/manual/providers.yaml` from this table)

Every provider entry includes `countries: [..]` (e.g. `[AU]`, `[NZ]`, or `["*"]` for global providers such as ParaglidingEarth and Open-Meteo).

| ID | Provider | Tier | Licence | What Iteration 1 uses | Method | Schedule |
|---|---|---|---|---|---|---|
| `safa` | Sports Aviation Federation of Australia | Green | facts | School directory, club directory and club detail pages, events, public safety and advisory notice titles | HTML scrape | Nightly |
| `ansg` | Australian National Site Guide | Amber | facts | Site and launch names, coordinates (respecting precision), short fields (type, height, rating, conditions), administering club name, main landing name, linked weather-station URLs, status, page URL | Bulk export if available, otherwise polite HTML crawl of public site pages | Nightly |
| `pge` | ParaglidingEarth | Green | cc-by-sa-3.0 / odbl-1.0 | AU: sites missing from the Site Guide only, as a separate "community data" layer. NZ: coordinates and wind directions for the sample sites | Official GeoJSON API (request access as their site asks) | Weekly |
| `nzhgpa` | New Zealand Hang Gliding & Paragliding Association | Green | facts | NZ clubs and schools lists (names, regions, websites); national-body facts | Seed now; optional HTML scrape | Weekly |
| `nz-club-guides` | NZ club site guides (e.g. Auckland club) | Amber | facts | Links only in Iteration 1 | Links | n/a |
| `highside` | HighSide flight park | Amber | n/a | Link to passes page | Links | n/a |
| `assoc` | State and regional associations (VHPA, QSA, etc.) | Green | facts | School and club lists for cross-checking | HTML scrape | Weekly |
| `wtf` | Where To Fly | Amber | n/a | **Nothing collected.** Deep links only | Links | n/a |
| `freeflightwx` | FreeFlightWx network | Amber | n/a | **Nothing collected in Iteration 1.** Station links from the seed | Links | n/a |
| `holfuy` | Holfuy | **Red** | proprietary | **Nothing collected.** Station links only | Links | n/a |
| `club-stations` | Club-run station pages | Amber | n/a | Links only | Links | n/a |
| `open-meteo` | Open-Meteo | Green (non-commercial tier) | cc-by-4.0 | Hourly forecast wind, fetched by the visitor's browser | Client-side API | On view |
| `skysight`, `paraglidingmap` | SkySight, Paragliding Map | **Red** | proprietary | Links only | Links | n/a |
| `xcontest` | XContest | Amber | proprietary | Links only (terms for showing flight data not yet checked) | Links | n/a |
| `club-websites` | Individual club websites | Amber | facts | Notice and event headlines, dates and links where a simple public list exists (add per club, manually enabled) | HTML scrape or RSS | Nightly |
| `facebook` | Facebook groups/pages and messaging apps | **Red** | proprietary | Nothing | n/a | n/a |
| `retail` | Retailer and manufacturer sites | Amber/Red | proprietary | Iteration 1: links and seed facts only. Product photos and descriptions never | Links | n/a |

### 4.1 Attribution strings (display exactly)

| Provider | Text |
|---|---|
| `safa` | Source: Sports Aviation Federation of Australia |
| `nzhgpa` | Source: New Zealand Hang Gliding & Paragliding Association |
| `ansg` | Site facts: Australian National Site Guide |
| `pge` | Community site data: © ParaglidingEarth contributors (CC BY-SA 3.0 / ODbL 1.0) |
| `open-meteo` | Weather data by Open-Meteo.com |
| `wtf` | Where To Fly (wheretofly.info) |
| `freeflightwx` | Live wind: FreeFlightWx |
| `holfuy` | Live wind: Holfuy, station {station name} (link to the station page) |
| `club-stations` | Live wind: {club name} station |
| Map tiles | As the chosen tile provider requires, including © OpenStreetMap contributors |

Each attribution links to the provider's page for that record.

### 4.2 Source specifics

- **SAFA:** school directory `https://safa.asn.au/learn-to-fly/flight-schools/`; club directory `https://safa.asn.au/local-clubs/` with detail pages at `/local-clubs/club/?id=<code>`; events `https://safa.asn.au/events`; resources and notices `https://safa.asn.au/pilot-tools/resources/`. The public site also has older copies under an `hgfa.asn.au` domain: **ignore those**.
- **Site Guide:** site list at `https://siteguide.org.au/Sites`, details at `/Sites/Details/{Site Name}`; the About page lists state associations. First check the Downloads page for a bulk export and prefer it. A site contains launches; only launches carry coordinates. "Conditions" is prose (parse per §5). Many site pages link a weather station: capture those URLs as station links. Some sites publish deliberately approximate coordinates for members only: set `precision: "approximate"`.
- **ParaglidingEarth:** GeoJSON endpoints include sites by country, by bounding box, around a point, and modified since a date. Use country (Australia) for the initial load and "modified since" afterwards.
- **Where To Fly:** filters are encoded in the URL. The view for specific sites is `https://wheretofly.info/wtf.html?sites=<slug>+<slug>`. Slugs are not published; use `data/manual/wtf-slugs.yaml` and fall back to `https://wheretofly.info/` when unknown. Never scrape.
- **NZHGPA:** about `https://nzhgpa.org.nz/about-us/`, clubs `https://nzhgpa.org.nz/local-clubs/`, schools `https://nzhgpa.org.nz/finding-a-school/`, membership `https://nzhgpa.org.nz/membership/`. Club officer names and phone numbers are published there; show them only as each club provides them (Iteration 2 club claims), not in Iteration 1.
- **Open-Meteo:** client-side only. The free tier is for non-commercial use; this prototype is non-commercial. Switch to a paid plan or another licensed provider before monetisation (`docs/08`).

## 5. Parsing and matching rules

### 5.1 Wind range from Site Guide "Conditions"

Implemented in `lib/wind.ts`, shared by ingest and UI.

- A single compass point becomes an arc of ± half its resolution: 8-point names (N, NE, E…) ± 22.5°; 16-point names (NNE, ENE…) ± 11.25°. Full words ("North East") map to the same points.
- A range "A to B", "A-B" or "A – B" becomes the **shorter** clockwise or anticlockwise arc between the two bearings, with no padding.
- Commas or "and" separate multiple points or ranges.
- Parenthetical notes such as "(best WNW)" are ignored for the range and kept in `conditionsText`.
- "All", "Any" and "Various" mean every direction (`"all"`).
- Unparseable text: `windRanges: []`, label "See official details", and a warning in `_report.json`.

| Input | Expected |
|---|---|
| `North East` | 22.5°–67.5° (label "NNE–ENE") |
| `South to South East` | 135°–180° (label "S–SE") |
| `E-NE` | 45°–90° |
| `SSW to SSE` | 157.5°–202.5° |
| `NW- WSW (best WNW)` | 247.5°–315° |
| `All` | all |

### 5.2 Classification

`within`, `marginal` (within 22.5° of an arc edge), `outside`, and `light` (< 5 km/h). Defined in `docs/02` §5.3.

### 5.3 De-duplication across sources

- Compare launches by distance only: **< 250 m merge**, **250–400 m report**, **> 400 m separate**.
- Never merge records from the same provider.
- In Australia the Site Guide supplies name and position when merged; ParaglidingEarth records appear only when nothing matches.
- Never auto-merge launches with approximate coordinates.

### 5.4 Club matching

Normalise names (case, "&" vs "and", "Inc", punctuation), then resolve via `data/manual/club-aliases.yaml` **within the same country**. Unresolved club names from the Site Guide are listed in `_report.json` for manual mapping. Never guess a club link.

### 5.5 Stations for a site

Curated stations from `data/manual/site-stations.yaml` first, then station URLs captured from the Site Guide page, then nearest seed stations with exact coordinates (on site ≤ 200 m, nearby ≤ 2 km, labelled with distance). Hidden stations are never shown.

## 6. Status report

`_report.json` per provider: `status` (`ok`, `warning`, `blocked`, `failed`, `disabled`), `startedAt`, `finishedAt`, `recordsFound`, `recordsChanged`, `warnings[]`, `guardDecision`. Rendered at `/status`.
