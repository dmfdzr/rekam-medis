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

  if (hasSessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL("/app", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
