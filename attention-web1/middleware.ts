import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_TOKEN_COOKIE } from "@/lib/api-config";
import { AUTH_COOKIE } from "@/lib/auth";

const publicPaths = ["/login"];
const useApi = process.env.NEXT_PUBLIC_USE_API === "true";

export function middleware(request: NextRequest) {
  const hasAuthCookie = request.cookies.get(AUTH_COOKIE)?.value === "true";
  const hasToken = Boolean(request.cookies.get(AUTH_TOKEN_COOKIE)?.value);
  const isAuthenticated = hasAuthCookie && (!useApi || hasToken);
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (hasAuthCookie && useApi && !hasToken) {
      response.cookies.delete(AUTH_COOKIE);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
