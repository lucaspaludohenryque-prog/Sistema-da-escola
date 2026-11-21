import type { PublicUser } from "@/features/auth/types";
import { prisma } from "@/lib/prisma";

export interface RecordAuditLogInput {
  user: Pick<PublicUser, "id" | "name" | "role"> | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details: string;
}

/**
 * Registra um evento de auditoria LGPD/seguranca na tabela audit_logs.
 * Envolvido em try/catch para garantir que falhas de log nunca interrompam
 * a operacao principal do usuario.
 */
export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.user?.id ?? null,
        userName: input.user?.name ?? "Sistema",
        userRole: input.user?.role ?? "SYSTEM",
        action: input.action.trim().toUpperCase(),
        entity: input.entity.trim(),
        entityId: input.entityId ?? null,
        details: input.details.slice(0, 1000),
      },
    });
  } catch (error: unknown) {
    console.error("[recordAuditLog] Falha ao gravar log de auditoria:", {
      action: input.action,
      entity: input.entity,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
  }
}
