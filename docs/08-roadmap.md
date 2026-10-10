# 08 · Roadmap

**Status:** current · **Last updated:** 9 Oct 2026

## 1. Iterations

| Iteration | Name | Hosting | Headline features | Goal |
|---|---|---|---|---|
| **1** | Consultation prototype | GitHub Pages (static) | Australia in full plus a New Zealand sample; index of sites, clubs, schools, tandems, shops; site pages with Managed by; club pages; My Sites on device; 3-day direction outlook; New to flying; nightly ingest | Feedback from pilots, clubs, schools, SAFA and data owners; prove the pipeline |
| **2** | Public beta | Vercel + Supabase | **New Zealand full coverage**; accounts with synced My Sites; **club claim and admin** (status, notices, events posted directly); **classifieds** with gear catalogue; enquiry forms to schools and tandem operators; live wind where permitted (club consent, Holfuy widgets, FreeFlightWx with permission); Thursday "Weekend Outlook" email; paid forecast provider | Habit and coverage: clubs and schools active, pilots returning weekly |
| **3** | Community | Same | Alerts and web push (evening-before direction alerts, saved-search matches, closures); "I'm planning to fly"; pilot reports; event RSVPs; price guide; profiles and contribution credit | Retention and network effects |
| **4** | Sustainable | Same | Revenue switches (§3); formal data agreements (Site Guide, SAFA, NZHGPA); next country evaluated (the UK is the closest fit: club-managed sites, English-speaking) | Cover costs, then grow |

## 2. Metrics by iteration

| Iteration | Primary metric | Supporting |
|---|---|---|
| 1 | Qualitative feedback from ≥ 3 clubs, ≥ 3 schools/operators, ≥ 20 pilots | Nightly ingest success rate; % of sites linked to a club; data corrections received |
| 2 | Weekly active pilots | Clubs claimed; schools claimed; live listings; enquiries; digest open rate |
| 3 | Day-30 retention of pilots with ≥ 1 saved site | Alert opt-in; RSVPs; reports per month |
| 4 | Revenue per weekly active pilot | Sponsor retention; paid listings |

## 3. Revenue switches (off until thresholds are met; never in Iteration 1)

| Switch | Threshold |
|---|---|
| Classifieds boosts | 150 live listings and 300 weekly active pilots |
| Pro profiles for schools and operators | 50 enquiries per month for 2 consecutive months |
| Sponsored "learn or fly here" slots on site pages | 10,000 site page views per month |
| Weather station sponsorship (funds new club stations) | 20 stations linked or embedded with club consent |
| Affiliate links in the gear catalogue | 2 retailers agree terms |
| Pilot Plus subscription | 1,000 weekly active pilots and a clear premium feature pilots ask for |

The daily-habit surfaces (My Sites) stay free of ads at every stage.

## 4. Things that must happen before monetising

- Move off GitHub Pages (its terms don't allow running an online business on it).
- Replace the free Open-Meteo tier with a paid plan or another licensed provider.
- Legal review of terms, privacy and marketplace rules; insurance.
- Written permissions for any embedded or fed data (stations, Site Guide data if used beyond facts).

## 5. Expansion principles

- Win one country properly before the next; depth beats breadth.
- A new country needs: a `countries.yaml` entry, its national body, steward patterns, primary site source, per-country providers, New to flying content, and local partners.
- Likely order after Australia and New Zealand: United Kingdom, then North America, then continental Europe (needs translation and handles site stewardship differently: site holders, lift operators and flight parks are common).
