import { api, ApiError, type ClientRow, type SystemRow } from "@/lib/api";
import { getSession, atLeast } from "@/lib/auth";
import { IssueClient, RevokeClient } from "./ClientControls";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatusChip } from "@/components/StatusChip";
import { ja, labelClientStatus, chipClassForClient } from "@/lib/i18n/ja";

export const dynamic = "force-dynamic";

export default async function ApiClientsPage() {
  const session = await getSession();
  const canManage = atLeast(session?.role, "admin");

  let rows: ClientRow[] = [];
  let systems: SystemRow[] = [];
  let error: string | null = null;
  try {
    [rows, systems] = await Promise.all([
      api.get<{ items: ClientRow[] }>("/v1/api-clients").then((r) => r.items),
      api.get<{ items: SystemRow[] }>("/v1/systems").then((r) => r.items),
    ]);
  } catch (e) {
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : ja.common.fetchError;
  }

  return (
    <>
      <PageHeader
        title={ja.clients.title}
        description={ja.clients.desc}
        visual="clients"
        actions={canManage ? <IssueClient canManage={canManage} systemCodes={systems.map((s) => s.code)} /> : undefined}
      />

      {error && <ErrorBanner message={error} />}

      {rows.length === 0 && !error ? (
        <EmptyState message={ja.clients.empty} scene="clients" />
      ) : rows.length > 0 ? (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>{ja.clients.name}</th>
                <th>{ja.clients.system}</th>
                <th>{ja.clients.scopes}</th>
                <th>{ja.clients.status}</th>
                <th>{ja.clients.keys}</th>
                <th>{ja.clients.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.name}
                    <div className="sub tok">{c.id}</div>
                  </td>
                  <td className="tok">{c.systemCode}</td>
                  <td className="tok">{c.scopes.join(", ")}</td>
                  <td>
                    <StatusChip status={c.status} label={labelClientStatus(c.status)} className={chipClassForClient(c.status)} />
                  </td>
                  <td className="tok">
                    {c.keys.length === 0
                      ? ja.common.none
                      : c.keys.map((k, i) => (
                          <div key={i}>
                            {k.prefix}…{" "}
                            {k.revokedAt ? ja.clients.keyRevoked : k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("ja-JP") : ja.clients.keyUnused}
                          </div>
                        ))}
                  </td>
                  <td>
                    <RevokeClient id={c.id} status={c.status} canManage={canManage} />
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
