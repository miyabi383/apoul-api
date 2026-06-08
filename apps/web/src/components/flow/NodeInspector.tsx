"use client";

import type { Node } from "@xyflow/react";
import type { FlowNodeData, MappingRule } from "@/lib/flow/types";
import type { SystemModule } from "@/lib/flow/types";
import { ja } from "@/lib/i18n/ja";

type Props = {
  node: Node<FlowNodeData> | null;
  systems: SystemModule[];
  onUpdate: (id: string, data: Partial<FlowNodeData>) => void;
  onClose: () => void;
};

export function NodeInspector({ node, systems, onUpdate, onClose }: Props) {
  if (!node) {
    return (
      <aside className="flow-inspector flow-inspector-empty">
        <p>{ja.flow.selectNode}</p>
      </aside>
    );
  }

  const d = node.data;

  return (
    <aside className="flow-inspector">
      <div className="flow-inspector-head">
        <h3>{ja.flow.inspector}</h3>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>×</button>
      </div>

      {node.type === "trigger" && (
        <div className="form-grid">
          <div className="field">
            <label>{ja.flow.sourceSystem}</label>
            <select
              value={d.systemCode ?? ""}
              onChange={(e) => {
                const sys = systems.find((s) => s.code === e.target.value);
                onUpdate(node.id, { systemCode: e.target.value, label: sys?.name ?? e.target.value });
              }}
            >
              {systems.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{ja.flow.eventType}</label>
            <input
              value={d.eventType ?? ""}
              onChange={(e) => onUpdate(node.id, { eventType: e.target.value, sublabel: e.target.value })}
              placeholder="contract.approved"
            />
          </div>
        </div>
      )}

      {node.type === "transform" && (
        <div className="field">
          <label>{ja.flow.fieldMapping}</label>
          <MappingEditor
            mapping={d.mapping ?? []}
            onChange={(mapping) => onUpdate(node.id, { mapping, sublabel: `${mapping.length} フィールド` })}
          />
        </div>
      )}

      {node.type === "action" && (
        <div className="form-grid">
          <div className="field">
            <label>{ja.flow.targetSystem}</label>
            <select
              value={d.systemCode ?? ""}
              onChange={(e) => {
                const sys = systems.find((s) => s.code === e.target.value);
                onUpdate(node.id, { systemCode: e.target.value, label: sys?.name ?? e.target.value });
              }}
            >
              <option value="">—</option>
              {systems.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{ja.flow.destPath}</label>
            <input
              value={d.destinationPath ?? ""}
              onChange={(e) => onUpdate(node.id, { destinationPath: e.target.value, sublabel: e.target.value })}
              placeholder="/invoices"
            />
          </div>
          <div className="field">
            <label>{ja.flow.destKey}</label>
            <input
              value={d.destinationKeyTpl ?? ""}
              onChange={(e) => onUpdate(node.id, { destinationKeyTpl: e.target.value })}
              placeholder="billing-ctr_{contractId}-invoice-v1"
            />
          </div>
        </div>
      )}
    </aside>
  );
}

function MappingEditor({ mapping, onChange }: { mapping: MappingRule[]; onChange: (m: MappingRule[]) => void }) {
  function updateRow(i: number, patch: Partial<MappingRule>) {
    const next = mapping.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  }

  function addRow() {
    onChange([...mapping, { target: "", source: "", required: false }]);
  }

  function removeRow(i: number) {
    onChange(mapping.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mapping-editor">
      {mapping.map((row, i) => (
        <div key={i} className="mapping-row">
          <input
            className="mapping-input"
            placeholder="target"
            value={row.target}
            onChange={(e) => updateRow(i, { target: e.target.value })}
          />
          <span className="mapping-arrow">←</span>
          <input
            className="mapping-input"
            placeholder="source"
            value={row.source}
            onChange={(e) => updateRow(i, { source: e.target.value })}
          />
          <label className="mapping-req">
            <input type="checkbox" checked={!!row.required} onChange={(e) => updateRow(i, { required: e.target.checked })} />
            必須
          </label>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeRow(i)}>×</button>
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-ghost" onClick={addRow}>+ フィールド</button>
    </div>
  );
}
