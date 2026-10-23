"use client";

import { useEffect, useState } from "react";
import { heroPosts } from "@/content";
import { RoleTag } from "../RoleTag";

const INTERVAL_MS = 4500;

/**
 * The hero's stack of example posts. Every few seconds the front card tucks behind the others and the next
 * project comes forward. Pauses while hovered or focused, stops for "reduce motion", and has a Next button.
 */
export function HeroStack() {
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = heroPosts.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => {
      if (!document.hidden) setFront((f) => (f + 1) % count);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, reduced, count]);

  const current = heroPosts[front];

  return (
    <div
      className="hero-visual"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-circle top" aria-hidden="true" />
      <div className="hero-circle bottom" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        Example post: {current?.title}, asking for a {current?.role}, {current?.scope}.
      </p>
      {heroPosts.map((p, i) => {
        const pos = (i - front + count) % count; // 0 = front, 1 = behind it, 2 = waiting at the back
        return (
          <div key={p.title} className="hero-card" data-pos={pos} aria-hidden="true">
            <div className="person">
              <span className={`avatar ${p.tone}`}>{p.initials}</span>
              <span className="person-text">
                <strong>{p.person}</strong>
                <span className="label muted">{p.stage}</span>
              </span>
            </div>
            <p className="display post-title">{p.title}</p>
            <p className="muted small">{p.blurb}</p>
            <RoleTag role={p.role} scope={p.scope} />
            <span className="fake-button">I can help</span>
          </div>
        );
      })}
      <span className="label sticker glass">Example posts</span>
      <button type="button" className="btn btn-sm glass hero-next" onClick={() => setFront((f) => (f + 1) % count)}>
        Next example
      </button>
    </div>
  );
}
