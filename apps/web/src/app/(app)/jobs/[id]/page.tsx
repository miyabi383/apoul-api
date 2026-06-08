import Link from "next/link";
import { api, ApiError, type JobDetail } from "@/lib/api";
import { getSession, canRetry } from "@/lib/auth";
import { JobActions } from "./JobActions";
import { PageHeader } from "@/components/PageHeader";
import { StatusChip } from "@/components/StatusChip";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ja } from "@/lib/i18n/ja";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const canManage = canRetry(session?.role);

  let job: JobDetail | null = null;
  let error: string | null = null;
  try {
    job = await api.get<JobDetail>(`/v1/jobs/${id}`);
  } catch (e) {
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : ja.common.fetchError;
  }

  return (
    <>
      <PageHeader title={ja.jobs.detail} backHref="/jobs" backLabel={ja.common.back} />

      {error && <ErrorBanner message={error} />}

      {job && (
        <>
          <div className="card">
            <div className="tok" style={{ fontSize: 13 }}>{job.id}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <StatusChip status={job.status} />
              <span className="tok">{job.eventType}</span>
              <span style={{ color: "var(--muted)" }}>← {job.sourceSystem}</span>
            </div>
            <div className="meta-grid">
              <div className="meta-item">
                <label>{ja.jobs.destKeyLabel}</label>
                <span className="tok">{job.destinationKey}</span>
              </div>
              {job.lastErrorCode && (
                <div className="meta-item">
                  <label>{ja.jobs.errorLabel}</label>
                  <span className="tok">{job.lastErrorCode}</span>
                </div>
              )}
            </div>
          </div>

          <JobActions id={job.id} status={job.status} canManage={canManage} />

          <div className="card">
            <div className="card-title">{ja.jobs.payload}</div>
            <pre className="payload">{JSON.stringify(job.payload, null, 2)}</pre>
          </div>

          {job.transformedBody != null && (
            <div className="card">
              <div className="card-title">{ja.jobs.transformed}</div>
              <pre className="payload">{JSON.stringify(job.transformedBody, null, 2)}</pre>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="card-title" style={{ padding: "20px 20px 0" }}>{ja.jobs.attemptHistory}</div>
            <table className="grid">
              <thead>
                <tr>
                  <th>{ja.jobs.attemptNo}</th>
                  <th>{ja.jobs.status}</th>
                  <th>{ja.jobs.http}</th>
                  <th>{ja.jobs.errorLabel}</th>
                  <th>{ja.jobs.time}</th>
                </tr>
              </thead>
              <tbody>
                {job.attempts.map((a) => (
                  <tr key={a.attemptNo}>
                    <td>{a.attemptNo}</td>
                    <td><StatusChip status={a.status} /></td>
                    <td>{a.responseCode ?? ja.common.none}</td>
                    <td className="tok">{a.errorCode ?? ja.common.none}{a.errorMsg ? ` — ${a.errorMsg}` : ""}</td>
                    <td>{new Date(a.createdAt).toLocaleString("ja-JP")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
