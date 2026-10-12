# 07 · Content and Safety

**Status:** current · **Last updated:** 9 Oct 2026

## 1. Voice and style

- Plain, friendly Australian English (organisation, colour, metres, km/h). Short sentences. No jargon on New to flying pages without a one-line explanation.
- Never invent facts. If something isn't published, say **"Not published"**, **"Ask the club"** or **"Contact the school"**. Square-bracket placeholders like `[price]` must never appear on a deployed page.
- Attribute in the UI, not just in the footer (`docs/05` §4.1).

## 2. Safety language (non-negotiable)

| Never say | Say instead |
|---|---|
| "Flyable", "safe", "good to go", "it's on", "best site today" | "Forecast wind direction within the published range" / "outside the published range" |
| Our own summary of hazards, rules, landing notes or airspace | "See the official site details" (link) and "Contact the club" |
| Default "good" wind speeds | Show speeds; let visitors set their own limits |
| "Approved", "certified" or "recommended" about any business | "Listed by SAFA" (only when true) or nothing |

**Standard disclaimer** (on My Sites, every site page, every outlook):

> Information only. Forecast direction is compared with each site's published wind range; speeds are shown but not judged. Always check the official site guide, the administering club and conditions on the day. You are responsible for your decision to fly.

**First-flight line** (steward panel, club pages, visiting-pilot page), with `{steward}` = "club", "site holder" or "operator" by role:

> New to this site or visiting? Contact the {steward} before your first flight for site rules, protocols and hazards.

When the steward is `none` or `unknown`:

> No managing body is listed for this site. Check local rules with the national body or a local club before flying.

**National-body line:** use `membershipLine` from `data/manual/countries.yaml` for the page's country. Australia: "Current SAFA membership is required to fly in Australia, including for visiting pilots." New Zealand: "NZHGPA membership (or a visitor membership) is required to fly in New Zealand." Never show one country's line on another country's pages.

## 3. Prototype banner

> Prototype for community feedback. Independent: not affiliated with SAFA, the Site Guide or any club. Information may be incomplete or out of date. **Tell us what you think.**

## 4. Attribution placement

- Sources line under every data block (site facts, outlook, stations, directory facts).
- Page footer summarises sources for that page.
- `/sources` lists every provider with tier, licence, what we use, how often, and contact for changes.

## 5. Club page: "Flying at our sites" (use this text, substituting the club name)

1. **Hold current {national body} membership.** (Use the country's `membershipLine`.)
2. **Contact the club before your first flight** at any of our sites for site rules, protocols and hazards.
3. **Check each site's rating and supervision requirements.** Some sites need a club safety officer or duty pilot present for lower-rated pilots.
4. **Join the club** if you fly here regularly. Membership details: see the club's website (or the published details if we have them).

## 6. New to flying: content plan

Claude Code drafts these pages from this plan and the data; the founder reviews before deploy (M6). Facts must come from `data/` or from SAFA and operator pages, with links.

| Page | Purpose | Must include | Must not include |
|---|---|---|---|
| *All pages* | Per country; New Zealand (sample) shows only the tandem and schools directories and a short pathway linking to NZHGPA | |
| New to flying (hub) | Two clear paths: **Try a tandem** or **Learn to fly** | Short intro; big buttons; tandem operators near you; how learning works in one paragraph | Promises about safety or outcomes |
| Tandem finder | Find a tandem by area | Operators by state/region and map; discipline (paragliding or hang gliding); published price-from only; "What to expect" (weather-dependent, booking flexibility varies by operator, weight and age limits vary: check with the operator) | Invented prices or limits |
| Learn to fly | The pathway | Tandem or intro day → licence course with a SAFA-listed school → SAFA membership → join a club and fly with mentors; link to SAFA's "Four steps to flying" and "Join" pages | Our own version of SAFA's training requirements |
| Paragliding / Hang gliding / Paramotoring | What each is like | Plain description, where people learn, typical course format (from published school pages), links to schools offering it | Comparisons claiming one is safer |
| How to choose a school | Practical checklist | Location and sites, discipline, course format, accommodation, equipment use/purchase terms, SAFA listing, talk to the instructor | Rankings |
| What it costs | Honest ranges | Only published prices, each with source and date (e.g. one school publishes a 9+ day live-in PG2 course at A$2,890 including accommodation and an equipment credit); "Contact the school" otherwise; SAFA membership fees link | Averages we cannot source |
| Schools directory and compare | Find and compare | Filters, compare up to 3, "Not published" for gaps | "Best" labels |

Seed `data/manual/offerings.yaml` with the one verified example above (Manilla Paragliding, source `https://www.flymanilla.com/ManillaParaglidingSchool/tabid/141/Default.aspx`) and add others only from operators' own published pages.

## 7. Gear: used-gear guidance (short, link-heavy)

Explain in plain words that buyers should check the wing's certification and weight range, age and hours, last line/porosity check, reserve repack date, and any incident history, and should have gear inspected by a service centre. Link to the service centres in the directory and to SAFA's buying-equipment guidance. No specific safety thresholds of our own.

## 8. Policy pages (outlines)

| Page | Contents |
|---|---|
| About | What Catavento is, why the name (§9), independence, prototype status, who runs it, how to give feedback |
| Sources and attribution | Provider table from `providers.json`, tiers explained, how to request changes |
| Status | Rendered `_report.json` |
| Bot policy (`/bot`) | User agent, rate limits, robots.txt respect, what we collect, contact, how to opt out |
| Takedown | How to request removal or correction; 24-hour response commitment; contact |
| Privacy | No accounts, no cookies; My Sites stored only on your device; optional cookie-less analytics if enabled; external services contacted by your browser (Open-Meteo, map tiles, and Windy's map only after you tap to load it); feedback and correction forms are Google Forms whose answers go to the project's private Google Sheets |
| Disclaimer | Standard disclaimer (§2), no affiliation, data accuracy limits |
| Feedback | Link to the external form; email fallback |

These pages are drafts for the founder to review; they are not legal advice.

## 9. Name usage

- Always **Catavento** (one word, capital C only). The first mention on a page may be followed by the descriptor.
- **Descriptor:** "Paragliding and hang gliding, all in one place". Page titles use the Australian version: "Paragliding and hang gliding in Australia, all in one place".
- **Why the name** (home page footer-strip and About page, exactly):

> Catavento is Portuguese for pinwheel: it means “catch the wind”. Like a pinwheel, everything here turns around one centre: the sites, clubs, schools and pilots of free flight.

(Draft for founder review, 2026-10-12.)

- **New to flying pages** may add a one-line gloss the first time the name appears: "(Catavento means pinwheel: it catches the wind.)"
- **Bot and email identity:** CataventoBot; emails signed "Catavento".

## 10. Coverage notice (sample countries)

> **Sample coverage.** {Country} is included as an early sample, so information here is incomplete. Tell us what's missing.
