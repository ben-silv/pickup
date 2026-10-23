"use client";

import { useEffect } from "react";

/**
 * Sets `data-scrolled` on <html> once the page has scrolled a little, so CSS can dock the
 * floating menu bar flush against the top. Re-checks on load in case the page opens mid-scroll.
 */
export function ScrollState() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      root.toggleAttribute("data-scrolled", window.scrollY > 8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.removeAttribute("data-scrolled");
    };
  }, []);
  return null;
}
