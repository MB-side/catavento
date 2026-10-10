# 00 · Documentation Index

**Status:** current · **Applies to:** Iteration 1 (consultation prototype) · **Last updated:** 9 Oct 2026

## Reading order for Claude Code

1. `CLAUDE.md` (standing rules)
2. `docs/02-iteration-1-spec.md` (what to build now)
3. `docs/01-product-brief.md` (why, and the navigation)
4. `docs/03-architecture.md`, `docs/04-data-model.md`, `docs/05-data-sources-and-ingest.md` (how)
5. `docs/06-design-spec.md`, `docs/07-content-and-safety.md` (look, words, safety)
6. `docs/10-decisions-log.md` (why things are the way they are)
7. Skim `docs/08-roadmap.md` so Iteration 1 code does not block Iteration 2

`docs/09-consultation-plan.md` and `docs/research/` are for the founder; read them only for context.

## Precedence (when documents disagree)

1. The founder's latest instruction in the chat
2. `CLAUDE.md`
3. `docs/02-iteration-1-spec.md`
4. `docs/03` to `docs/07`
5. `docs/01`, `docs/08`, `docs/10`
6. `docs/research/*` (background only)

If you find a conflict, follow the higher-precedence document **and** record it in `docs/10-decisions-log.md` under "Open conflicts" so the founder can resolve it.

## Single sources of truth

Each topic is defined in exactly one place. Other documents link to it rather than repeat it.

| Topic | Defined in |
|---|---|
| Scope, pages, acceptance criteria, milestones | `docs/02` |
| Navigation and information architecture | `docs/01` §4 |
| Stack, hosting, repo layout, workflows | `docs/03` |
| Data types and files | `docs/04` |
| Sources, tiers, scraping rules, attribution strings | `docs/05` |
| Colours, type, components, screen layouts | `docs/06` |
| Wording, disclaimers, safety language | `docs/07` |
| Country rules (national body, regions, units, time zones, ratings) | `data/manual/countries.yaml`, typed in `docs/04` §2 |
| Name, descriptor, brand usage | `docs/01` §8 (rules), `docs/06` §9 (logo), `docs/07` §9 (copy) |
| Iterations beyond 1, metrics, revenue switches | `docs/08` |

## Glossary

| Term | Meaning |
|---|---|
| **HouseThermal** | This website's name: always one word. Set in `site.config.ts`. See `docs/01` §8. |
| **House thermal** (pilot term) | The reliable thermal at a site that locals head for first; the origin of the name. |
| **Hub** | Informal word for the site as a whole (the centre of the spoked wheel). |
| **Site** | A named flying site (e.g. "Long Reef NE"). Contains one or more **launches**. |
| **Launch** | A take-off point with coordinates. Coordinates live on launches, not sites. |
| **Wind range** | The wind directions a site works in, as published by the Site Guide (e.g. NNE to ENE). Stored as degree arcs. |
| **Outlook** | Forecast wind direction at a launch compared with its wind range: within range, within 22.5° ("marginal"), or outside. Never called "flyable". |
| **Steward** | The organisation responsible for access and rules at a site, with a role: `club`, `site_holder`, `flight_park`, `operator`, `landowner`, `municipality`, `national_body`, `none` or `unknown`. In Australia and New Zealand it is almost always a club ("administering club"). Shown prominently on every site page. |
| **Country** | ISO 3166-1 code (`AU`, `NZ`). All country rules live in `data/manual/countries.yaml`. |
| **Region code** | ISO 3166-2 subdivision (`AU-NSW`, `NZ-CAN`). Replaces "state" everywhere. |
| **National body** | A country's governing body (SAFA in Australia, NZHGPA in New Zealand), set per country. |
| **Sample coverage** | A country included with limited data (New Zealand in Iteration 1), flagged on its pages. |
| **Provider** | Any external source of data or links (SAFA, Site Guide, ParaglidingEarth, Where To Fly, FreeFlightWx, Holfuy, Open-Meteo, a club website). |
| **Tier** | Green, amber or red rules for how a provider's data may be collected and shown (`docs/05` §2). |
| **Seed** | The CSV files in `data/seed/`, the starting dataset. |
| **Manual overrides** | Hand-curated YAML in `data/manual/` that corrects or supplements scraped data. Always wins. |
| **My Sites** | The visitor's saved sites, stored in their browser only (Iteration 1). |
| **New to flying** | The section for people who want a tandem flight or to learn to fly. |
| **SAFA** | Sports Aviation Federation of Australia, the Australian national body. |
| **NZHGPA** | New Zealand Hang Gliding & Paragliding Association, the New Zealand national body. |
| **ANSG / Site Guide** | Australian National Site Guide (siteguide.org.au). |
| **PGE** | ParaglidingEarth (paraglidingearth.com). |
| **WTF** | Where To Fly (wheretofly.info). Always written out in the UI. |
