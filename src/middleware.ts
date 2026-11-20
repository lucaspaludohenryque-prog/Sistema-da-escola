import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/features/auth/constants";
import { verifySessionToken } from "@/features/auth/jwt";

const DASHBOARD_PREFIX = "/dashboard";
const LOGIN_PATH = "/login";

function isSafeRedirectPath(path: string): boolean {
  return path.startsWith(DASHBOARD_PREFIX) && !path.startsWith("//");
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith(DASHBOARD_PREFIX)) {
    if (!session) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      const requestedPath = `${pathname}${search}`;
      if (isSafeRedirectPath(requestedPath)) {
        loginUrl.searchParams.set("next", requestedPath);
      }

      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete(SESSION_COOKIE_NAME);
      }
      return response;
    }

    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH && session) {
    return NextResponse.redirect(new URL(DASHBOARD_PREFIX, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
