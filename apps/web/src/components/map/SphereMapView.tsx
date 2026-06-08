"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { sphereNodeTypes } from "./SphereNodes";
import { sphereEdgeTypes } from "./SphereEdges";
import type { MapOverview, MapRoute } from "@/lib/map/types";
import { buildSphereGraph, type SphereEdgeData, type SphereNodeData } from "@/lib/map/radialLayout";
import { VisualStatCard } from "@/components/VisualStatCard";
import { SceneIllustration } from "@/components/illustrations/SceneIllustrations";
import { ja } from "@/lib/i18n/ja";

type Props = { overview: MapOverview; demo?: boolean };

export function SphereMapView({ overview, demo }: Props) {
  const [highlight, setHighlight] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<MapRoute | null>(null);
  const [size, setSize] = useState({ w: 900, h: 620 });

  const graph = useMemo(
    () => buildSphereGraph(overview, size.w, size.h, highlight),
    [overview, size.w, size.h, highlight],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SphereNodeData>>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<SphereEdgeData>>(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  useEffect(() => {
    const el = document.getElementById("sphere-canvas-host");
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 200 && height > 200) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onNodeClick = useCallback(
    (_: unknown, node: Node<SphereNodeData>) => {
      if (node.data.kind === "system") {
        setHighlight((h) => (h === node.data.code ? null : node.data.code));
        setSelectedRoute(null);
      }
    },
    [],
  );

  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge<SphereEdgeData>) => {
      const route = overview.routes.find((r) => r.id === edge.data?.routeId);
      setSelectedRoute(route ?? null);
    },
    [overview.routes],
  );

  const jobTotal = Object.values(overview.stats.jobs).reduce((a, b) => a + b, 0);

  return (
    <div className="sphere-map">
      <aside className="sphere-panel">
        <div className="sphere-panel-head">
          <h2>{ja.map.title}</h2>
          <p>{ja.map.desc}</p>
          {demo && <span className="badge-warn">{ja.flow.demoMode}</span>}
        </div>

        <div className="sphere-stats">
          <VisualStatCard value={overview.stats.systems} label={ja.map.statSystems} tint="lavender" />
          <VisualStatCard value={overview.stats.routes} label={ja.map.statRoutes} tint="sky" />
          <VisualStatCard value={overview.stats.idMappings} label={ja.map.statMappings} tint="mint" />
          <VisualStatCard value={overview.stats.clients} label={ja.map.statClients} tint="sun" />
          <VisualStatCard value={jobTotal} label={ja.map.statJobs} tint="coral" />
        </div>

        <div className="sphere-section-title">{ja.map.routesList}</div>
        <div className="sphere-route-list">
          {overview.routes.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`sphere-route-item ${selectedRoute?.id === r.id ? "active" : ""}`}
              onClick={() => {
                setSelectedRoute(r);
                setHighlight(r.source);
              }}
            >
              <div className="sphere-route-flow">
                <span className="tok">{r.source}</span>
                <span className="sphere-route-arrow">→</span>
                <span className="tok">{r.target}</span>
              </div>
              <div className="sphere-route-meta">{r.eventType} · {r.mappingCount} fields</div>
            </button>
          ))}
          {overview.routes.length === 0 && <p className="note">{ja.map.noRoutes}</p>}
        </div>

        <div className="sphere-section-title">{ja.map.idMappings}</div>
        <div className="sphere-mapping-list">
          {overview.idMappings.slice(0, 8).map((m, i) => (
            <div key={i} className="sphere-id-row tok">
              {m.system}/{m.entityType}:{m.localId} → {m.remoteSystem}:{m.remoteId}
            </div>
          ))}
          {overview.idMappings.length === 0 && <p className="note">{ja.common.none}</p>}
        </div>

        <div className="sphere-panel-actions">
          <Link href="/flows" className="btn btn-sm">{ja.map.openFlowEditor}</Link>
        </div>
      </aside>

      <div className="sphere-canvas-host" id="sphere-canvas-host">
        <div className="sphere-canvas-deco" aria-hidden />
        <div className="sphere-orbit-ring" aria-hidden />
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <marker id="sphere-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
            </marker>
          </defs>
        </svg>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={() => { setHighlight(null); setSelectedRoute(null); }}
          nodeTypes={sphereNodeTypes}
          edgeTypes={sphereEdgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          className="sphere-canvas"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
        >
          <Background gap={24} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeColor={() => "var(--accent)"} />
        </ReactFlow>
      </div>

      <aside className="sphere-detail">
        {selectedRoute ? (
          <>
            <h3>{ja.map.routeDetail}</h3>
            <div className="sphere-detail-block">
              <label>{ja.map.connection}</label>
              <div className="tok">{selectedRoute.sourceName} → {selectedRoute.targetName}</div>
            </div>
            <div className="sphere-detail-block">
              <label>{ja.flow.eventType}</label>
              <div className="tok">{selectedRoute.eventType}</div>
            </div>
            <div className="sphere-detail-block">
              <label>{ja.flow.destPath}</label>
              <div className="tok">{selectedRoute.destinationPath}</div>
            </div>
            <div className="sphere-detail-block">
              <label>{ja.flow.destKey}</label>
              <div className="tok">{selectedRoute.destinationKeyTpl}</div>
            </div>
            <div className="sphere-detail-block">
              <label>{ja.flow.fieldMapping}</label>
              <pre className="payload">{JSON.stringify(selectedRoute.mapping, null, 2)}</pre>
            </div>
            <Link href="/flows" className="btn btn-sm btn-block">{ja.map.editInFlow}</Link>
          </>
        ) : (
          <div className="sphere-detail-empty">
            <SceneIllustration scene="map" />
            <p>{ja.map.selectHint}</p>
            <p className="note">{ja.map.selectHintSub}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
