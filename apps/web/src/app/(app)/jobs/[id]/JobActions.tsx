"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ja } from "@/lib/i18n/ja";

export function JobActions({ id, status, canManage }: { id: string; status: string; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!canManage) return <p className="note">{ja.common.adminRequired}</p>;

  async function act(path: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const json = await res.json();
      if (!res.ok) setMsg(json?.error?.message ?? ja.common.networkError);
      else router.refresh();
    } catch {
      setMsg(ja.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="actions">
      {status !== "success" && status !== "dead" && (
        <button type="button" className="btn" disabled={busy} onClick={() => act(`/api/jobs/${id}/retry`)}>
          {busy ? ja.common.loading : ja.jobs.retry}
        </button>
      )}
      {status !== "dead" && status !== "success" && (
        <button type="button" className="btn btn-danger" disabled={busy} onClick={() => act(`/api/jobs/${id}/dead`)}>
          {ja.jobs.dead}
        </button>
      )}
      {msg && <span className="note">{msg}</span>}
    </div>
  );
}
