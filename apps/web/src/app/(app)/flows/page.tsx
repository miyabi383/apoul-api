import { api, ApiError, type SystemRow } from "@/lib/api";
import { FlowStudio } from "@/components/flow/FlowStudio";
import type { RouteFlow, SystemModule } from "@/lib/flow/types";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ja } from "@/lib/i18n/ja";

export const dynamic = "force-dynamic";

export default async function FlowsPage() {
  let systems: SystemModule[] = [];
  let routes: RouteFlow[] = [];
  let error: string | null = null;

  try {
    const [sysRes, routeRes] = await Promise.all([
      api.get<{ items: SystemRow[] }>("/v1/systems"),
      api.get<{ items: RouteFlow[] }>("/v1/routes").catch(() => ({ items: [] as RouteFlow[] })),
    ]);
    systems = sysRes.items.map((s) => ({
      code: s.code,
      name: s.name,
      baseUrl: s.baseUrl,
      status: s.status,
    }));
    routes = routeRes.items;
  } catch (e) {
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : ja.common.fetchError;
    systems = [
      { code: "contract", name: "契約システム", baseUrl: null, status: "active" },
      { code: "billing", name: "請求システム", baseUrl: "http://localhost:4101/mock/billing", status: "active" },
    ];
    routes = [
      {
        id: "demo",
        sourceSystemCode: "contract",
        sourceSystemName: "契約システム",
        targetSystemCode: "billing",
        targetSystemName: "請求システム",
        eventType: "contract.approved",
        destinationPath: "/invoices",
        destinationKeyTpl: "billing-ctr_{contractId}-invoice-v1",
        enabled: true,
        mapping: [
          { target: "contractId", source: "contractId", required: true },
          { target: "customerId", source: "customerId", required: true },
          { target: "amount", source: "amount", required: true },
        ],
      },
    ];
  }

  return (
    <div className="flow-page">
      {error && (
        <div className="flow-page-banner">
          <ErrorBanner message={`${error} — ${ja.flow.demoMode}`} />
        </div>
      )}
      <FlowStudio initialSystems={systems} initialRoutes={routes} />
    </div>
  );
}
