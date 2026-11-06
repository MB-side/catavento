// Pilot tools (D99): outside websites and apps that help pilots, grouped by job. Catavento points
// to them; it doesn't run them or copy their data.
import { ExternalLink } from "lucide-react";
import { card, linkButton, PageHeader } from "@/components/layout/PageHeader";
import { Anchor } from "@/components/ui/anchor";
import { getTools } from "@/lib/data";
import { t } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";
import { groupTools } from "@/lib/tools";

export const metadata = pageMetadata({
  title: t("pages.tools.title"),
  description: t("pages.tools.summary"),
  path: "/tools",
});

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export default function ToolsPage() {
  const groups = groupTools(getTools());
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("pages.tools.title")} intro={t("tools.intro")} />
      <nav aria-label={t("tools.groupsNav")} data-testid="tool-group-nav">
        <ul className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <li key={g.key}>
              <a href={`#tools-${g.key}`} className={linkButton}>
                {t(`tools.group.${g.key}.title`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {groups.map((g) => (
        <section
          key={g.key}
          id={`tools-${g.key}`}
          aria-labelledby={`tools-${g.key}-title`}
          className="flex scroll-mt-24 flex-col gap-3"
          data-testid="tool-group"
        >
          <div>
            <h2 id={`tools-${g.key}-title`} className="font-condensed text-[1.5rem] font-bold">
              {t(`tools.group.${g.key}.title`)}
            </h2>
            <p className="text-muted">{t(`tools.group.${g.key}.text`)}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.tools.map((tool) => (
              <li key={tool.id} className={`${card} flex flex-col gap-2`} data-testid="tool-card">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="text-[1.125rem] font-bold">{tool.name}</h3>
                  {tool.countries && (
                    <span className="text-[0.875rem] text-muted">
                      {tool.countries.map((c) => regionNames.of(c) ?? c).join(", ")}
                    </span>
                  )}
                </div>
                <p>{tool.summary}</p>
                <p className="mt-auto pt-1">
                  <Anchor
                    href={tool.url}
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold"
                  >
                    {t("tools.open", { name: tool.name })}
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </Anchor>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-[0.9375rem] text-muted">{t("tools.note")}</p>
    </div>
  );
}
