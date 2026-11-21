import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import {
  countUnacknowledgedNotifications,
  type NotificationItem,
} from "@/features/notifications";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/notifications/[id]/acknowledge
 * Registra leitura e ciencia ("Li e estou ciente") validando propriedade do aviso.
 */
export async function PATCH(
  _request: NextRequest,
  context: RouteContext
): Promise<
  NextResponse<
    { notification: NotificationItem; unacknowledgedCount: number } | ApiErrorPayload
  >
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;
  if (!id || id.trim().length === 0) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Identificador do aviso inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existing = await prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        recipientId: true,
        readAt: true,
        acknowledgedAt: true,
      },
    });

    if (!existing) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Aviso não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (existing.recipientId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Você não tem permissão para confirmar este aviso.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const now = new Date();
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        readAt: existing.readAt ?? now,
        acknowledgedAt: existing.acknowledgedAt ?? now,
      },
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

    const unacknowledgedCount = await countUnacknowledgedNotifications(user.id);

    const notification: NotificationItem = {
      ...updated,
      readAt: updated.readAt ? updated.readAt.toISOString() : null,
      acknowledgedAt: updated.acknowledgedAt
        ? updated.acknowledgedAt.toISOString()
        : null,
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json(
      { notification, unacknowledgedCount },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/notifications/[id]/acknowledge] Erro ao confirmar ciencia:", {
      operation: "notifications.acknowledge",
      userId: user.id,
      notificationId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível confirmar leitura do aviso.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
