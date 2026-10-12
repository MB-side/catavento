# CLAUDE.md · Catavento

Standing instructions for every Claude Code session in this repository. Keep this file short and current; update the Commands section as the project evolves.

## What we're building

**Catavento** is an independent hub for Australian free flight (paragliding, hang gliding, paramotoring): sites, the clubs that manage them, schools and tandem operators ("New to flying"), shops, events, and a personal "My Sites" view. **Current stage: Iteration 1, a static consultation prototype on GitHub Pages: Australia in full plus a small New Zealand sample, built global-ready.** Full spec: `docs/02-iteration-1-spec.md`.

## Read first

`docs/00-index.md` gives the reading order, precedence rules and glossary. Single sources of truth:
scope `docs/02` · architecture `docs/03` · data `docs/04` · sources and scraping `docs/05` · design `docs/06` · wording and safety `docs/07` · decisions `docs/10`.

## How we work

1. At the start of each milestone (`docs/02` §8): restate its "done when", list assumptions and questions, propose a task plan. **Wait for the founder's go-ahead before writing code.**
2. Work on a branch per milestone; small, focused commits (Conventional Commits); open a PR to `main` at the end.
3. At the end of each milestone: summarise what changed, how to check it (URLs, commands), test results, and anything deferred. **Stop for review.**
4. Record notable technical choices and any document conflicts in `docs/10-decisions-log.md`. Do not edit `docs/01` to `docs/09` without the founder's approval; propose changes instead.
5. When a requirement is ambiguous, choose the safer, simpler option, note it, and ask.

## Non-negotiables

- **Static only** in Iteration 1: Next.js `output: "export"`, no API routes, no server, no database. Respect `basePath` everywhere.
- **No user data leaves the browser.** My Sites and settings live in localStorage. Feedback goes to the external form. No cookies. Analytics off unless the config enables a cookie-less provider.
- **Country-neutral code.** Never hard-code a country, national body, membership wording, region list, rating system, time zone, unit or currency: read them from `data/manual/countries.yaml` via `lib/country.ts`. Use **steward** (with a role) in data and logic, not "club". No SAFA wording on NZ pages, and vice versa.
- **All data access goes through `lib/data`.** Types live only in `lib/types.ts`, schemas only in `lib/schemas.ts`.
- **Attribution on every record and every data block**, using the exact strings in `docs/05` §4.1.
- **Scraping rules** (`docs/05` §1–3): obey robots.txt, honest user agent, one request per host at a time, ≥ 3 s apart, caching, change guard, fixtures. **Never scrape red-tier providers** (Holfuy, Facebook, logged-in areas, SkySight, Paragliding Map). Take facts, never prose.
- **Respect restricted coordinates** (`docs/04` §5): approximate or withheld launches are never mapped and get no outlook.
- **Safety wording** (`docs/07` §2): never "flyable" or "safe"; show the standard disclaimer; no default speed thresholds.
- **No invented facts and no `[placeholder]` text on deployed pages.** Use "Not published", "Ask the club" or "Contact the school".
- **Accessibility:** WCAG 2.2 AA, real buttons and links, 44 px targets, text on every coloured outlook cell.
- **Never import from `design/mockups/`.** They are visual references only.
- **The name is always written Catavento** (one word, capital C only) in UI text, metadata and code constants; never "Cata-vento", "CataVento" or "Cata Vento". It replaced the working name HouseThermal (D33). Brand rules: `docs/01` §8 and `docs/06` §9.

## Code standards

- TypeScript strict; no `any`; pure functions in `lib/`; pages and components stay thin.
- Server components by default; client components only for My Sites, outlook, map, search and other interactivity.
- Tailwind with the tokens in `docs/06` §1; shadcn/ui primitives in `components/ui`; domain components in `components/domain`.
- Dates stored as ISO 8601; forecast requests use Open-Meteo `timezone=auto` so times are local to each site (Australia has several time zones).
- Add a dependency only when it clearly earns its place; note significant ones in `docs/10`.
- Every parser and every function in `lib/wind.ts` has unit tests; key journeys have Playwright tests (`docs/02` §6).

## Commands

Node 24 and pnpm 12. On the founder's Mac they live in `~/.local` (system Node is older), so prefix commands with `export PATH=$HOME/.local/opt/node/bin:$HOME/.local/bin:$PATH`.

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev server | `pnpm dev` (http://localhost:3000/catavento/) |
| Build data | `pnpm build:data` |
| Run ingest (all / one provider) | `pnpm ingest` / `pnpm ingest --provider ansg` |
| Build static site (+ content guard) | `pnpm build` |
| Serve the build like GitHub Pages | `pnpm serve` (http://localhost:4173/catavento/) |
| Unit tests | `pnpm test` |
| E2E tests (against the build) | `pnpm test:e2e` |
| Link check (against the build) | `pnpm check:links` |
| Lint, format and typecheck | `pnpm lint && pnpm format:check && pnpm typecheck` |

Workflows: `ci.yml` (checks every PR), `deploy.yml` (publishes `main`), `ingest.yml` (daily check-in that runs each source when due; calls `deploy.yml`).

## Repo map

See `docs/03` §3.
