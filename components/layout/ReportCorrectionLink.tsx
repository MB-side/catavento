"use client";

import { usePathname } from "next/navigation";
import { correctionFormUrl } from "@/lib/links";
import { t } from "@/lib/messages";
import { absoluteUrl } from "@/lib/paths";
import { Anchor } from "@/components/ui/anchor";

/** "Report a correction", opening the form with this page's address filled in (docs/02 §5.1). */
export function ReportCorrectionLink({
  recordId,
  className,
}: {
  recordId?: string;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <Anchor href={correctionFormUrl(absoluteUrl(pathname), recordId)} className={className}>
      {t("footer.correction")}
    </Anchor>
  );
}
