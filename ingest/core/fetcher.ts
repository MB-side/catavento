// The one way CataventoBot fetches anything (docs/05 §3): obeys robots.txt, identifies itself
// honestly, makes one request at a time per host at least 3 seconds apart, times out after 30 s,
// retries twice with backoff, sends no cookies, and never logs in.
import { createHash } from "node:crypto";
import robotsParser from "robots-parser";
import { BOT_TOKEN, USER_AGENT } from "@/lib/bot";

export { BOT_TOKEN, USER_AGENT };
export const MIN_INTERVAL_MS = 3000;
const TIMEOUT_MS = 30_000;
const RETRIES = 2;

export interface FetchResult {
  url: string;
  status: number;
  body: string;
  bytes: Uint8Array;
  contentHash: string;
  fetchedAt: string;
}

export class RobotsDisallowedError extends Error {}

type Sleep = (ms: number) => Promise<void>;
const realSleep: Sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function sha256(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/** A polite fetcher. One instance per ingest run; it remembers robots rules and timing per host. */
export class PoliteFetcher {
  private robots = new Map<string, ReturnType<typeof robotsParser> | null>();
  private queues = new Map<string, Promise<unknown>>();
  private lastRequest = new Map<string, number>();
  readonly requests: string[] = [];

  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly sleep: Sleep = realSleep,
    private readonly minIntervalMs = MIN_INTERVAL_MS,
  ) {}

  /** Runs `task` after any earlier request to the same host, spaced by the minimum interval. */
  private schedule<T>(host: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(host) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        const wait = (this.lastRequest.get(host) ?? 0) + this.minIntervalMs - Date.now();
        if (wait > 0) await this.sleep(wait);
        try {
          return await task();
        } finally {
          this.lastRequest.set(host, Date.now());
        }
      });
    this.queues.set(host, next);
    return next;
  }

  private async raw(url: string): Promise<Response> {
    this.requests.push(url);
    return this.fetchImpl(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
      redirect: "follow",
      credentials: "omit",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }

  private async allowed(url: URL): Promise<boolean> {
    const origin = url.origin;
    if (!this.robots.has(origin)) {
      const robotsUrl = `${origin}/robots.txt`;
      const res = await this.schedule(url.host, () => this.raw(robotsUrl)).catch(() => null);
      // No robots.txt (404) means everything is allowed; a server error means we stay away.
      if (!res) this.robots.set(origin, null);
      else if (res.status >= 400 && res.status < 500)
        this.robots.set(origin, robotsParser(robotsUrl, ""));
      else if (res.ok) this.robots.set(origin, robotsParser(robotsUrl, await res.text()));
      else this.robots.set(origin, null);
    }
    const rules = this.robots.get(origin);
    return rules ? rules.isAllowed(url.toString(), BOT_TOKEN) !== false : false;
  }

  /** Fetches text, obeying robots.txt. Throws on disallowed URLs or after retries fail. */
  async get(urlString: string): Promise<FetchResult> {
    const url = new URL(urlString);
    if (!(await this.allowed(url)))
      throw new RobotsDisallowedError(`robots.txt does not allow ${urlString}`);
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      if (attempt > 0) await this.sleep(2 ** attempt * 2000);
      try {
        const res = await this.schedule(url.host, () => this.raw(urlString));
        if (res.status >= 500) throw new Error(`HTTP ${res.status} for ${urlString}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (!res.ok)
          throw Object.assign(new Error(`HTTP ${res.status} for ${urlString}`), {
            permanent: true,
          });
        return {
          url: urlString,
          status: res.status,
          body: new TextDecoder().decode(bytes),
          bytes,
          contentHash: sha256(bytes),
          fetchedAt: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error;
        if ((error as { permanent?: boolean }).permanent) break;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}
