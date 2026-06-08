import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${process.env.APOUL_API_URL ?? "http://localhost:4100"}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: json?.error?.message ?? "ログイン失敗" }, { status: res.status });
    }
    await setSession({ userId: json.user.id, email: json.user.email, role: json.user.role });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "API接続エラー" }, { status: 502 });
  }
}
