export type MappingRule = { target: string; source: string; required?: boolean };

export type RouteFlow = {
  id: string;
  sourceSystemCode: string;
  sourceSystemName?: string;
  targetSystemCode: string;
  targetSystemName?: string;
  eventType: string;
  destinationPath: string;
  destinationKeyTpl: string;
  enabled: boolean;
  mapping: MappingRule[];
  updatedAt?: string;
};

export type FlowNodeData = {
  label: string;
  sublabel?: string;
  systemCode?: string;
  eventType?: string;
  destinationPath?: string;
  destinationKeyTpl?: string;
  mapping?: MappingRule[];
};

export type SystemModule = {
  code: string;
  name: string;
  baseUrl: string | null;
  status: string;
};

export const LAYOUT_STORAGE_KEY = "apoul-flow-layouts";

export type SavedLayout = Record<string, { x: number; y: number }>;

export function loadLayouts(): SavedLayout {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY) ?? "{}") as SavedLayout;
  } catch {
    return {};
  }
}

export function saveLayout(nodeId: string, pos: { x: number; y: number }, all: SavedLayout) {
  const next = { ...all, [nodeId]: pos };
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function defaultMapping(): MappingRule[] {
  return [
    { target: "contractId", source: "contractId", required: true },
    { target: "customerId", source: "customerId", required: true },
    { target: "amount", source: "amount", required: true },
  ];
}
