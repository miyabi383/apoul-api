"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/illustrations/BrandMark";
import { SceneIllustration } from "@/components/illustrations/SceneIllustrations";
import { ThemeToggle } from "@/components/ThemeProvider";
import { ja } from "@/lib/i18n/ja";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) setError(json?.error ?? ja.login.failed);
      else router.push("/jobs");
    } catch {
      setError(ja.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ThemeToggle />
      </div>
      <form className="login-card" data-testid="login-form" onSubmit={submit}>
        <div className="login-art" aria-hidden>
          <SceneIllustration scene="hub" />
        </div>
        <div className="login-brand">
          <BrandMark size={52} />
          <div>
            <div className="brand">{ja.app.name}</div>
            <div className="brand-sub">{ja.app.subtitle}</div>
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">{ja.login.email}</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">{ja.login.password}</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="err-banner" role="alert"><strong>エラー</strong><span>{error}</span></div>}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? ja.login.submitting : ja.login.submit}
        </button>
      </form>
    </div>
  );
}
