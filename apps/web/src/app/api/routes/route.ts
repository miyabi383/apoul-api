import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import { getSession, atLeast } from "@/lib/auth";

export async function GET() {
  try {
    const data = await api.get("/v1/routes");
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!atLeast(session?.role, "admin")) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "admin required" } }, { status: 403 });
  }
  const body = await req.json();
  try {
    const data = await api.post("/v1/routes", body);
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: { message: "API保存に失敗しました" } }, { status: 502 });
  }
}
