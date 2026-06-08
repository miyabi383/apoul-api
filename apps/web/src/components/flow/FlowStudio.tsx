"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { flowEdgeTypes } from "./FlowEdges";
import { flowNodeTypes } from "./FlowNodes";
import { ModuleCatalog } from "./ModuleCatalog";
import { NodeInspector } from "./NodeInspector";
import type { FlowNodeData, RouteFlow, SystemModule } from "@/lib/flow/types";
import { loadLayouts, saveLayout } from "@/lib/flow/types";
import { emptyFlow, extractRouteFromNodes, routesToGraph } from "@/lib/flow/converters";
import { ja } from "@/lib/i18n/ja";

type Props = {
  initialSystems: SystemModule[];
  initialRoutes: RouteFlow[];
};

export function FlowStudio({ initialSystems, initialRoutes }: Props) {
  const [systems] = useState(initialSystems);
  const [scenarioName, setScenarioName] = useState("契約承認 → 請求連携");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [layouts, setLayouts] = useState(loadLayouts);

  const initialGraph = useMemo(() => {
    if (initialRoutes.length > 0) return routesToGraph(initialRoutes, layouts);
    const contract = systems.find((s) => s.code === "contract") ?? systems[0];
    if (contract) return emptyFlow(contract.code, contract.name);
    return { nodes: [], edges: [] };
  }, [initialRoutes, systems, layouts]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialGraph.edges);

  useEffect(() => {
    if (initialRoutes.length > 0) {
      const g = routesToGraph(initialRoutes, layouts);
      setNodes(g.nodes);
      setEdges(g.edges);
    }
  }, [initialRoutes, layouts, setNodes, setEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const onConnect = useCallback(
    (conn: Connection) => setEdges((eds) => addEdge({ ...conn, type: "flow", animated: true }, eds)),
    [setEdges],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const next = saveLayout(node.id, node.position, layouts);
      setLayouts(next);
    },
    [layouts],
  );

  function updateNodeData(id: string, patch: Partial<FlowNodeData>) {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    );
  }

  function onPickTarget(system: SystemModule) {
    const action = nodes.find((n) => n.type === "action" && (selectedNode?.type === "action" || !selectedNode));
    const targetId = selectedNode?.type === "action" ? selectedNode.id : action?.id;
    if (targetId) {
      updateNodeData(targetId, {
        systemCode: system.code,
        label: system.name,
        sublabel: system.baseUrl ?? system.code,
      });
      setSelectedId(targetId);
      setMessage(`${system.name} を送信先に設定しました`);
    } else {
      setMessage(ja.flow.pickActionFirst);
    }
  }

  function onAddFlow(system: SystemModule) {
    const g = emptyFlow(system.code, system.name);
    setNodes((nds) => [...nds, ...g.nodes]);
    setEdges((eds) => [...eds, ...g.edges]);
    setMessage(`${system.name} から新しいフローを追加しました`);
  }

  async function saveFlow() {
    setBusy(true);
    setMessage(null);
    const chainNodes = nodes.filter((n) => ["trigger", "transform", "action"].includes(n.type ?? ""));
    const payload = extractRouteFromNodes(chainNodes);
    if (!payload?.sourceSystemCode || !payload.targetSystemCode) {
      setMessage(ja.flow.saveValidation);
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) setMessage(json?.error?.message ?? ja.common.networkError);
      else setMessage(ja.flow.saved);
    } catch {
      setMessage(ja.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flow-studio">
      <ModuleCatalog
        systems={systems}
        query={query}
        onQueryChange={setQuery}
        onAddFlow={onAddFlow}
        onPickTarget={onPickTarget}
      />

      <div className="flow-canvas-wrap">
        <div className="flow-toolbar-top">
          <input
            className="flow-scenario-name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            aria-label={ja.flow.scenarioName}
          />
          {message && <span className="flow-toast">{message}</span>}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={() => setSelectedId(null)}
          nodeTypes={flowNodeTypes}
          edgeTypes={flowEdgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          className="flow-canvas"
        >
          <Background gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
          <Panel position="bottom-center" className="flow-bottom-bar">
            <button type="button" className="btn" onClick={saveFlow} disabled={busy}>
              {busy ? ja.common.loading : ja.flow.save}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const contract = systems[0];
                if (contract) onAddFlow(contract);
              }}
            >
              + {ja.flow.addModule}
            </button>
          </Panel>
        </ReactFlow>
      </div>

      <NodeInspector
        node={selectedNode}
        systems={systems}
        onUpdate={updateNodeData}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
