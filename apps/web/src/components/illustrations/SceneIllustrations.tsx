type Scene = "empty" | "jobs" | "systems" | "clients" | "progress" | "map" | "flow" | "hub";

export function SceneIllustration({ scene, className }: { scene: Scene; className?: string }) {
  const common = { className: className ?? "scene-illustration", viewBox: "0 0 160 120", fill: "none", "aria-hidden": true as const };

  if (scene === "jobs" || scene === "empty") {
    return (
      <svg {...common} width="160" height="120">
        <ellipse cx="80" cy="105" rx="52" ry="8" fill="var(--illus-shadow)" opacity="0.4" />
        <rect x="48" y="28" width="64" height="72" rx="8" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
        <path d="M56 40h48M56 52h36M56 64h42M56 76h28" stroke="var(--illus-sky)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="108" cy="36" r="14" fill="var(--illus-sun-soft)" stroke="var(--ink)" strokeWidth="2" />
        <path d="M102 36l4 4 8-8" stroke="var(--illus-mint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (scene === "map" || scene === "hub") {
    return (
      <svg {...common} width="160" height="120">
        <ellipse cx="80" cy="100" rx="48" ry="7" fill="var(--illus-shadow)" opacity="0.35" />
        <circle cx="80" cy="58" r="28" fill="var(--illus-lavender-soft)" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="80" cy="58" r="14" fill="var(--illus-sky)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="36" cy="42" r="12" fill="var(--illus-mint-soft)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="124" cy="42" r="12" fill="var(--illus-coral-soft)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="48" cy="88" r="10" fill="var(--illus-sun-soft)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="112" cy="88" r="10" fill="var(--illus-sky-soft)" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M48 42h20M92 42h20M58 82h8M94 82h8" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
      </svg>
    );
  }

  if (scene === "flow") {
    return (
      <svg {...common} width="160" height="120">
        <path d="M20 60h28M68 60h28M116 60h24" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />
        <rect x="8" y="44" width="36" height="32" rx="16" fill="var(--illus-sky-soft)" stroke="var(--ink)" strokeWidth="2" />
        <rect x="56" y="44" width="36" height="32" rx="16" fill="var(--illus-sun-soft)" stroke="var(--ink)" strokeWidth="2" />
        <rect x="104" y="44" width="36" height="32" rx="16" fill="var(--illus-mint-soft)" stroke="var(--ink)" strokeWidth="2" />
        <text x="26" y="64" fontSize="14" fill="var(--ink)">⚡</text>
        <text x="74" y="64" fontSize="14" fill="var(--ink)">⇄</text>
        <text x="122" y="64" fontSize="14" fill="var(--ink)">→</text>
      </svg>
    );
  }

  if (scene === "systems") {
    return (
      <svg {...common} width="160" height="120">
        <path d="M80 18l44 24v48L80 114 36 90V42L80 18z" fill="var(--illus-lavender-soft)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M80 54V114M36 42l44 24 44-24" stroke="var(--ink)" strokeWidth="1.5" opacity="0.5" />
        <circle cx="80" cy="54" r="6" fill="var(--illus-coral)" stroke="var(--ink)" strokeWidth="1.5" />
      </svg>
    );
  }

  if (scene === "clients") {
    return (
      <svg {...common} width="160" height="120">
        <rect x="44" y="50" width="72" height="44" rx="10" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="64" cy="72" r="10" fill="var(--illus-mint-soft)" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M82 68h28M82 78h20" stroke="var(--illus-sky)" strokeWidth="3" strokeLinecap="round" />
        <path d="M52 38h56" stroke="var(--illus-coral)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="38" r="8" fill="var(--illus-sun)" stroke="var(--ink)" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg {...common} width="160" height="120">
      <rect x="32" y="24" width="96" height="72" rx="12" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
      <path d="M48 44h64M48 58h48M48 72h56" stroke="var(--illus-lavender)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="36" r="10" fill="var(--illus-mint)" stroke="var(--ink)" strokeWidth="1.5" />
    </svg>
  );
}

export function FlowNodeArt({ kind }: { kind: "trigger" | "transform" | "action" }) {
  if (kind === "trigger") {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden className="flow-node-art">
        <circle cx="18" cy="18" r="16" fill="var(--illus-sky-soft)" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M18 10v8M18 18l6 4" stroke="var(--illus-coral)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 24c2 2 10 2 12 0" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "transform") {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden className="flow-node-art">
        <rect x="4" y="8" width="28" height="20" rx="6" fill="var(--illus-sun-soft)" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M11 18h6M19 18h6M15 14v8" stroke="var(--illus-lavender)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden className="flow-node-art">
      <circle cx="18" cy="18" r="16" fill="var(--illus-mint-soft)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M12 18h14M22 14l4 4-4 4" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HubArt() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden className="hub-art">
      <circle cx="44" cy="44" r="40" fill="url(#hubGrad)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="44" cy="44" r="24" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <path d="M44 20v6M44 62v6M20 44h6M62 44h6" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <radialGradient id="hubGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="var(--illus-sky)" />
          <stop offset="100%" stopColor="var(--illus-lavender)" />
        </radialGradient>
      </defs>
    </svg>
  );
}
