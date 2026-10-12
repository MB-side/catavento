// CataventoBot's identity, shared by the collector and the /bot page so they always agree.
import { siteConfig } from "@/site.config";

export const BOT_TOKEN = "CataventoBot";
export const USER_AGENT = `${BOT_TOKEN}/0.1 (+${siteConfig.siteUrl}/bot/; ${siteConfig.contactEmail})`;
