import type { ReactNode } from "react";

type Props = {
  value: number | string;
  label: string;
  tint: "sky" | "mint" | "coral" | "sun" | "lavender";
  icon?: ReactNode;
};

export function VisualStatCard({ value, label, tint, icon }: Props) {
  return (
    <div className={`visual-stat visual-stat--${tint}`}>
      {icon && <div className="visual-stat-icon">{icon}</div>}
      <div className="visual-stat-body">
        <span className="visual-stat-value">{value}</span>
        <label className="visual-stat-label">{label}</label>
      </div>
    </div>
  );
}
