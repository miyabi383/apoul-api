"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: selected ? "var(--accent)" : "var(--accent)",
        strokeWidth: selected ? 2.5 : 2,
      }}
      markerEnd="url(#flow-arrow)"
    />
  );
}

export const flowEdgeTypes = {
  flow: FlowEdge,
};
