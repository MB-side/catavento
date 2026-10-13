# Manual curation

Hand-curated YAML files that correct or supplement scraped and seed data. **They always win** (precedence: manual > ingest > seed). File formats and purposes: `docs/04-data-model.md` §4.

Every entry should include a `source` URL or a `note` explaining where the information came from. After editing, run `pnpm build:data` (or let the automatic checks do it); a malformed file stops the build with a message saying what's wrong.

| File | What it holds |
|---|---|
| `countries.yaml` | Country configuration: national body, regions, time zones, units, membership line |
| `providers.yaml` | Every data source: tier, licence, what we use, and the exact credit line shown on the site |
| `overrides.yaml` | Corrections to any record, by record ID or seed ID (e.g. `NZ-CLB-005: { regionCode: NZ-CAN }`); `hidden: true` hides a record |
| `org-merges.yaml` | Spreadsheet rows that are the same business (a school's shop) or related records (two bases) |
| `club-aliases.yaml` | Exact spellings sources use for a club, per country; never a guess |
| `site-stewards.yaml` | Who looks after a site, where the source data can't say |
| `site-stations.yaml` | Weather stations to show for a site, in order |
| `nz-sample-sites.yaml` | The five New Zealand sample sites and their stewards |
| `site-wind.yaml` | Wind directions a club publishes for a site the Site Guide gives none for, with the club's page and date checked |
| `offerings.yaml` | Published course and tandem prices, each with its source page and date checked |
