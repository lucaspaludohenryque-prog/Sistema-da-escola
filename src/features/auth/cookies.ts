import type { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "./constants";

interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict";
  path: string;
  maxAge: number;
}

export function buildSessionCookieOptions(maxAge: number): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  };
}

/** Grava o JWT de autenticacao em cookie HTTP-only na resposta HTTP. */
export function attachSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    buildSessionCookieOptions(SESSION_DURATION_SECONDS)
  );
}

/** Remove o cookie de sessao expirando-o imediatamente no navegador. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", buildSessionCookieOptions(0));
}
