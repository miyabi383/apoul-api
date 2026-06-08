import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import { getSession, canRetry } from "@/lib/auth";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!canRetry(session?.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "admin required" } }, { status: 403 });
  }
  const { id } = await ctx.params;
  const data = await api.post(`/v1/jobs/${id}/retry`);
  return NextResponse.json(data);
}
