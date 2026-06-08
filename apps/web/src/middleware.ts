import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { assertAuthNotDisabledInProduction } from "@apoul/shared";

assertAuthNotDisabledInProduction();

const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();

  if (AUTH_DISABLED) {
    if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
      return NextResponse.redirect(new URL("/jobs", req.url));
    }
    return NextResponse.next();
  }

  const PUBLIC = ["/login", "/api/auth/login"];
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const session = req.cookies.get("apoul_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
