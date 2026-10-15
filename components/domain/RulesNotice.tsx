// The "check the official rules" notice (D89): our rules for visitors are a short summary, so every
// summary points to the national body's own page and says when it was checked.
import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/messages";
import type { CountryGuide } from "@/lib/types";
import { Anchor } from "@/components/ui/anchor";
import { linkButton } from "@/components/layout/PageHeader";

export function RulesNotice({ guide }: { guide: CountryGuide }) {
  const body = guide.nationalBody;
  const url = guide.rulesUrl ?? body?.url;
  return (
    <div
      className="flex flex-col gap-3 rounded-[14px] bg-notice-tint p-4 text-notice-text"
      data-testid="rules-notice"
    >
      <p>
        {body ? t("visiting.summaryNote", { body: body.name }) : t("visiting.summaryNoteGeneric")}{" "}
        {t("visiting.summaryChecked", { date: formatDate(guide.checked, "UTC") })}
      </p>
      {url && (
        <Anchor href={url} className={`${linkButton} self-start bg-surface text-ink`}>
          {body ? t("visiting.rulesLink", { body: body.name }) : t("visiting.rulesLinkGeneric")}
          <ExternalLink className="size-4" aria-hidden="true" />
        </Anchor>
      )}
    </div>
  );
}
