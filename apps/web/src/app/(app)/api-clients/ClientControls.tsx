"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ja } from "@/lib/i18n/ja";

const SCOPE_PRESETS: Array<{ id: string; label: string }> = [
  { id: "events:write", label: "イベント送信" },
  { id: "events:read", label: "イベント参照" },
  { id: "jobs:read", label: "ジョブ参照" },
];

export function IssueClient({ canManage, systemCodes }: { canManage: boolean; systemCodes: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [systemCode, setSystemCode] = useState(systemCodes[0] ?? "");
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["events:write"]);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!canManage) return null;

  function toggleScope(s: string) {
    setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ systemCode, name, scopes }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(`${json?.error?.code ?? res.status}: ${json?.error?.message ?? ""}`);
      else {
        setIssued(json.apiKey.plaintext);
        router.refresh();
      }
    } catch {
      setMsg(ja.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  if (issued) {
    return (
      <div className="card card-warn form-card">
        <div className="card-title">{ja.clients.issuedTitle}</div>
        <p className="note">{ja.clients.issuedWarn}</p>
        <pre className="payload">{issued}</pre>
        <div className="actions">
          <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(issued)}>{ja.common.copy}</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setIssued(null); setOpen(false); setName(""); }}>{ja.common.close}</button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        + {ja.clients.add}
      </button>
    );
  }

  return (
    <div className="card form-card">
      <div className="card-title">{ja.clients.add}</div>
      <div className="form-grid">
        <div className="field">
          <label>{ja.clients.system}</label>
          <select value={systemCode} onChange={(e) => setSystemCode(e.target.value)}>
            {systemCodes.length === 0 ? (
              <option value="">—</option>
            ) : (
              systemCodes.map((c) => <option key={c} value={c}>{c}</option>)
            )}
          </select>
        </div>
        <div className="field">
          <label>{ja.clients.name}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={ja.clients.placeholder} />
        </div>
        <div className="field">
          <label>{ja.clients.scopes}</label>
          <div className="scope-list">
            {SCOPE_PRESETS.map((s) => (
              <label key={s.id} className="scope-item">
                <input type="checkbox" checked={scopes.includes(s.id)} onChange={() => toggleScope(s.id)} />
                <span className="tok">{s.id}</span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{s.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={submit} disabled={busy || !systemCode || !name || scopes.length === 0}>
          {busy ? ja.common.loading : ja.common.issue}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{ja.common.cancel}</button>
      </div>
      {msg && <p className="note">{msg}</p>}
    </div>
  );
}

export function RevokeClient({ id, status, canManage }: { id: string; status: string; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!canManage || status === "revoked") return null;

  async function revoke() {
    const reason = window.prompt(ja.clients.revokeReason) ?? "";
    if (!window.confirm(ja.clients.revokeConfirm)) return;
    setBusy(true);
    try {
      await fetch(`/api/clients/${id}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" className="btn btn-sm btn-danger" onClick={revoke} disabled={busy}>
      {ja.common.revoke}
    </button>
  );
}
