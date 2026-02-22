import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/login", "/signup"];
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith("/api");

  const authToken = request.cookies.get("auth_token")?.value;

  if (!isPublicPath && !authToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  if ((pathname === "/login" || pathname === "/signup") && authToken) {
    const appUrl = new URL("/airfoils", request.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
