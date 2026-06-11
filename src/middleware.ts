import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login";
  const token = request.cookies.get("adminToken")?.value;

  if (!token && !isLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (token && isLogin) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
