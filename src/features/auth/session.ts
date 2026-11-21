import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "./constants";
import { verifySessionToken } from "./jwt";
import type { PublicUser } from "./types";

/**
 * Obtem os dados atualizados do usuario autenticado a partir do cookie HTTP-only.
 * Nunca retorna o hash da senha e devolve null se a sessao for ausente ou invalida.
 */
export async function getAuthenticatedUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  if (!user || !user.active) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
