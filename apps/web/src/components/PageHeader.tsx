import Link from "next/link";
import { SceneIllustration } from "./illustrations/SceneIllustrations";
import { ja } from "@/lib/i18n/ja";

type Visual = "jobs" | "systems" | "clients" | "progress" | "map" | "flow";

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  visual?: Visual;
};

const SCENE_MAP: Record<Visual, "jobs" | "systems" | "clients" | "progress" | "map" | "flow"> = {
  jobs: "jobs",
  systems: "systems",
  clients: "clients",
  progress: "progress",
  map: "map",
  flow: "flow",
};

export function PageHeader({ title, description, backHref, backLabel, actions, visual }: Props) {
  return (
    <header className={`page-header${visual ? " page-header--visual" : ""}`}>
      <div className="page-header-main">
        {backHref && (
          <Link href={backHref} className="back-link">
            ← {backLabel ?? ja.common.back}
          </Link>
        )}
        <div className="page-header-text">
          <h1>{title}</h1>
          {description && <p className="page-desc">{description}</p>}
        </div>
      </div>
      {visual && (
        <div className="page-header-art" aria-hidden>
          <SceneIllustration scene={SCENE_MAP[visual]} />
        </div>
      )}
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
