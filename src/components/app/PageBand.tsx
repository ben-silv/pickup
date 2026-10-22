import type { ReactNode } from "react";

/** Tufts Blue header band at the top of every app page. Content below overlaps it with `.overlap`. */
export function PageBand({ title, lede, actions, tall = true }: { title: string; lede?: string; actions?: ReactNode; tall?: boolean }) {
  return (
    <div className={`band${tall ? " band-tall" : ""}`}>
      <div className="wrap band-inner">
        <div className="stack-sm">
          <h1 className="display band-title">{title}</h1>
          {lede ? <p className="band-lede">{lede}</p> : null}
        </div>
        {actions}
      </div>
    </div>
  );
}
