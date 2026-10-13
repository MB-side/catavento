// Every plain link on the site. Links to other websites open in a new tab so visitors keep their
// place here (founder request, D77), and say so to screen readers (WCAG technique G201). Email,
// phone and in-site links behave normally. Works in server and client components.
import type { AnchorHTMLAttributes } from "react";
import { isExternalHref } from "@/lib/links";
import { t } from "@/lib/messages";

export function Anchor({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!isExternalHref(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <span className="sr-only"> {t("links.newTab")}</span>
    </a>
  );
}
