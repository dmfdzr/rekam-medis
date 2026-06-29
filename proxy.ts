import { NextResponse, type NextRequest } from "next/server"

const sessionCookieName = "medrecord_session"
const publicRoutes = new Set(["/", "/login"])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value)
  const isPublicRoute = publicRoutes.has(pathname)

  if (!hasSessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Don't redirect from public routes to /app based on cookie alone.
  // The /login page server component handles the redirect to /app
  // after verifying the session is actually valid via getCurrentUser().
  // This prevents redirect loops when the cookie exists but the session is expired.

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
