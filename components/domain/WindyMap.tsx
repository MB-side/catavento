"use client";

import { useState } from "react";
import { Wind } from "lucide-react";
import { t } from "@/lib/messages";
import { Anchor } from "@/components/ui/anchor";

interface WindyMapProps {
  src: string; // built on the server with windyEmbedUrl()
  placeName: string;
}

/**
 * Windy's live wind map, loaded only when the visitor taps (D44): nothing from windy.com loads
 * before that, so our no-cookies promise holds until the visitor chooses to see the map.
 */
export function WindyMap({ src, placeName }: WindyMapProps) {
  const [shown, setShown] = useState(false);

  return (
    <div
      className="overflow-hidden rounded-[14px] border border-border bg-surface"
      data-testid="windy-map"
    >
      {shown ? (
        <iframe
          src={src}
          title={t("liveWind.frameTitle", { country: placeName })}
          className="block aspect-[4/3] w-full border-0 sm:aspect-[16/9]"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-light-wind p-4 text-center sm:aspect-[16/9]">
          <button
            type="button"
            onClick={() => setShown(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-ink px-4 font-semibold text-white hover:bg-ink/90"
          >
            <Wind className="size-5" aria-hidden="true" />
            {t("liveWind.show")}
          </button>
          <p className="max-w-md text-[0.875rem] text-muted-strong">{t("liveWind.privacy")}</p>
        </div>
      )}
      <p className="border-t border-border px-4 py-2 text-[0.8125rem] text-muted">
        <Anchor href="https://www.windy.com" className="underline underline-offset-4">
          {t("liveWind.credit")}
        </Anchor>
      </p>
    </div>
  );
}
