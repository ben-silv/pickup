"use client";

import { useEffect } from "react";

/**
 * Moves a soft highlight across liquid-glass surfaces under the mouse pointer (sets --mx/--my on the
 * element; globals.css draws the light). Mouse only; does nothing for touch or "reduce motion".
 */
export function GlassLight() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let last: PointerEvent | null = null;
    const paint = () => {
      frame = 0;
      const e = last;
      const el = (e?.target as Element | null)?.closest<HTMLElement>(".glass, .glass-dark");
      if (!e || !el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
