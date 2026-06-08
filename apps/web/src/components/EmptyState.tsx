import { SceneIllustration } from "./illustrations/SceneIllustrations";

type Scene = "empty" | "jobs" | "systems" | "clients" | "progress";

type Props = {
  message: string;
  hint?: string;
  scene?: Scene;
};

export function EmptyState({ message, hint, scene = "empty" }: Props) {
  return (
    <div className="empty-state empty-state--illustrated">
      <div className="empty-art">
        <SceneIllustration scene={scene === "empty" ? "empty" : scene} />
      </div>
      <p className="empty-msg">{message}</p>
      {hint && <p className="empty-hint">{hint}</p>}
    </div>
  );
}
