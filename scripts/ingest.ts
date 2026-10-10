// Runs the enabled providers and writes data/ingest/<provider>.json (docs/05).
// M0: no providers exist yet, so this only reports that. Providers arrive in M2.
// Usage: pnpm ingest [--provider <id>]
const args = process.argv.slice(2);
const providerFlag = args.indexOf("--provider");
const provider = providerFlag >= 0 ? args[providerFlag + 1] : undefined;

console.log(
  provider
    ? `ingest: provider "${provider}" is not implemented yet (providers arrive in M2).`
    : "ingest: no providers are enabled yet (providers arrive in M2). Nothing collected.",
);
