# 01 · Product Brief

**Status:** current · **Last updated:** 9 Oct 2026

## 1. One line

**Catavento** · Paragliding and hang gliding, all in one place.

The independent front door to free flight in Australia: every site, club, school, tandem operator, shop and event in one current, fast, well-attributed place, with a personal "My Sites" view that pilots open every day. **Australia first, New Zealand next, and built to work in any country.**

## 2. The model: hub of a spoked wheel

```
          SAFA (membership, schools, clubs, notices)
                         │
  Clubs & their ────┐    │    ┌──── Australian National Site Guide
  weather stations  ▼    ▼    ▼
  FreeFlightWx ──► [   THE HUB   ] ◄── Where To Fly (forecast tables)
                    ▲   ▲    ▲   ▲
  Schools & tandem ─┘   │    │   └──── ParaglidingEarth (open site data)
                 Shops & importers   Events, comps, XContest
```

- **Spokes** keep doing what they do well. The hub never presents their information as its own.
- **The hub owns three things:** the **index** (everything searchable in one place), the **experience** (fast, mobile, joined up) and the **personal layer** (My Sites, later alerts and listings).
- **Every spoke gets credit and traffic back:** attribution on every record and outbound links everywhere.

## 3. Audiences

| Audience | What they come for | Where they land |
|---|---|---|
| **Pilots** (PG, HG, PPG) | Is it on today? Which site? What's the club's rule? What's on? Gear | My Sites, site pages, club pages, What's on, Gear |
| **Visiting pilots** | Fly legally and safely somewhere new | Site pages, club pages, visiting-pilot guide |
| **New to flying**: people curious about a **tandem flight** or **learning to fly** | Where can I do a tandem near me? How do I learn? What does it cost? Which school? | New to flying |
| **Clubs** | Their sites and notices seen by every pilot | Club pages (claimable in Iteration 2) |
| **Schools, tandem operators, shops** | Being found by the right people | Directory profiles |
| **SAFA and associations** | Students reaching schools, pilots staying in the sport, a public events calendar | Whole site |

## 4. Navigation and information architecture

**Desktop top navigation (left to right):** My Sites · Sites & map · What's on · Gear · New to flying

**Phone bottom tab bar:** My Sites · Sites · What's on · Gear · New to flying
**Phone top bar:** wordmark, search, and a menu button (Country, About, Sources, Status, Feedback, Settings).

Clubs is not a top-level section (D31): sites are the entry point, and each site page shows its steward (a club in Australia and New Zealand). Club pages and the clubs directory are reached from site pages and each country's home page.

Key relationships the IA must express everywhere:

- **Site ↔ steward is a first-class link.** Every site has a **steward**: whoever is responsible for access and rules. In Australia, New Zealand and the UK that is almost always a club; elsewhere it may be a site holder, flight park, lift operator, landowner or council, or nobody. Every site page shows a prominent **steward panel** ("Managed by" for clubs, "Operated by" for flight parks, and so on: `docs/06` §6) with how to contact them, safety officer and duty-pilot details as published, site access requirements, and the instruction to contact them before a first flight. Every club page lists the sites it manages.
- **Clubs are separate from schools.** Clubs belong to pilots; schools belong to "New to flying".
- **New to flying** covers both **tandem flights** and **learning to fly** (paragliding, hang gliding, paramotoring), plus schools, costs, and SAFA membership explained.

Page inventory and routes: `docs/02` §4.

### 4.1 Countries

- **Country-first page addresses** (`/au/sites/nsw/long-reef-ne`, `/nz/clubs/canterbury`), so new countries never break existing links.
- A **country switcher** in the desktop top bar and the phone menu; the chosen country is remembered on the device. Default: Australia.
- **My Sites spans countries**: a pilot can save sites in Australia and New Zealand together.
- Everything country-specific (national body, membership wording, regions, rating systems, time zones, units, currency) comes from configuration, never from code.
- **Iteration 1:** Australia in full; New Zealand as a clearly labelled sample to prove the multi-country design.

## 5. What makes it sticky (the frequency ladder)

| How often | The question | Feature |
|---|---|---|
| Daily (in season) | "Is it on today? Where should I go?" | **My Sites**: saved sites with 3-day outlook, station links, club notices |
| Several times a week | "What's the wind doing at the hill?" | Station links on site pages and My Sites (live values in Iteration 2) |
| Weekly | "What's on this weekend?" | What's on; Thursday digest email (Iteration 2) |
| Seasonal | "Where can I travel? What course next?" | Site pages, club pages, destination guides |
| One-off, high value | "Where can I do a tandem? How do I learn?" | New to flying (arrives mostly from search) |

Acquire through the one-off questions, retain through the daily and weekly ones, and only later monetise the high-value moments (`docs/08`).

**Built-in spread:** every site page has a rich share image, so links pasted into club group chats advertise the hub.

## 6. Product principles

1. **Neutral.** No school, shop, club or brand is favoured in normal results.
2. **Fresh and sourced.** Every fact shows where it came from and when it was last checked.
3. **Partner-first.** Link to SAFA for membership and certification, to the Site Guide for official site details, and to clubs for rules.
4. **Safety-first wording.** Inform, never adjudicate. See `docs/07`.
5. **Fast and mobile-first.** Pilots check on phones, often with poor reception.
6. **Stewards (usually clubs) at the centre for pilots; tandems and schools at the centre for newcomers.**
7. **Country-neutral by design.** Nothing Australian is hard-coded; a new country is configuration plus data sources.

## 7. What the hub is not

- Not a replacement for SAFA, the Site Guide, Where To Fly or club websites
- Not a forecasting model or a pilot logbook
- Not a forum (community conversation stays in existing club groups for now)
- Not a safety authority

## 8. Name and brand

| Item | Decision |
|---|---|
| Name | **Catavento** (D33; replaces HouseThermal) |
| Spelling | Always one word, capital C only: **Catavento**. Never "Cata-vento", "CataVento" or "Cata Vento" in UI, titles or code constants |
| Primary descriptor | **Paragliding and hang gliding, all in one place** |
| Australian page-title descriptor (Iteration 1) | **Paragliding and hang gliding in Australia, all in one place** |
| Future global descriptor | **Free flight, all in one place** (the name stays the same) |
| Why the name | *Catavento* is Portuguese for pinwheel and literally means "catch the wind". A pinwheel is wind, a hub with everything turning around it, and wings circling in a thermal. It is easy to say in any language. Exact copy: `docs/07` §9 |
| Logo | A pinwheel of eight gliders, paragliders and hang gliders alternating, circling a thermal: `docs/06` §9 |
| Domain | **catavento.fly** (.fly registration opens 11 November 2026, Sydney time); **freeflight.fly** as an optional second address pointing to Catavento if the price is reasonable. The prototype runs on the GitHub Pages URL until then |

**Why it works for newcomers too:** people new to flying search for what they want ("tandem paragliding Wollongong"), not for a brand, so plain-language New to flying and site pages carry discovery. The name only needs to be memorable after first contact, and the descriptor plus the one-line explanation turn the jargon into a welcome.

**Search identity:** "catavento" is an everyday Portuguese word (pinwheel, weathervane), so pair it with the descriptor wherever it appears. Reinforce it with consistent handles, `Organization` structured data (`name: Catavento`), Google Search Console, and links from clubs and schools.
