import Link from "next/link";
import { t } from "@/lib/messages";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-condensed text-[2rem] leading-tight font-bold">{t("notFound.title")}</h1>
      <p className="mt-2 text-[1.0625rem] text-muted">{t("notFound.text")}</p>
      <p className="mt-4">
        <Link href="/" className="font-semibold underline underline-offset-4">
          {t("notFound.home")}
        </Link>
      </p>
    </div>
  );
}
