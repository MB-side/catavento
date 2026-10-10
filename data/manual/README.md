# Manual curation

Hand-curated YAML files that correct or supplement scraped and seed data. **They always win** (precedence: manual > ingest > seed). File formats and purposes: `docs/04-data-model.md` §4.

Every entry should include a `source` URL or a `note` explaining where the information came from.

Provided: `countries.yaml` (Australia and New Zealand configuration), `nz-sample-sites.yaml` (the five NZ sample sites with their stewards and sources) and `offerings.yaml` (one verified course example). Claude Code creates `providers.yaml` from `docs/05` §4 during M1, and the others as needed.
