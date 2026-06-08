"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ja, labelSystemStatus } from "@/lib/i18n/ja";

export function CreateSystem({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!canManage) return null;

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/systems", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, name, baseUrl: baseUrl || undefined }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(`${json?.error?.code ?? res.status}: ${json?.error?.message ?? ""}`);
      else {
        setOpen(false);
        setCode("");
        setName("");
        setBaseUrl("");
        router.refresh();
      }
    } catch {
      setMsg(ja.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        + {ja.systems.add}
      </button>
    );
  }

  return (
    <div className="card form-card">
      <div className="card-title">{ja.systems.add}</div>
      <div className="form-grid">
        <div className="field">
          <label>{ja.systems.code} <span className="field-hint">（{ja.systems.codeHint}）</span></label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={ja.systems.placeholders.code} />
        </div>
        <div className="field">
          <label>{ja.systems.name}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={ja.systems.placeholders.name} />
        </div>
        <div className="field">
          <label>{ja.systems.baseUrl} <span className="field-hint">（{ja.systems.baseUrlOptional}）</span></label>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={ja.systems.placeholders.baseUrl} />
        </div>
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={submit} disabled={busy || !code || !name}>
          {busy ? ja.common.loading : ja.common.register}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          {ja.common.cancel}
        </button>
      </div>
      {msg && <p className="note">{msg}</p>}
    </div>
  );
}

export function ToggleStatus({ id, status, canManage }: { id: string; status: string; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!canManage) return <span className="chip cancelled">{labelSystemStatus(status)}</span>;

  const next = status === "active" ? "disabled" : "active";
  async function toggle() {
    if (next === "disabled" && !window.confirm(ja.systems.disableConfirm)) return;
    setBusy(true);
    try {
      await fetch(`/api/systems/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" className="btn btn-sm btn-ghost" onClick={toggle} disabled={busy}>
      {status === "active" ? ja.systems.disable : ja.systems.enable}
    </button>
  );
}
