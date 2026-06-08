import { api, ApiError, type SystemRow } from "@/lib/api";
import { getSession, atLeast } from "@/lib/auth";
import { CreateSystem, ToggleStatus } from "./SystemControls";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatusChip } from "@/components/StatusChip";
import { ja, labelSystemStatus, chipClassForSystem } from "@/lib/i18n/ja";

export const dynamic = "force-dynamic";

export default async function SystemsPage() {
  const session = await getSession();
  const canManage = atLeast(session?.role, "admin");

  let rows: SystemRow[] = [];
  let error: string | null = null;
  try {
    rows = await api.get<{ items: SystemRow[] }>("/v1/systems").then((r) => r.items);
  } catch (e) {
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : ja.common.fetchError;
  }

  return (
    <>
      <PageHeader
        title={ja.systems.title}
        description={ja.systems.desc}
        visual="systems"
        actions={canManage ? <CreateSystem canManage={canManage} /> : undefined}
      />

      {error && <ErrorBanner message={error} />}

      {rows.length === 0 && !error ? (
        <EmptyState message={ja.systems.empty} scene="systems" />
      ) : rows.length > 0 ? (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>{ja.systems.code}</th>
                <th>{ja.systems.name}</th>
                <th>{ja.systems.status}</th>
                <th>{ja.systems.baseUrl}</th>
                <th>{ja.systems.clients}</th>
                <th>{ja.systems.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="tok">{s.code}</td>
                  <td>{s.name}</td>
                  <td>
                    <StatusChip status={s.status} label={labelSystemStatus(s.status)} className={chipClassForSystem(s.status)} />
                  </td>
                  <td className="tok">{s.baseUrl ?? ja.common.none}</td>
                  <td>{s.clients}</td>
                  <td>
                    <ToggleStatus id={s.id} status={s.status} canManage={canManage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
