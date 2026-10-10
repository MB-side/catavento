# Kickoff prompt for Claude Code

*Founder: copy everything below the line and paste it as your first message to Claude Code, opened in the repository that contains this pack.*

---

You are the lead engineer for **HouseThermal** ("Paragliding and hang gliding, all in one place"), an independent website for Australian free flight: flying sites, the clubs that manage them, schools and tandem operators for people new to flying, shops, events, and a personal "My Sites" view pilots will open every day.

This repository already contains the full project documentation and seed data. Your job is to build **Iteration 1: a static consultation prototype hosted on GitHub Pages**, covering Australia in full plus a small New Zealand sample that proves the site works for more than one country, which I will share with pilots, clubs, schools, SAFA and data owners for feedback. Later iterations will move the same app to Vercel and Supabase, so build in a way that keeps that path open.

## Step 1: Read, in this order

1. `CLAUDE.md` (standing rules for every session)
2. `docs/00-index.md` (reading order, precedence, glossary)
3. `docs/02-iteration-1-spec.md` (what to build: pages, features, acceptance criteria, milestones M0–M7)
4. `docs/01-product-brief.md` (purpose, audiences, navigation)
5. `docs/03-architecture.md`, `docs/04-data-model.md`, `docs/05-data-sources-and-ingest.md`
6. `docs/06-design-spec.md` and the reference screens in `design/mockups/` (read the README there first)
7. `docs/07-content-and-safety.md`, `docs/10-decisions-log.md`, then skim `docs/08-roadmap.md`
8. Look at `data/seed/directory.csv`, `data/seed/weather-stations.csv`, `data/manual/countries.yaml` and `data/manual/nz-sample-sites.yaml`

`docs/research/` is background only; don't treat it as requirements.

## Step 2: Reply with the following, then stop and wait for my go-ahead

1. **Your understanding** of Iteration 1 in about ten lines.
2. **Conflicts or gaps** you found between documents, each with your proposed resolution (also add them to "Open conflicts" in `docs/10`).
3. **Questions for me**, each with the default you'd use if I don't answer. I still need to give you: the feedback form URL, a contact email, and whether this will use a custom domain or the GitHub Pages project URL.
4. **Your M0 plan**: tasks, files you'll create, the three GitHub Actions workflows, and how you'll verify the deploy.
5. **Top risks** for Iteration 1 and how you'll handle them.

Do not write code until I confirm the M0 plan.

## How we'll work after that

- Build milestone by milestone (M0 → M7) exactly as defined in `docs/02` §8. At the start of each milestone, restate its "done when" and propose a task plan; at the end, summarise what changed, how I can check it, test results and anything deferred, then **stop for my review**.
- One branch and one pull request per milestone; small, clear commits.
- Record technical choices and any deviations in `docs/10-decisions-log.md`. Propose, rather than make, changes to `docs/01`–`docs/09`.

## Non-negotiables (details in `CLAUDE.md` and the docs)

- Static export only; no server, no database, no user data leaving the browser; respect `basePath` everywhere.
- All data through `lib/data`; types and schemas in one place each.
- Attribution on every record and data block, using the exact strings in `docs/05` §4.1.
- Polite, tiered scraping per `docs/05`; **never scrape red-tier sources** (Holfuy, Facebook, logged-in areas, SkySight, Paragliding Map); facts only, never prose; change guard and fixtures for every parser.
- Respect approximate or withheld coordinates.
- Safety wording per `docs/07` §2: never "flyable" or "safe"; standard disclaimer; no default speed limits.
- No invented facts and no square-bracket placeholders on deployed pages.
- Stewards are first-class: the steward panel ("Managed by" for clubs) on every site page and site ↔ club links both ways.
- Country-neutral code: country rules come only from `data/manual/countries.yaml`; country-first URLs (`/au/...`, `/nz/...`); no SAFA wording on NZ pages.
- The section for newcomers is called **"New to flying"** and covers both tandem flights and learning to fly.
- The name is always **HouseThermal**, one word, paired with its descriptor in titles and share images (`docs/01` §8).
- WCAG 2.2 AA and the performance targets in `docs/02` §7.

## Technical notes to get right early

- GitHub Pages source must be set to **GitHub Actions** (I'll do this in the repo settings).
- Commits pushed by the ingest workflow using `GITHUB_TOKEN` don't trigger other workflows, so `ingest.yml` must call `deploy.yml` as a reusable workflow.
- Set `basePath` for a project-page URL unless I confirm a custom domain.
- Fonts via `next/font` (self-hosted at build). Map JavaScript only on map views. Open-Meteo is fetched in the browser with `timezone=auto` and its attribution shown.
- For the Site Guide, check for a bulk export before crawling pages, and keep the crawl slow.

## Definition of done for Iteration 1

All milestones signed off, nightly ingest successful for 7 consecutive days, `/status` green or with understood warnings, and everything in `docs/02` §6 and §7 passing.

Start with Step 1.
