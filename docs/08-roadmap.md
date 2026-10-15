# 08 · Roadmap

**Status:** current · **Last updated:** 15 Oct 2026

## 1. Iterations

| Iteration | Name | Hosting | Headline features | Goal |
|---|---|---|---|---|
| **1** | Consultation prototype | GitHub Pages (static) | Australia in full plus a New Zealand sample; index of sites, clubs, schools, tandems, shops; site pages with Managed by; club pages; My Sites on device; 3-day direction outlook; New to flying; nightly ingest | Feedback from pilots, clubs, schools, SAFA and data owners; prove the pipeline |
| **2** | Public beta | Vercel + Supabase | **New Zealand full coverage**; accounts with synced My Sites; **club claim and admin** (status, notices, events posted directly); **classifieds** with gear catalogue; enquiry forms to schools and tandem operators; live wind where permitted (club consent, Holfuy widgets, FreeFlightWx with permission); Thursday "Weekend Outlook" email; paid forecast provider | Habit and coverage: clubs and schools active, pilots returning weekly |
| **3** | Community | Same | Alerts and web push (evening-before direction alerts, saved-search matches, closures); "I'm planning to fly"; pilot reports; event RSVPs; price guide; profiles and contribution credit | Retention and network effects |
| **4** | Sustainable | Same | Revenue options (§3) tried as they make sense; formal data agreements (Site Guide, SAFA, NZHGPA); more countries as demand shows | Cover costs, then grow |

## 2. Metrics by iteration

| Iteration | Primary metric | Supporting |
|---|---|---|
| 1 | Qualitative feedback from ≥ 3 clubs, ≥ 3 schools/operators, ≥ 20 pilots | Nightly ingest success rate; % of sites linked to a club; data corrections received |
| 2 | Weekly active pilots | Clubs claimed; schools claimed; live listings; enquiries; digest open rate |
| 3 | Day-30 retention of pilots with ≥ 1 saved site | Alert opt-in; RSVPs; reports per month |
| 4 | Revenue per weekly active pilot | Sponsor retention; paid listings |

## 3. Revenue options (open; tried when they make sense)

Catavento has to pay for itself. Revenue options are open and are tried whenever they make sense; there are no fixed thresholds. The founder keeps a private, living list of options (docs/research/revenue-options.md). Signals worth watching when deciding: visits and where they come from, which outside links people open (for example to schools and tandem operators), enquiries, and what businesses and organisations ask for.

## 4. Practical steps once money comes in

These follow from other services' terms, not from our own rules:

- GitHub Pages' terms don't allow running an online business on it, so move to a host that does.
- Open-Meteo's free tier is non-commercial, so switch to its paid plan or another licensed provider. The same applies to GoatCounter's free plan.
- Get terms, privacy and any marketplace rules reviewed, and insurance if bookings or payments are handled.
- Keep any written permissions needed for embedded data (for example station widgets).

## 5. Expansion principles

- Catavento helps people find the sources of free-flight information and organises access to them; it doesn't claim the knowledge itself. A country can therefore start with links (its national body, site guides, clubs, schools, tandem and guiding operators, weather sources) and grow in depth as sources allow.
- Any country can be added at any depth, in any order. Visits by country, what pilots ask for and how easy a country's sources are to gather guide the choice.
- A new country is configuration plus data sources (`countries.yaml`, its national body and providers). Local helpers are welcome but not required.
- Translation isn't needed: visitors' browsers translate pages.
