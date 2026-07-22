import { NextRequest, NextResponse } from "next/server";

const publicAdminRoutes = ["/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (publicAdminRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return NextResponse.next();

  const cookieName = process.env.AUTH_COOKIE_NAME || "ror_admin_session";
  if (!request.cookies.get(cookieName)?.value) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("reason", "authentication-required");
    loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
