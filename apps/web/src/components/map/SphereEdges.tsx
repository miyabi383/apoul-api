"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { SphereEdgeData } from "@/lib/map/radialLayout";

export function SphereRouteEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  selected,
}: EdgeProps & { data?: SphereEdgeData }) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: selected ? "var(--accent)" : "var(--accent)",
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: "8 4",
        }}
        markerEnd="url(#sphere-arrow)"
      />
      {label && (
        <text x={labelX} y={labelY - 6} textAnchor="middle" className="sphere-edge-label">
          {label}
        </text>
      )}
      {data && (
        <text x={labelX} y={labelY + 10} textAnchor="middle" className="sphere-edge-sub">
          {data.mappingCount} フィールド → {data.destinationPath}
        </text>
      )}
    </>
  );
}

export function SphereSpokeEdge(props: EdgeProps) {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  });
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{ stroke: "var(--border-strong)", strokeWidth: 1, opacity: 0.35 }}
    />
  );
}

export const sphereEdgeTypes = {
  sphereRoute: SphereRouteEdge,
  sphereSpoke: SphereSpokeEdge,
};
