declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string | number>) => void };
  }
}

/** Sends a custom event to Umami. No-op when analytics isn't loaded. */
export function track(event: string, data?: Record<string, string | number>) {
  window.umami?.track(event, data);
}
