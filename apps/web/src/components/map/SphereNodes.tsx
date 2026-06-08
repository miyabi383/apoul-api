"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { HubArt } from "@/components/illustrations/SceneIllustrations";
import type { SphereNodeData } from "@/lib/map/radialLayout";

export function HubNode({ data, selected }: NodeProps & { data: SphereNodeData }) {
  return (
    <div className={`sphere-hub ${selected ? "selected" : ""}`}>
      <div className="sphere-hub-glow" aria-hidden />
      <div className="sphere-hub-core">
        <HubArt />
        <div className="sphere-hub-label">
          <div className="sphere-hub-title">{data.label}</div>
          <div className="sphere-hub-sub">統合レイヤー</div>
        </div>
      </div>
      <Handle type="source" position={Position.Top} className="flow-handle" />
      <Handle type="source" position={Position.Right} className="flow-handle" />
      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="source" position={Position.Left} className="flow-handle" />
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="target" position={Position.Right} className="flow-handle" />
      <Handle type="target" position={Position.Bottom} className="flow-handle" />
      <Handle type="target" position={Position.Left} className="flow-handle" />
    </div>
  );
}

export function SystemNode({ data, selected }: NodeProps & { data: SphereNodeData }) {
  const active = data.status === "active";
  const hue = data.code.length % 4;
  return (
    <div className={`sphere-system sphere-system--hue-${hue} ${selected ? "selected" : ""} ${active ? "" : "disabled"}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <Handle type="source" position={Position.Right} className="flow-handle" />
      <div className="sphere-system-orbit" aria-hidden />
      <div className="sphere-system-icon">{data.code.slice(0, 2).toUpperCase()}</div>
      <div className="sphere-system-body">
        <div className="sphere-system-name">{data.label}</div>
        <div className="sphere-system-code">{data.code}</div>
        <div className="sphere-system-meta">
          ↑{data.routesIn ?? 0} ↓{data.routesOut ?? 0} · {data.clients ?? 0} clients
        </div>
      </div>
    </div>
  );
}

export const sphereNodeTypes = {
  hub: HubNode,
  system: SystemNode,
};
