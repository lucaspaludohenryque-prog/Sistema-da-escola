import { prisma } from "@/lib/prisma";
import type { NotificationItem, NotificationsResponse } from "./types";

/**
 * Conta avisos pendentes de confirmacao de leitura para o usuario autenticado.
 * Retorna 0 em caso de erro transitorio para nao derrubar o layout.
 */
export async function countUnacknowledgedNotifications(
  userId: string
): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        recipientId: userId,
        acknowledgedAt: null,
      },
    });
  } catch (error: unknown) {
    console.error("[countUnacknowledgedNotifications] Falha ao contar avisos:", {
      operation: "notifications.count",
      userId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return 0;
  }
}

/**
 * Lista todos os avisos do destinatario ordenados do mais recente para o mais antigo,
 * junto com a contagem de avisos aguardando ciencia.
 */
export async function listNotificationsForUser(
  userId: string
): Promise<NotificationsResponse> {
  const records = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      recipientId: true,
      studentId: true,
      type: true,
      title: true,
      message: true,
      referenceKey: true,
      readAt: true,
      acknowledgedAt: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          registration: true,
          classroom: {
            select: {
              id: true,
              name: true,
              subject: true,
            },
          },
        },
      },
    },
  });

  let unacknowledgedCount = 0;
  const notifications: NotificationItem[] = records.map((item) => {
    if (!item.acknowledgedAt) {
      unacknowledgedCount += 1;
    }
    return {
      id: item.id,
      recipientId: item.recipientId,
      studentId: item.studentId,
      type: item.type,
      title: item.title,
      message: item.message,
      referenceKey: item.referenceKey,
      readAt: item.readAt ? item.readAt.toISOString() : null,
      acknowledgedAt: item.acknowledgedAt
        ? item.acknowledgedAt.toISOString()
        : null,
      createdAt: item.createdAt.toISOString(),
      student: item.student,
    };
  });

  return {
    notifications,
    unacknowledgedCount,
  };
}
