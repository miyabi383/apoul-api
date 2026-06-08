import type { Edge, Node } from "@xyflow/react";
import type { MapOverview, MapSystem } from "./types";

export type SphereNodeData = {
  label: string;
  code: string;
  kind: "hub" | "system";
  status?: string;
  clients?: number;
  routesIn?: number;
  routesOut?: number;
  baseUrl?: string | null;
};

export type SphereEdgeData = {
  eventType: string;
  mappingCount: number;
  destinationPath: string;
  routeId: string;
  mapping?: unknown[];
};

const NODE_W = 120;
const NODE_H = 56;

export function buildSphereGraph(
  overview: MapOverview,
  width: number,
  height: number,
  highlightSystem?: string | null,
): { nodes: Node<SphereNodeData>[]; edges: Edge<SphereEdgeData>[] } {
  const cx = width / 2;
  const cy = height / 2;
  const orbitR = Math.min(width, height) * 0.34;

  const nodes: Node<SphereNodeData>[] = [
    {
      id: "hub-apoul",
      type: "hub",
      position: { x: cx - 70, y: cy - 70 },
      data: { label: overview.hub.name, code: overview.hub.code, kind: "hub" },
      draggable: false,
    },
  ];

  const systems = overview.systems;
  systems.forEach((s, i) => {
    const angle = (2 * Math.PI * i) / Math.max(systems.length, 1) - Math.PI / 2;
    const x = cx + orbitR * Math.cos(angle) - NODE_W / 2;
    const y = cy + orbitR * Math.sin(angle) - NODE_H / 2;
    nodes.push({
      id: `sys-${s.code}`,
      type: "system",
      position: { x, y },
      data: {
        label: s.name,
        code: s.code,
        kind: "system",
        status: s.status,
        clients: s.clients,
        routesIn: s.routesIn,
        routesOut: s.routesOut,
        baseUrl: s.baseUrl,
      },
    });
  });

  const edges: Edge<SphereEdgeData>[] = overview.routes.map((route) => ({
    id: `route-${route.id}`,
    source: `sys-${route.source}`,
    target: `sys-${route.target}`,
    type: "sphereRoute",
    animated: true,
    label: route.eventType,
    data: {
      eventType: route.eventType,
      mappingCount: route.mappingCount,
      destinationPath: route.destinationPath,
      routeId: route.id,
      mapping: route.mapping,
    },
  }));

  if (highlightSystem) {
    edges.forEach((e) => {
      const r = overview.routes.find((x) => x.id === e.data?.routeId);
      const related = r && (r.source === highlightSystem || r.target === highlightSystem);
      e.style = related ? { opacity: 1 } : { opacity: 0.12 };
    });
    nodes.forEach((n) => {
      if (n.id === "hub-apoul") return;
      n.style = n.data.code === highlightSystem ? { opacity: 1 } : { opacity: 0.4 };
    });
  }

  return { nodes, edges };
}

export function systemByCode(systems: MapSystem[], code: string) {
  return systems.find((s) => s.code === code);
}
