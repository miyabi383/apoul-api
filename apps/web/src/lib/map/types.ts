export type MapSystem = {
  code: string;
  name: string;
  status: string;
  baseUrl: string | null;
  clients: number;
  routesOut: number;
  routesIn: number;
};

export type MapRoute = {
  id: string;
  source: string;
  sourceName: string;
  target: string;
  targetName: string;
  eventType: string;
  destinationPath: string;
  destinationKeyTpl: string;
  mapping: unknown[];
  mappingCount: number;
};

export type MapIdMapping = {
  system: string;
  entityType: string;
  localId: string;
  remoteSystem: string;
  remoteId: string;
};

export type MapOverview = {
  hub: { code: string; name: string };
  systems: MapSystem[];
  routes: MapRoute[];
  idMappings: MapIdMapping[];
  stats: {
    systems: number;
    routes: number;
    idMappings: number;
    clients: number;
    jobs: Record<string, number>;
  };
};

export const DEMO_MAP: MapOverview = {
  hub: { code: "apoul", name: "APOUL 連携ハブ" },
  systems: [
    { code: "contract", name: "契約システム", status: "active", baseUrl: null, clients: 2, routesOut: 1, routesIn: 0 },
    { code: "billing", name: "請求システム", status: "active", baseUrl: "http://localhost:4101/mock/billing", clients: 1, routesOut: 0, routesIn: 1 },
  ],
  routes: [
    {
      id: "demo-route",
      source: "contract",
      sourceName: "契約システム",
      target: "billing",
      targetName: "請求システム",
      eventType: "contract.approved",
      destinationPath: "/invoices",
      destinationKeyTpl: "billing-ctr_{contractId}-invoice-v1",
      mapping: [
        { target: "contractId", source: "contractId", required: true },
        { target: "customerId", source: "customerId", required: true },
        { target: "amount", source: "amount", required: true },
      ],
      mappingCount: 3,
    },
  ],
  idMappings: [
    { system: "contract", entityType: "customer", localId: "CUST-22", remoteSystem: "billing", remoteId: "BILL-CUST-22" },
  ],
  stats: { systems: 2, routes: 1, idMappings: 1, clients: 3, jobs: { success: 12, retrying: 1, pending: 0 } },
};
