/** Original elephant illustration. Not Tufts' Jumbo artwork; never place it next to the word "Tufts". */
export function Elephant({ width = 150 }: { width?: number }) {
  return (
    <svg className="elephant" aria-hidden="true" width={width} height={(width * 90) / 120} viewBox="0 0 120 90">
      <path d="M104 40 q8 6 6 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="111" cy="57" r="3" fill="currentColor" />
      <rect x="84" y="52" width="13" height="32" rx="5" fill="currentColor" />
      <rect x="46" y="54" width="13" height="30" rx="5" fill="currentColor" />
      <ellipse cx="72" cy="44" rx="34" ry="25" fill="currentColor" />
      <rect x="72" y="54" width="13" height="30" rx="5" fill="currentColor" />
      <rect x="56" y="56" width="13" height="28" rx="5" fill="currentColor" />
      <circle cx="34" cy="36" r="19" fill="currentColor" />
      <path d="M22 44 C 14 54, 12 64, 16 72 C 19 78, 27 77, 26 71" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      <path d="M26 50 q2 8 9 10" fill="none" stroke="var(--cream)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M44 20 C 62 14, 66 34, 60 48 C 56 56, 46 56, 42 50 Z" fill="var(--tufts-blue)" />
      <circle cx="30" cy="31" r="2.6" fill="var(--cream)" />
    </svg>
  );
}
