import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import { getSession, atLeast } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!atLeast(session?.role, "admin")) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "admin required" } }, { status: 403 });
  }
  const body = await req.json();
  const data = await api.post("/v1/systems", body);
  return NextResponse.json(data, { status: 201 });
}
