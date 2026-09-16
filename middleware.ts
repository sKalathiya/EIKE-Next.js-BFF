import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/documents", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/documents",
    "/documents/:path*",
    "/teams",
    "/teams/:path*",
    "/profile",
    "/profile/:path*",
    "/chat",
    "/chat/:path*",
    "/login",
    "/register",
  ],
};
