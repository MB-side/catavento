// Cookie-less visit counting with GoatCounter (D85). Pure: turns the config into the script to load, or
// nothing when counting is off. GoatCounter sets no cookies and keeps no personal data.
import type { AnalyticsConfig } from "@/site.config";

const SITE_NAME = /^[a-z0-9][a-z0-9-]{0,30}$/;

export const GOATCOUNTER_SCRIPT = "https://gc.zgo.at/count.js";

export function analyticsScript(config: AnalyticsConfig): { src: string; endpoint: string } | null {
  if (!config.enabled || config.provider !== "goatcounter" || !SITE_NAME.test(config.code))
    return null;
  return { src: GOATCOUNTER_SCRIPT, endpoint: `https://${config.code}.goatcounter.com/count` };
}

/**
 * A click on a link to another website, as GoatCounter counts it (D87): the other site's address
 * without any query or fragment, never who clicked. Links within this site, email and phone links
 * are not counted.
 */
export function outboundEvent(
  href: string,
  siteOrigin: string,
): { path: string; title: string } | null {
  let url: URL;
  try {
    url = new URL(href, siteOrigin);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.origin === siteOrigin) return null;
  const path = `${url.hostname}${url.pathname}`.replace(/\/+$/, "");
  return { path: `outbound/${path}`, title: url.hostname };
}
