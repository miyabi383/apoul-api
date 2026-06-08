type IconProps = { className?: string };

const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

export function IconMap({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" {...stroke} />
    </svg>
  );
}

export function IconFlow({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="8" width="6" height="8" rx="3" fill="var(--illus-mint-soft)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="5" width="6" height="8" rx="3" fill="var(--illus-sun-soft)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="16" y="8" width="6" height="8" rx="3" fill="var(--illus-coral-soft)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12h1M15 9h1M15 12h1" {...stroke} />
    </svg>
  );
}

export function IconJobs({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" {...stroke} />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" {...stroke} />
      <path d="M8 12h8M8 16h5" {...stroke} />
    </svg>
  );
}

export function IconSystems({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" {...stroke} />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" {...stroke} />
    </svg>
  );
}

export function IconClients({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="8" cy="10" r="3" {...stroke} />
      <path d="M3 19c0-3 2.5-5 5-5s5 2 5 5" {...stroke} />
      <path d="M16 8l4 2v6l-4 2" {...stroke} />
      <path d="M16 12h4" {...stroke} />
    </svg>
  );
}

export function IconProgress({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 18V6M4 18h16" {...stroke} />
      <rect x="7" y="12" width="3" height="6" rx="1" fill="var(--illus-sky-soft)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="9" width="3" height="9" rx="1" fill="var(--illus-mint-soft)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="17" y="6" width="3" height="12" rx="1" fill="var(--illus-coral-soft)" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export const NAV_ICONS = {
  map: IconMap,
  flows: IconFlow,
  jobs: IconJobs,
  systems: IconSystems,
  clients: IconClients,
  progress: IconProgress,
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;
