import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { SESSION_DURATION_SECONDS } from "./constants";
import { USER_ROLES, type SessionPayload, type UserRole } from "./types";

const JWT_ALGORITHM = "HS256";
const MIN_SECRET_LENGTH = 16;

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      "JWT_SECRET ausente ou invalido. Defina uma chave com pelo menos 16 caracteres no arquivo .env."
    );
  }

  return new TextEncoder().encode(secret);
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Assina um token JWT compacto contendo apenas o identificador do usuario (sub)
 * e seu perfil de acesso (role), compativel com o Edge Runtime.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secretKey = getJwtSecretKey();

  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Valida a assinatura e expiracao do JWT de sessao.
 * Retorna o payload tipado ou null caso o token seja invalido ou expirado.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
    });

    if (typeof payload.sub !== "string" || !payload.sub || !isUserRole(payload.role)) {
      return null;
    }

    return {
      sub: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
