import type { ReactNode } from "react";
import { BandPattern } from "./BandPattern";

/**
 * Tufts Blue header band at the top of every app page. Content below overlaps it with `.overlap`.
 * `top` sits above the title (back link, stage pills); `children` sit under the lede (link buttons).
 */
export function PageBand({
  title,
  lede,
  actions,
  top,
  children,
  tall = true,
  pattern = false,
}: {
  /** Optional: the profile pages put their h1 in the card that overlaps the band. */
  title?: string;
  lede?: string;
  actions?: ReactNode;
  top?: ReactNode;
  children?: ReactNode;
  tall?: boolean;
  /** Faint elephant pattern in the background (Browse). Keep "Tufts" out of this band's text when it's on. */
  pattern?: boolean;
}) {
  return (
    <div className={`band${tall ? " band-tall" : ""}${pattern ? " band-has-pattern" : ""}`}>
      {pattern ? <BandPattern /> : null}
      <div className="wrap band-inner">
        <div className="stack-sm band-text">
          {top}
          {title ? <h1 className="display band-title">{title}</h1> : null}
          {lede ? <p className="band-lede">{lede}</p> : null}
          {children}
        </div>
        {actions}
      </div>
    </div>
  );
}
