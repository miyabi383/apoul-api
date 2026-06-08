import { api, ApiError } from "@/lib/api";
import { SphereMapView } from "@/components/map/SphereMapView";
import { DEMO_MAP, type MapOverview } from "@/lib/map/types";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ja } from "@/lib/i18n/ja";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  let overview: MapOverview = DEMO_MAP;
  let demo = true;
  let error: string | null = null;

  try {
    overview = await api.get<MapOverview>("/v1/map/overview");
    demo = false;
  } catch (e) {
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : ja.common.fetchError;
  }

  return (
    <div className="map-page">
      {error && (
        <div className="flow-page-banner">
          <ErrorBanner message={`${error} — ${ja.flow.demoMode}`} />
        </div>
      )}
      <SphereMapView overview={overview} demo={demo} />
    </div>
  );
}
