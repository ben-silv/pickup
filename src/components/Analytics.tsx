"use client";

import Script from "next/script";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
/** Set automatically on Vercel deployments ("Enable access to System Environment Variables"). */
const onVercel = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);

/**
 * Vercel Web Analytics (visitors and page views, no cookies) on Vercel deployments, plus Umami when configured.
 * Vercel serves its script from this site at /_vercel/insights/script.js, so there's no package to install.
 * Also counts clicks on any element with data-track="event_name" (Umami custom events).
 */
export function Analytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (el?.dataset.track) track(el.dataset.track);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      {onVercel ? <Script src="/_vercel/insights/script.js" strategy="afterInteractive" /> : null}
      {websiteId ? <Script src="https://cloud.umami.is/script.js" data-website-id={websiteId} strategy="afterInteractive" /> : null}
    </>
  );
}
