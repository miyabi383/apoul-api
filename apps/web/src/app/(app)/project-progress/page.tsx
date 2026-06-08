import { api, ApiError, type ProgressRow } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatusChip } from "@/components/StatusChip";
import { ja, labelProgressStatus, chipClassForProgress } from "@/lib/i18n/ja";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  let rows: ProgressRow[] = [];
  let error: string | null = null;
  try {
    rows = await api.get<{ items: ProgressRow[] }>("/v1/progress").then((r) => r.items);
  } catch (e) {
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : ja.common.fetchError;
  }

  return (
    <>
      <PageHeader title={ja.progress.title} description={ja.progress.desc} visual="progress" />

      {error && <ErrorBanner message={error} />}

      {rows.length === 0 && !error ? (
        <EmptyState message={ja.progress.empty} scene="progress" />
      ) : rows.length > 0 ? (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>{ja.progress.wbs}</th>
                <th>{ja.progress.task}</th>
                <th>{ja.progress.status}</th>
                <th>{ja.progress.percent}</th>
                <th>{ja.progress.note}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="tok">{r.wbsCode}</td>
                  <td>{r.title}</td>
                  <td>
                    <StatusChip status={r.status} label={labelProgressStatus(r.status)} className={chipClassForProgress(r.status)} />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="progress-track" style={{ flex: 1, maxWidth: 120 }}>
                        <div className="progress-fill" style={{ width: `${r.percent}%` }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 36 }}>{r.percent}%</span>
                    </div>
                  </td>
                  <td className="note">{r.note ?? ja.common.none}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
