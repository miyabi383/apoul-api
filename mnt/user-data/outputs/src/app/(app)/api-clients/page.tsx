// src/app/(app)/api-clients/page.tsx
import { api, ApiError, type ClientRow, type SystemRow } from "@/lib/api";
import { getSession, atLeast } from "@/lib/auth";
import { IssueClient, RevokeClient } from "./ClientControls";

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
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : "取得に失敗しました";
  }

  return (
    <>
      <div className="page-head">
        <h1>API Clients</h1>
        <span className="crumb">クライアント / キー管理</span>
      </div>

      <div className="actions">
        <IssueClient canManage={canManage} systemCodes={systems.map((s) => s.code)} />
      </div>

      {error && <div className="err-banner">読み込みエラー — {error}</div>}

      {rows.length === 0 && !error ? (
        <div className="empty">クライアントが未発行です</div>
      ) : (
        <table className="grid">
          <thead>
            <tr>
              <th>クライアント</th>
              <th>システム</th>
              <th>スコープ</th>
              <th>状態</th>
              <th>キー(prefix / 最終利用)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}<div className="tok" style={{ fontSize: 11 }}>{c.id}</div></td>
                <td className="tok">{c.systemCode}</td>
                <td className="tok" style={{ fontSize: 11 }}>{c.scopes.join(", ")}</td>
                <td>
                  <span className={`chip ${c.status === "active" ? "success" : "dead"}`}>{c.status}</span>
                </td>
                <td className="tok" style={{ fontSize: 11 }}>
                  {c.keys.length === 0
                    ? "—"
                    : c.keys.map((k, i) => (
                        <div key={i}>
                          {k.prefix}… {k.revokedAt ? "(失効)" : k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("ja-JP") : "(未使用)"}
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
      )}
    </>
  );
}
