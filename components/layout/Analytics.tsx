// Cookie-less visit counting (D85). Renders nothing unless the config turns it on.
import { analyticsScript } from "@/lib/analytics";
import { siteConfig } from "@/site.config";

export function Analytics() {
  const script = analyticsScript(siteConfig.analytics);
  if (!script) return null;
  return <script async src={script.src} data-goatcounter={script.endpoint} />;
}
