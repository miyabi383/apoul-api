export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden className="brand-mark">
      <circle cx="24" cy="24" r="22" fill="var(--illus-sun-soft)" stroke="var(--ink)" strokeWidth="2" />
      <path
        d="M14 26c2-8 8-12 14-12s12 4 14 12c-3 2-7 3-14 3s-11-1-14-3z"
        fill="var(--illus-sky)"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="22" r="2.5" fill="var(--ink)" />
      <circle cx="30" cy="22" r="2.5" fill="var(--ink)" />
      <path d="M20 28c2 2 6 2 8 0" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 8v4M8 24h4M36 24h4M24 40v-4" stroke="var(--illus-coral)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
