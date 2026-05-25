import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const PROTECTED_ROUTES = ["/"];
const AUTH_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the session cookie
  const sessionToken = request.cookies.get("session")?.value;

  // 2. Try to decrypt/verify it
  let session = null;
  if (sessionToken) {
    session = await decrypt(sessionToken);
  }

  // 3. Handle protected routes gate
  const isProtected = PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Redirect logged-in users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route);
  if (isAuthRoute && session) {
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Config to specify matching paths, ignoring static/public assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
