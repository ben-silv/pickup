import { useId } from "react";

/** One small elephant silhouette, from the original Elephant art (not Tufts' Jumbo). Drawn in currentColor. */
function MiniElephant({ x, y, scale, flip = false }: { x: number; y: number; scale: number; flip?: boolean }) {
  const t = flip ? `translate(${x + 120 * scale} ${y}) scale(${-scale} ${scale})` : `translate(${x} ${y}) scale(${scale})`;
  return (
    <g transform={t}>
      <path d="M104 40 q8 6 6 16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <rect x="84" y="52" width="13" height="32" rx="5" />
      <rect x="46" y="54" width="13" height="30" rx="5" />
      <ellipse cx="72" cy="44" rx="34" ry="25" />
      <rect x="72" y="54" width="13" height="30" rx="5" />
      <rect x="56" y="56" width="13" height="28" rx="5" />
      <circle cx="34" cy="36" r="19" />
      <path d="M22 44 C 14 54, 12 64, 16 72 C 19 78, 27 77, 26 71" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
    </g>
  );
}

/**
 * Faint repeating pattern for Tufts Blue areas: small elephants and the logo's two dots, tilted slightly.
 * `fade` (default) eases it out on the left, behind left-aligned titles; `fade={false}` keeps it even (sign-in pages).
 * Decorative only. Text sitting directly on the pattern never says "Tufts" (white cards on top are fine).
 */
export function BandPattern({ fade = true }: { fade?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`band-pattern${fade ? "" : " band-pattern-even"}`} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="220" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <g fill="currentColor">
            <MiniElephant x={18} y={18} scale={0.36} />
            <MiniElephant x={128} y={92} scale={0.28} flip />
            <circle cx="168" cy="34" r="5" />
            <circle cx="183" cy="34" r="5" />
            <circle cx="46" cy="128" r="4" />
            <circle cx="58" cy="128" r="4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
