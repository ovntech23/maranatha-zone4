import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt, type SessionPayload } from "@/lib/session";

const AUTH_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the session cookie
  const sessionToken = request.cookies.get("session")?.value;

  // 2. Try to decrypt/verify it
  let session: SessionPayload | null = null;
  if (sessionToken) {
    session = await decrypt(sessionToken);
  }

  // 3. Handle protected routes gate (everything except login)
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isProtected = !isAuthRoute;
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Redirect logged-in users away from auth pages
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
