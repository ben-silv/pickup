import type { ReactNode } from "react";

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
}: {
  title: string;
  lede?: string;
  actions?: ReactNode;
  top?: ReactNode;
  children?: ReactNode;
  tall?: boolean;
}) {
  return (
    <div className={`band${tall ? " band-tall" : ""}`}>
      <div className="wrap band-inner">
        <div className="stack-sm band-text">
          {top}
          <h1 className="display band-title">{title}</h1>
          {lede ? <p className="band-lede">{lede}</p> : null}
          {children}
        </div>
        {actions}
      </div>
    </div>
  );
}
