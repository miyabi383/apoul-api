import type { Edge, Node } from "@xyflow/react";
import type { FlowNodeData, RouteFlow, SavedLayout } from "./types";
import { defaultMapping } from "./types";

export function routeToFlow(route: RouteFlow, layout: SavedLayout, index: number): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const baseY = 80 + index * 220;
  const triggerId = `${route.id}-trigger`;
  const transformId = `${route.id}-transform`;
  const actionId = `${route.id}-action`;

  const nodes: Node<FlowNodeData>[] = [
    {
      id: triggerId,
      type: "trigger",
      position: layout[triggerId] ?? { x: 80, y: baseY },
      data: {
        label: route.sourceSystemName ?? route.sourceSystemCode,
        sublabel: route.eventType,
        systemCode: route.sourceSystemCode,
        eventType: route.eventType,
      },
    },
    {
      id: transformId,
      type: "transform",
      position: layout[transformId] ?? { x: 380, y: baseY },
      data: {
        label: "データ変換",
        sublabel: `${(route.mapping ?? []).length} フィールド`,
        mapping: route.mapping ?? [],
      },
    },
    {
      id: actionId,
      type: "action",
      position: layout[actionId] ?? { x: 680, y: baseY },
      data: {
        label: route.targetSystemName ?? route.targetSystemCode,
        sublabel: route.destinationPath,
        systemCode: route.targetSystemCode,
        destinationPath: route.destinationPath,
        destinationKeyTpl: route.destinationKeyTpl,
      },
    },
  ];

  const edges: Edge[] = [
    { id: `${triggerId}-${transformId}`, source: triggerId, target: transformId, type: "flow", animated: true },
    { id: `${transformId}-${actionId}`, source: transformId, target: actionId, type: "flow", animated: true },
  ];

  return { nodes, edges };
}

export function emptyFlow(systemCode: string, systemName: string): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const id = `new-${Date.now()}`;
  const triggerId = `${id}-trigger`;
  const transformId = `${id}-transform`;
  const actionId = `${id}-action`;

  return {
    nodes: [
      {
        id: triggerId,
        type: "trigger",
        position: { x: 80, y: 120 },
        data: { label: systemName, sublabel: "contract.approved", systemCode, eventType: "contract.approved" },
      },
      {
        id: transformId,
        type: "transform",
        position: { x: 380, y: 120 },
        data: { label: "データ変換", sublabel: "3 フィールド", mapping: defaultMapping() },
      },
      {
        id: actionId,
        type: "action",
        position: { x: 680, y: 120 },
        data: {
          label: "送信先を選択",
          sublabel: "/invoices",
          systemCode: "",
          destinationPath: "/invoices",
          destinationKeyTpl: "billing-ctr_{contractId}-invoice-v1",
        },
      },
    ],
    edges: [
      { id: `${triggerId}-${transformId}`, source: triggerId, target: transformId, type: "flow", animated: true },
      { id: `${transformId}-${actionId}`, source: transformId, target: actionId, type: "flow", animated: true },
    ],
  };
}

export function extractRouteFromNodes(nodes: Node<FlowNodeData>[]): Partial<RouteFlow> | null {
  const trigger = nodes.find((n) => n.type === "trigger");
  const transform = nodes.find((n) => n.type === "transform");
  const action = nodes.find((n) => n.type === "action");
  if (!trigger || !action) return null;

  return {
    sourceSystemCode: trigger.data.systemCode ?? "",
    eventType: trigger.data.eventType ?? "contract.approved",
    targetSystemCode: action.data.systemCode ?? "",
    destinationPath: action.data.destinationPath ?? "/",
    destinationKeyTpl: action.data.destinationKeyTpl ?? "",
    mapping: transform?.data.mapping ?? defaultMapping(),
    enabled: true,
  };
}

export function routesToGraph(routes: RouteFlow[], layout: SavedLayout): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  if (routes.length === 0) return { nodes: [], edges: [] };
  return routes.reduce(
    (acc, route, i) => {
      const part = routeToFlow(route, layout, i);
      return { nodes: [...acc.nodes, ...part.nodes], edges: [...acc.edges, ...part.edges] };
    },
    { nodes: [] as Node<FlowNodeData>[], edges: [] as Edge[] },
  );
}
