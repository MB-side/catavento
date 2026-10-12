# 02 · Iteration 1 Specification: Consultation Prototype

**Status:** current · **Last updated:** 9 Oct 2026 · **Owner:** founder · **Builder:** Claude Code

## 1. Purpose

Build a credible, mostly real, static website that the founder can share with pilots, clubs, schools, tandem operators, SAFA, regional associations and data owners to gather feedback. It must prove three things:

1. The **index works**: real sites, clubs, schools, tandem operators and shops, correctly linked and attributed.
2. The **daily habit is plausible**: My Sites with a 3-day wind-direction outlook is something pilots want to open.
3. The **data pipeline works**: public sources refresh nightly without manual effort, with health checks.
4. The **design works beyond Australia**: a small New Zealand sample runs through the same code with its own national body, regions and rules.

## 2. Constraints

| Constraint | Consequence |
|---|---|
| Hosted on **GitHub Pages** (static files only, non-commercial use, deployments must finish within 10 minutes) | Next.js **static export**; no server code, no API routes, no database |
| **No server-side collection of user data** | No accounts, no forms that post to us. My Sites lives in the browser's localStorage. Feedback goes to an external form |
| **No transactions, no monetisation** | No sponsored slots live, no payments. A config flag can show clearly labelled *examples* during consultation |
| Data refreshed by **scheduled GitHub Actions** | Ingest scripts run nightly, write JSON into the repo, and trigger a rebuild |
| Must not block **Iteration 2** (Vercel + Supabase) | Keep data access behind one module (`lib/data`), keep types in one place, and avoid static-export-only patterns that are hard to undo |

## 3. Scope

### In scope

- Home with "I fly" / "New to flying" chooser, and My Sites for returning visitors
- **My Sites** (device-only): save sites, see each with wind range, 3-day outlook, station links, club, status
- **Sites & map**: national map and filterable list; state pages; **site pages** with the **Managed by** club panel
- **Clubs**: directory by state and **club pages** listing managed sites; "Follow club" adds all its sites to My Sites
- **What's on**: events list with filters
- **Gear**: where to buy (brand → Australian importer/dealer), shops and service centres, where to find used gear (links out)
- **New to flying**: tandem finder, learn-to-fly overview and discipline guides, schools directory and side-by-side comparison, SAFA membership explained
- **Directory profiles** for schools, tandem operators, shops, service centres, importers, manufacturers, associations
- **Visiting pilots** page
- **Search** (client-side) across sites, clubs and directory entries
- **Share images** for site and club pages (generated at build time)
- **Prototype banner**, **feedback links** on every page, **Sources**, **Status**, **Bot policy**, **Takedown**, **Privacy**, **Disclaimer** pages
- **Nightly ingest** with change detection and a status report
- Installable to the home screen (web app manifest)
- **Country support**: country-first routes, country switcher, country configuration (`data/manual/countries.yaml`)
- **New Zealand sample** (§5.14)

### Out of scope (Iteration 2 or later, see `docs/08`)

Full New Zealand coverage, other countries, translation, accounts and sync, classifieds posting, enquiry forms, live wind values, alerts and push, Thursday digest email, club claim and admin, pilot reports, RSVPs, reviews, payments, sponsored listings, dark mode, logbook (never).

## 4. Pages and routes

All routes are statically generated. `[country]` is a lowercase ISO country code (`au`, `nz`); `[region]` is the lowercase subdivision part of the ISO 3166-2 code (`nsw`, `vic`, `can`, `auk`). Global pages have no country segment.

| Route | Purpose | Mockup reference |
|---|---|---|
| `/` | Chooser for first-time visitors ("I fly" / "New to flying", with country); returning visitors with saved sites see My Sites inline | n/a |
| `/my-sites` | Saved sites dashboard (spans countries) | `design/mockups/Main.dc.html` |
| `/search` | Client-side search results (current country first) | n/a |
| `/about`, `/sources`, `/status`, `/bot`, `/takedown`, `/privacy`, `/disclaimer`, `/feedback` | Trust and policy pages | n/a |
| `/[country]` | Country home: national body, map, quick links; "Sample coverage" notice where applicable | n/a |
| `/[country]/sites` | Map plus list; filters: region, discipline (PG/HG), wind direction, text | n/a |
| `/[country]/sites/[region]` | Sites in a region | n/a |
| `/[country]/sites/[region]/[site]` | Site page | `SitePage.dc.html` (phone), `SitePageDesktop.dc.html` (desktop) |
| `/[country]/clubs` | Clubs (and other stewards) by region | n/a |
| `/[country]/clubs/[club]` | Club page | `ClubPage.dc.html` |
| `/[country]/whats-on` | Events and national notices | n/a |
| `/[country]/gear`, `/[country]/gear/where-to-buy`, `/[country]/gear/shops`, `/[country]/gear/used` | Gear | n/a |
| `/[country]/new-to-flying` | Hub: tandem or learn | n/a |
| `/[country]/new-to-flying/tandem` | Tandem finder | n/a |
| `/[country]/new-to-flying/learn` and `/learn/[discipline]` | Learn to fly overview; `paragliding`, `hang-gliding`, `paramotoring` | n/a |
| `/[country]/new-to-flying/schools` | Schools directory with compare (up to 3) | n/a |
| `/[country]/directory/[slug]` | Profile for any non-club organisation (school, tandem operator, shop, flight park, national body...) | n/a |
| `/[country]/visiting-pilots` | Flying in that country as a visitor | n/a |

## 5. Feature specifications

### 5.1 Global

- **Prototype banner** (every page, dismissible per session): text in `docs/07` §3. Includes a Feedback link.
- **Navigation** per `docs/01` §4 and `docs/06` §5. Section links (Sites & map, Clubs, What's on, Gear, New to flying) go to the **current country** (from the page, else the visitor's saved choice `ht.country`, else the default country).
- **Country switcher** (desktop top bar, phone menu) lists enabled countries; sample countries are labelled "(sample)".
- **Footer**: sources summary, links to About, Sources and attribution, Status, Bot policy, Takedown, Privacy, Disclaimer, Feedback.
- **"Report a correction"** link on every site, club and directory page, opening the external feedback form with the page URL and record ID pre-filled (if the form supports pre-fill; otherwise shown on the page for copying).
- **Units**: km/h by default; a setting switches to knots (stored on device).

### 5.2 My Sites

- Visitors add or remove a site with a star button on site cards and site pages; "Follow club" adds all of a club's sites.
- Stored in localStorage under `ht.mySites.v1` as `{ siteIds: string[], units: "kmh" | "kt", speedLimits?: { min?: number, max?: number } }`.
- Each saved site shows: name (links to site page), region, **administering club** (links to club page), status, wind-range rose and label, **3-day outlook strip** (morning and afternoon per day), and station buttons that open the provider's live page.
- **"Check these sites in Where To Fly"** button (deep link per `docs/05` §4.6; falls back to the home page).
- **Share my list**: a URL with site IDs in the query string that recreates the list on another device (and lets a club share "all our sites").
- Empty state invites the visitor to browse the map or follow a club.
- Disclaimer per `docs/07` §2.

### 5.3 Outlook (forecast wind direction vs published range)

- Source: Open-Meteo forecast API, fetched **in the browser** at view time for each launch's coordinates (batched where the API allows), hourly `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`, km/h, local timezone. Cached in sessionStorage for 60 minutes.
- **My Sites strip:** for each of the next 3 days, a morning cell (forecast at 10:00 local) and an afternoon cell (14:00 local).
- **Site page grid:** next 3 days, every 2 hours from 06:00 to 20:00.
- **Classification** (implemented once in `lib/wind.ts`, unit-tested):
  - `within` if the direction falls inside any of the site's wind-range arcs, or the site range is "all"
  - `marginal` if outside but within 22.5° of an arc edge
  - `outside` otherwise
  - `light` if wind speed is below 5 km/h (direction not meaningful); shown neutral with "Light"
- Cells show the compass point and speed. Colours and legend per `docs/06`. **Speeds are never judged** unless the visitor has set personal limits, in which case cells outside their limits get a subtle outline and a text label.
- Attribution "Weather data by Open-Meteo.com" next to every outlook. If the fetch fails, show "Forecast unavailable" and the Where To Fly link.
- Launches with approximate or withheld coordinates show no outlook (`docs/04` §5).

### 5.4 Site page

Sections in order (phone and desktop; desktop uses two columns per mockup):

1. Header: site name, region, chips (rating text as published, wind range, status), Save to My Sites, Share, "Official site details" (Site Guide link)
2. **Steward panel** (high prominence): label by steward role (`docs/06` §6: "Managed by" for clubs, "Operated by" for flight parks and operators, "Site holder", "Access managed by", or the "not listed" state), steward name and logo placeholder, contact and website buttons (as published), safety officers and duty pilot (as published, otherwise "Ask the club"), site access (membership, passes or fees if published), steward notices, any secondary body (e.g. the club that publishes the guide for a flight park), the first-flight line (`docs/07` §2) and the country's national-body line from `countries.yaml`.
3. Wind window: rose with the published range
4. Stations: each linked station with provider, ownership (e.g. "club station") and "Open live wind" button
5. Next 3 days outlook grid plus links to Where To Fly, SkySight and Paragliding Map
6. Before you fly: facts from the Site Guide (type, height, rating, main landing name, administering club), "Full official site details" button, SAFA membership note, "Facts from the Australian National Site Guide · synced N days ago"
7. Notices: only site- or club-scoped notices appear here (national SAFA notices are listed on What's on)
8. New to flying here? Tandem operators and schools within 100 km (distance-sorted)
9. What's on nearby (events within 200 km, next 60 days)
10. Other sites this club manages
11. Sources footer for the page

### 5.5 Sites & map

- Map (MapLibre GL) with launch markers clustered; marker popover shows site name, club, range, and link. List view below or beside the map with the same filters. Keyboard-accessible list is the primary interface; the map is enhancement.
- Filters: state, discipline (PG/HG, from Site Guide rating text where determinable, otherwise "unspecified"), wind direction ("works in a NE"), text search.

### 5.6 Clubs

- `/clubs`: grouped by state, each with sites-managed count and link. Regional associations listed separately at the top of each state.
- Club page per mockup: header (name, region, disciplines if known, Follow club, Contact, Website, Join or renew link if published), Sites we manage (cards with range, rating, status, outlook mini-strip), Flying at our sites (four steps per `docs/07` §5, using the country's national body), Club notices (headlines with links, if a source exists), Events, Contacts (only as published by the club or SAFA), Club weather station(s), Nearby clubs, Sources.
- "Claim this club page" is shown as **coming soon** with the feedback link (no claim flow in Iteration 1).

### 5.7 What's on

List of upcoming events (next 6 months) from ingested sources and `data/manual/events.yaml`, each with date, title, location, organiser (linked if known), type, and outbound link. Filters: state, discipline, type. No RSVPs. A **Notices** section on the same page lists national SAFA notice headlines (title, date, link).

### 5.8 Gear

- Where to buy: brand list → Australian importers, dealers and service agents (from seed `brands_or_notes` parsed by hand into `data/manual/brands.yaml`).
- Shops and service centres: directory cards.
- Used gear: short guidance (inspection, reserve repack dates, line checks) per `docs/07`, plus attributed links to places Australians find used gear. No listings are copied.
- A "Classifieds are coming: tell us what you'd want" feedback link.

### 5.9 New to flying

- Hub page with two clear paths: **Try a tandem** and **Learn to fly**.
- Tandem finder: operators by state and region, map, disciplines (PG/HG), published price-from only, what to expect, weight and age notes only if published, link to operator.
- Learn to fly: pathway overview (tandem → intro → licence course → SAFA membership → club), discipline pages, "How to choose a school", "What it costs" (published prices only; otherwise "Contact the school").
- Schools directory with filters (state, discipline) and **Compare** (up to 3 side by side: disciplines, location, accommodation if published, price-from if published, course link).
- SAFA membership explained in plain words with the official link.
- Content rules: `docs/07` §6. Claude Code drafts copy; the founder reviews before deploy (see M6).
- Content is **per country**. For New Zealand (sample) show only the tandem and schools directories from NZHGPA listings plus a short pathway linking to NZHGPA; no costs page.

### 5.10 Search

Client-side index built at build time (e.g. MiniSearch) over sites, clubs, directory entries and events. Accessible combobox in the top bar; full results on `/search`.

### 5.11 Share images

Build-time PNG per site and club (1200×630) using the layout in `SharePreview.dc.html` **without live or forecast data**: site or club name, region, club, wind-range rose, and the Catavento logo lockup with descriptor. Set Open Graph and Twitter meta tags.

### 5.12 Status page

`/status` renders the latest ingest report (`data/generated/_report.json`): each provider, last run time, records found, changes, warnings, and whether the change guard blocked an update.

### 5.13 Partner previews (consultation only)

`site.config.ts` flag `showPartnerPreviews` (default `false`). When `true`, site pages and the tandem finder show a clearly labelled **"Example: where a local school could appear"** card with placeholder content. Never shows real businesses as sponsors.

### 5.14 New Zealand sample

Purpose: prove that a second country works through configuration and data alone.

- **Country config:** `data/manual/countries.yaml` (NZ entry: NZHGPA, regions, time zone, ratings note, `coverage: sample`).
- **Organisations:** NZHGPA, the 11 clubs listed by NZHGPA, schools listed by NZHGPA, and the HighSide flight park (rows with country `NZ` in `data/seed/directory.csv`).
- **Sites:** the five sites in `data/manual/nz-sample-sites.yaml`, with coordinates and wind directions matched from ParaglidingEarth (pge layer, attributed). They deliberately cover three steward cases: club (Port Hills, Te Mata Peak, Mount Maunganui), flight park with a club-published guide (Karioitahi Beach), and steward unknown (Coronet Peak).
- **Station:** Holfuy station 213 (link only).
- Every NZ page shows the **Sample coverage** notice (`docs/07` §10) and uses NZHGPA wording, NZ regions and the Pacific/Auckland time zone. **No SAFA text may appear on NZ pages.**
- Optional (if quick): an `nzhgpa` ingest for the clubs and schools pages; otherwise seed only.

## 6. User stories and acceptance criteria

| ID | Story | Acceptance criteria |
|---|---|---|
| S1 | As a pilot, I save my sites and see them together | Star on any site adds it; `/my-sites` lists it after reload; works without network for the saved list (outlook needs network); empty state shown when none |
| S2 | As a pilot, I see whether the coming days suit my sites | Each saved site shows 6 outlook cells with direction, speed and class; legend visible; Open-Meteo attribution visible; failure state handled |
| S3 | As a pilot, I find who manages a site and how to contact them | Managed by panel appears above the outlook on phone and desktop; club name links to club page; contact and website buttons present when known; "Ask the club" shown when unknown |
| S4 | As a club member, I share all our sites | "Follow club" adds all its sites; "Share my list" produces a URL that recreates the list on another device |
| S5 | As a visitor, I find a tandem near me | Tandem finder filters by state; each operator shows discipline and a link; no invented prices |
| S6 | As a prospective student, I compare schools | Compare up to 3 schools side by side; missing data reads "Not published" |
| S7 | As anyone, I can see where information came from | Every record shows provider and last-checked date; `/sources` lists all providers with tier, licence and attribution |
| S8 | As a data owner, I can ask for changes | `/takedown` and `/bot` explain the process and contact; every page has "Report a correction" |
| S9 | As the founder, I can see if a source broke | Nightly ingest writes `_report.json`; a >20% drop or missing required fields blocks that provider's update and is shown on `/status` |
| S10 | As a phone user, I can install the site | Valid manifest and icons; Lighthouse PWA installability passes |
| S11 | As a visiting pilot in New Zealand, I see New Zealand's rules | NZ pages show the NZHGPA membership line, NZ regions and NZ local times in the outlook; a test asserts no SAFA wording on any `/nz/` page; the Sample coverage notice is visible |
| S12 | As a pilot, I see who is responsible for a site, whatever kind of body it is | Karioitahi Beach shows "Operated by HighSide flight park" with the pass note and the Auckland club guide link; Port Hills shows "Managed by Canterbury club"; Coronet Peak shows the "steward not listed" state with a link to report it |

## 7. Non-functional requirements

- **Performance:** Lighthouse mobile ≥ 90 for Performance, Accessibility, Best Practices and SEO on `/`, a site page and a club page. JS for the map loads only on map views.
- **Accessibility:** WCAG 2.2 AA. Real buttons and links, labels on inputs, visible focus, 44 px touch targets, colour never the only signal (outlook cells carry text).
- **SEO:** static HTML for every page, sitemap, canonical URLs, page titles in the form `{Page title} | Catavento` (home: `Catavento · Paragliding and hang gliding in Australia, all in one place`), `Organization` JSON-LD on every page (`name: Catavento`), and JSON-LD (`SportsActivityLocation` for sites, `SportsOrganization` for clubs, `LocalBusiness` for directory entries, `Event` for events).
- **Privacy:** no cookies; localStorage only for My Sites and settings; optional cookie-less analytics off by default.
- **Resilience:** pages render fully without JavaScript except My Sites, outlook, map and search.
- **Build:** full build plus deploy under 10 minutes.

## 8. Milestones (stop for founder review after each)

| # | Milestone | Done when |
|---|---|---|
| **M0** | Scaffold: Next.js static export, TypeScript strict, Tailwind, shadcn/ui, ESLint/Prettier, Vitest, Playwright, CI and Pages deploy workflows, prototype banner, base layout and navigation | A placeholder home page is live on GitHub Pages; CI green |
| **M1** | Data layer and seed: types and Zod schemas (`docs/04`), **country config**, CSV seed import (both countries), manual overrides, `lib/data`, provider registry, country-first routing skeleton, UI strings in one messages file, `/sources` page | Build generates pages from JSON for AU and NZ; schema tests pass; `/sources` lists every provider |
| **M2** | Ingest pipeline: framework, SAFA schools/clubs/events/notices, Site Guide sites and launches, ParaglidingEarth gap-filler (AU) and NZ sample matching, wind-range parser, de-duplication, change guard, fixtures, nightly workflow, `/status` | A manual workflow run updates `data/generated/` and redeploys; parser and guard tests pass |
| **M3** | Sites: map and list, state pages, site pages with Managed by panel, stations, Site Guide facts, sources, share images, JSON-LD | Every AU site with exact coordinates and the five NZ sample sites have pages; spot-check of the anchor sites (`docs/09` §4) matches the Site Guide; S12 passes |
| **M4** | Clubs: directory, club pages, site ↔ club links, Follow club | Every club in the SAFA and NZHGPA directories has a page; every site with a club steward links to it and back; S11 passes |
| **M5** | My Sites and outlook: storage, dashboard, Open-Meteo fetch, classification, Where To Fly link, share-my-list, manifest | S1, S2, S4 and S10 pass in Playwright |
| **M6** | New to flying, Gear, What's on, Directory profiles, Visiting pilots, Search; drafted copy marked for review | S5 and S6 pass; founder has reviewed and approved all drafted copy |
| **M7** | Consultation readiness: accessibility and performance pass, policy pages, feedback links, link checker, tester README | Section 7 targets met; no broken links; founder sign-off |

## 9. Definition of done (Iteration 1)

All milestones signed off; nightly ingest has run successfully for 7 consecutive days; `/status` green or with understood warnings; the founder has shared the site with at least one club and one school (`docs/09`).

## 10. Founder decisions (defaults Claude Code may assume)

| Decision | Default |
|---|---|
| Name | **Catavento** (decided; `docs/01` §8) |
| Domain | GitHub Pages project URL (set `basePath` accordingly) until catavento.fly is registered and set up |
| Feedback form URL | Placeholder in config; `/feedback` page explains how to send feedback by email until set |
| Analytics | Off |
| Partner previews | Off |
| Map tiles | Claude Code proposes two compliant free options at M3; founder chooses |
| Forecast | Open-Meteo free API for this non-commercial prototype; must change to a paid plan or another licensed provider before any monetisation |
| Units | km/h default, knots optional |
| Theme | Light only |
| Default country | Australia (`AU`) |
| Enabled countries | Australia (full), New Zealand (sample) |
