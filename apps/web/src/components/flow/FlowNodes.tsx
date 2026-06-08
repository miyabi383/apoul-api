"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FlowNodeArt } from "@/components/illustrations/SceneIllustrations";
import type { FlowNodeData } from "@/lib/flow/types";

export function TriggerNode({ data, selected }: NodeProps & { data: FlowNodeData }) {
  return (
    <div className={`flow-node flow-node-trigger ${selected ? "selected" : ""}`}>
      <Handle type="source" position={Position.Right} className="flow-handle" />
      <div className="flow-node-icon"><FlowNodeArt kind="trigger" /></div>
      <div className="flow-node-body">
        <div className="flow-node-title">{data.label}</div>
        <div className="flow-node-sub">{data.sublabel ?? "イベント受信"}</div>
      </div>
    </div>
  );
}

export function TransformNode({ data, selected }: NodeProps & { data: FlowNodeData }) {
  return (
    <div className={`flow-node flow-node-transform ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <Handle type="source" position={Position.Right} className="flow-handle" />
      <div className="flow-node-icon"><FlowNodeArt kind="transform" /></div>
      <div className="flow-node-body">
        <div className="flow-node-title">{data.label}</div>
        <div className="flow-node-sub">{data.sublabel ?? "マッピング"}</div>
      </div>
    </div>
  );
}

export function ActionNode({ data, selected }: NodeProps & { data: FlowNodeData }) {
  return (
    <div className={`flow-node flow-node-action ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <div className="flow-node-icon"><FlowNodeArt kind="action" /></div>
      <div className="flow-node-body">
        <div className="flow-node-title">{data.label}</div>
        <div className="flow-node-sub">{data.sublabel ?? "API送信"}</div>
      </div>
    </div>
  );
}

export const flowNodeTypes = {
  trigger: TriggerNode,
  transform: TransformNode,
  action: ActionNode,
};
