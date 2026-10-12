import Link from "next/link";
import { USER_AGENT } from "@/lib/bot";
import { getProviders } from "@/lib/data";
import { t, type MessageKey } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata = pageMetadata({
  title: t("pages.bot.title"),
  description: t("pages.bot.summary"),
  path: "/bot",
});

const RULES: MessageKey[] = [
  "bot.rules.robots",
  "bot.rules.pace",
  "bot.rules.rarely",
  "bot.rules.noLogin",
  "bot.rules.facts",
  "bot.rules.guard",
];

const codeBlock =
  "mt-2 rounded-[10px] bg-ink p-3 font-mono text-[0.875rem] break-all whitespace-pre-wrap text-white";

/** Bot policy (docs/07 §6): who CataventoBot is, how it behaves, what it collects, how to opt out. */
export default function BotPage() {
  const collected = getProviders().filter((p) => p.collect);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-condensed text-[2rem] leading-tight font-bold">{t("pages.bot.title")}</h1>
      <p className="mt-2 text-[1.0625rem]">{t("bot.intro")}</p>

      <section aria-labelledby="identity" className="mt-8">
        <h2 id="identity" className="font-condensed text-[1.375rem] font-bold">
          {t("bot.identityHeading")}
        </h2>
        <p className="mt-1">{t("bot.identityText")}</p>
        <pre className={codeBlock}>
          <code>{USER_AGENT}</code>
        </pre>
      </section>

      <section aria-labelledby="rules" className="mt-8">
        <h2 id="rules" className="font-condensed text-[1.375rem] font-bold">
          {t("bot.rulesHeading")}
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          {RULES.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="schedule" className="mt-8">
        <h2 id="schedule" className="font-condensed text-[1.375rem] font-bold">
          {t("bot.scheduleHeading")}
        </h2>
        <p className="mt-1">{t("bot.scheduleText")}</p>
        {collected.length === 0 ? (
          <p className="mt-2 text-muted">{t("bot.noneYet")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {collected.map((p) => (
              <li key={p.id} className="rounded-[14px] border border-border bg-surface p-4">
                <p className="font-semibold">
                  {p.name}
                  {p.collect?.paused && (
                    <span className="ml-2 rounded-full bg-outside px-2.5 py-0.5 text-[0.75rem] font-semibold text-muted-strong">
                      {t("bot.pausedLabel")}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[0.9375rem] text-muted-strong">{p.uses}</p>
                <p className="mt-1 text-[0.9375rem] text-muted-strong">{p.schedule}</p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/sources/"
          className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          {t("status.sourcesLink")}
        </Link>
      </section>

      <section aria-labelledby="opt-out" className="mt-8">
        <h2 id="opt-out" className="font-condensed text-[1.375rem] font-bold">
          {t("bot.optOutHeading")}
        </h2>
        <p className="mt-1">{t("bot.optOutText")}</p>
        <pre className={codeBlock}>
          <code>{"User-agent: CataventoBot\nDisallow: /"}</code>
        </pre>
        <p className="mt-3">{t("bot.optOutContact")}</p>
      </section>

      <section aria-labelledby="contact" className="mt-8">
        <h2 id="contact" className="font-condensed text-[1.375rem] font-bold">
          {t("bot.contactHeading")}
        </h2>
        <p className="mt-1">
          {t("bot.contactText")}{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="font-semibold underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </a>
        </p>
      </section>
    </div>
  );
}
