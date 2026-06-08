import Link from "next/link";
import { api, ApiError, type JobRow } from "@/lib/api";
import { VisualStatCard } from "@/components/VisualStatCard";
import { PageHeader } from "@/components/PageHeader";
import { JobStatusFilter } from "@/components/JobStatusFilter";
import { StatusChip } from "@/components/StatusChip";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ja } from "@/lib/i18n/ja";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";

  let rows: JobRow[] = [];
  let error: string | null = null;
  try {
    rows = await api.get<{ items: JobRow[] }>(`/v1/jobs${qs}`).then((r) => r.items);
  } catch (e) {
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : e instanceof Error ? e.message : ja.common.fetchError;
  }

  return (
    <>
      <PageHeader title={ja.jobs.title} description={ja.jobs.desc} visual="jobs" />

      {!error && rows.length > 0 && (
        <div className="visual-stats-row">
          <VisualStatCard value={rows.length} label="表示中" tint="sky" />
          <VisualStatCard value={rows.filter((r) => r.status === "success").length} label="成功" tint="mint" />
          <VisualStatCard value={rows.filter((r) => r.status === "retrying" || r.status === "pending").length} label="処理中" tint="sun" />
          <VisualStatCard value={rows.filter((r) => r.status === "fail" || r.status === "dead").length} label="要対応" tint="coral" />
        </div>
      )}

      <JobStatusFilter current={status} />

      {error && <ErrorBanner message={error} />}

      {rows.length === 0 && !error ? (
        <EmptyState message={ja.jobs.empty} hint={ja.jobs.retryHint} scene="jobs" />
      ) : rows.length > 0 ? (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>{ja.jobs.id}</th>
                <th>{ja.jobs.event}</th>
                <th>{ja.jobs.source}</th>
                <th>{ja.jobs.status}</th>
                <th>{ja.jobs.destKey}</th>
                <th>{ja.jobs.attempts}</th>
                <th>{ja.jobs.updated}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id}>
                  <td><Link href={`/jobs/${j.id}`} className="tok">{j.id}</Link></td>
                  <td className="tok">{j.eventType}</td>
                  <td className="tok">{j.sourceSystem}</td>
                  <td><StatusChip status={j.status} /></td>
                  <td className="tok">{j.destinationKey}</td>
                  <td>{j.attemptCount}</td>
                  <td>{new Date(j.updatedAt).toLocaleString("ja-JP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
