import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/features/auth/constants";
import { verifySessionToken } from "@/features/auth/jwt";
import {
  getDefaultDashboardPath,
  isStaffRole,
  type UserRole,
} from "@/features/auth/types";

const DASHBOARD_PREFIX = "/dashboard";
const LOGIN_PATH = "/login";

const STAFF_ONLY_PREFIXES = [
  "/dashboard/turmas",
  "/dashboard/radar",
  "/dashboard/chamada",
  "/dashboard/mapa-sala",
  "/dashboard/merito",
  "/dashboard/ocorrencias",
  "/dashboard/notas",
  "/dashboard/planejamento",
  "/dashboard/conselho",
  "/dashboard/justificativas",
  "/dashboard/usuarios",
  "/dashboard/configuracoes",
  "/dashboard/auditoria",
  "/dashboard/familia-vinculos",
];

function isSafeRedirectPath(path: string): boolean {
  return path.startsWith(DASHBOARD_PREFIX) && !path.startsWith("//");
}

function resolveRoleRedirect(pathname: string, role: UserRole): string | null {
  const homePath = getDefaultDashboardPath(role);

  if (pathname === DASHBOARD_PREFIX && !isStaffRole(role)) {
    return homePath;
  }

  if (STAFF_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!isStaffRole(role)) {
      return homePath;
    }
    if (
      (pathname.startsWith("/dashboard/usuarios") ||
        pathname.startsWith("/dashboard/configuracoes") ||
        pathname.startsWith("/dashboard/auditoria")) &&
      role !== "ADMIN"
    ) {
      return "/dashboard";
    }
    if (
      (pathname.startsWith("/dashboard/familia-vinculos") ||
        pathname.startsWith("/dashboard/justificativas")) &&
      role !== "ADMIN" &&
      role !== "COORDENACAO"
    ) {
      return "/dashboard";
    }
  }

  if (pathname.startsWith("/dashboard/familia") && !pathname.startsWith("/dashboard/familia-vinculos")) {
    if (role !== "RESPONSAVEL") {
      return homePath;
    }
  }

  if (pathname.startsWith("/dashboard/aluno") && !pathname.startsWith("/dashboard/alunos/")) {
    if (role !== "ALUNO") {
      return homePath;
    }
  }

  if (pathname.startsWith("/dashboard/avisos")) {
    if (role !== "RESPONSAVEL" && role !== "ALUNO") {
      return homePath;
    }
  }

  if (
    pathname.startsWith("/dashboard/mensagens") ||
    pathname.startsWith("/dashboard/reunioes")
  ) {
    if (role === "ALUNO") {
      return homePath;
    }
  }

  return null;
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

    const roleRedirect = resolveRoleRedirect(pathname, session.role);
    if (roleRedirect) {
      return NextResponse.redirect(new URL(roleRedirect, request.url));
    }

    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH && session) {
    return NextResponse.redirect(
      new URL(getDefaultDashboardPath(session.role), request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
