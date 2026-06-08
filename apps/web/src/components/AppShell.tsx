"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeProvider";
import { BrandMark } from "./illustrations/BrandMark";
import { NAV_ICONS, type NavIconKey } from "./illustrations/NavIcons";
import { ja } from "@/lib/i18n/ja";

const NAV: { href: string; label: string; icon: NavIconKey }[] = [
  { href: "/map", label: ja.nav.map, icon: "map" },
  { href: "/flows", label: ja.nav.flows, icon: "flows" },
  { href: "/jobs", label: ja.nav.jobs, icon: "jobs" },
  { href: "/systems", label: ja.nav.systems, icon: "systems" },
  { href: "/api-clients", label: ja.nav.clients, icon: "clients" },
  { href: "/project-progress", label: ja.nav.progress, icon: "progress" },
];

type Props = {
  children: React.ReactNode;
  email: string;
  authOff: boolean;
  logoutAction?: () => Promise<void>;
};

export function AppShell({ children, email, authOff, logoutAction }: Props) {
  const pathname = usePathname();
  const isFullCanvas = pathname.startsWith("/flows") || pathname.startsWith("/map");

  return (
    <div className="shell">
      <div className="shell-bg" aria-hidden />
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-row">
            <BrandMark size={44} />
            <div>
              <div className="brand">{ja.app.name}</div>
              <div className="brand-sub">{ja.app.subtitle}</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="メインメニュー">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            const Icon = NAV_ICONS[n.icon];
            return (
              <Link key={n.href} href={n.href} className={active ? "nav-link active" : "nav-link"}>
                <span className="nav-icon" aria-hidden>
                  <Icon />
                </span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <ThemeToggle />
          <div className="user-block">
            <div className="user-email">{email}</div>
            {authOff && <div className="badge-warn">{ja.common.authDisabled}</div>}
            {!authOff && logoutAction && (
              <form action={logoutAction}>
                <button type="submit" className="btn btn-sm btn-ghost btn-block">
                  {ja.common.logout}
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>
      <div className={isFullCanvas ? "content-area content-area--flow" : "content-area"}>
        <main className={isFullCanvas ? "main main--flow" : "main"}>{children}</main>
      </div>
    </div>
  );
}
