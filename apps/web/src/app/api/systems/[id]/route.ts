import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import { getSession, atLeast } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!atLeast(session?.role, "admin")) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "admin required" } }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const data = await api.patch(`/v1/systems/${id}`, body);
  return NextResponse.json(data);
}
