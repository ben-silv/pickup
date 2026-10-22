"use client";

import Script from "next/script";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

/** Loads Umami (when configured) and counts clicks on any element with data-track="event_name". */
export function Analytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (el?.dataset.track) track(el.dataset.track);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!websiteId) return null;
  return <Script src="https://cloud.umami.is/script.js" data-website-id={websiteId} strategy="afterInteractive" />;
}
