# Catavento: Claude Code Starter Pack

**Catavento** · Paragliding and hang gliding, all in one place

**Pack version:** 1.2 · 9 October 2026 (adds the name and brand; Australia first with a New Zealand sample, global-ready)
**Goal of this pack:** give Claude Code everything it needs to build **Iteration 1, the consultation prototype**: a working, mostly real, static website hosted free on GitHub Pages that you can show pilots, clubs, schools, SAFA and data owners for feedback.

---

## What's in the pack

| Path | What it is | Who reads it |
|---|---|---|
| `KICKOFF_PROMPT.md` | The prompt you paste into Claude Code to start the build | You, then Claude Code |
| `CLAUDE.md` | Standing project rules Claude Code reads at the start of every session | Claude Code |
| `docs/00-index.md` | Map of all documents, reading order, precedence, glossary | Both |
| `docs/01-product-brief.md` | What the hub is, who it's for, navigation, what makes it sticky | Both |
| `docs/02-iteration-1-spec.md` | Exactly what to build now: pages, features, acceptance criteria, milestones | Claude Code (primary) |
| `docs/03-architecture.md` | Static site + nightly data pipeline on GitHub; path to the full build later | Claude Code |
| `docs/04-data-model.md` | Data types, file layout, seed and override rules | Claude Code |
| `docs/05-data-sources-and-ingest.md` | Every source, how it's collected, attribution and the scraping rules | Claude Code |
| `docs/06-design-spec.md` | Colours, type, components and screen layouts (matches the mockups) | Claude Code |
| `docs/07-content-and-safety.md` | Wording rules, disclaimers, attribution text, "New to flying" content plan | Both |
| `docs/08-roadmap.md` | Iterations 1 to 4, metrics, when to switch on revenue | You |
| `docs/09-consultation-plan.md` | How to use the prototype for consultation, plus short outreach templates | You |
| `docs/10-decisions-log.md` | Every key decision so far, with reasons | Both |
| `docs/research/` | The original market analysis and stickiness guide (background only) | You |
| `data/seed/directory.csv` | 150 seed records with a country column: Australian bodies, associations, schools, clubs, shops and tools; the New Zealand sample (NZHGPA, 11 clubs, schools, a flight park); benchmarks | Claude Code |
| `data/seed/weather-stations.csv` | 47 station and feed records (one in NZ) | Claude Code |
| `data/manual/` | Country configuration (`countries.yaml`), the NZ sample sites, one verified course example, and room for your corrections (see `docs/04`) | You and Claude Code |
| `design/mockups/` | The five screens from the design canvas, as reference HTML | Claude Code |

---

## How to start the build

1. **Create a GitHub repository** (public is simplest: GitHub Pages is free for public repos; a private repo with Pages needs a paid GitHub plan).
2. **Copy this whole pack into the repository root** and commit it.
3. In the repository settings, open **Pages** and set the source to **GitHub Actions**.
4. Open Claude Code in the repository folder.
5. Paste the contents of `KICKOFF_PROMPT.md` as your first message.
6. Claude Code will read the docs, summarise its understanding, list questions and propose a plan for the first milestone. **Answer the questions, approve the plan**, and it will build milestone by milestone, stopping for your review after each one.

**Before you start, decide these (or accept the defaults in `docs/02`, section 10):** the domain (catavento.fly; .fly registration opens 11 November 2026, Sydney time), the feedback form link, a contact email, and whether to turn on privacy-friendly analytics. The name, Catavento, is decided (`docs/01` §8).

---

## What Iteration 1 will and won't do

**Will:** Australia in full plus a small New Zealand sample (country-first addresses, so more countries can be added later); national site map and site pages with club details, club directory and club pages, My Sites (saved on the visitor's device), a 3-day wind-direction outlook per site, schools and tandem operators under "New to flying", gear shops and where-to-buy, what's on, full attribution, and a feedback link on every page. Data refreshes nightly.

**Won't (yet):** accounts, classifieds posting, enquiry forms, live wind numbers, alerts, payments or sponsored listings. These arrive in Iteration 2, when the site moves to a proper host with a database (see `docs/08`).

GitHub Pages is fine for a non-commercial prototype, but its terms don't allow running an online business on it, so the move to the full stack happens before anything is monetised.

---

## Run locally

The live site is published from GitHub automatically; you don't need to run anything yourself. For anyone working on the code:

1. Install Node 24 and pnpm 12 (`corepack enable` or `npm install -g pnpm@12`).
2. `pnpm install`
3. `pnpm dev`, then open http://localhost:3000/catavento/

To check a production build exactly as GitHub Pages will serve it: `pnpm build && pnpm serve`, then open http://localhost:4173/catavento/. `pnpm test` and `pnpm test:e2e` run the automated tests. The full command list is in `CLAUDE.md`.
