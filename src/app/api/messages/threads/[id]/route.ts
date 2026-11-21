import { NotificationType, ThreadStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import {
  canUserAccessThread,
  countUnreadThreadsForUser,
  getThreadDetailAndMarkRead,
} from "@/features/messages/queries";
import {
  THREAD_STATUSES,
  type DirectMessageItem,
  type ThreadDetailPayload,
} from "@/features/messages/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const sendMessageSchema = z.object({
  content: z
    .string({ required_error: "Digite sua mensagem." })
    .trim()
    .min(1, "Digite sua mensagem.")
    .max(2000, "A mensagem excede o limite de 2000 caracteres."),
});

const patchThreadSchema = z.object({
  status: z.enum(THREAD_STATUSES),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<
  NextResponse<
    (ThreadDetailPayload & { unreadThreadsCount: number }) | ApiErrorPayload
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

  try {
    const result = await getThreadDetailAndMarkRead(id, user);
    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Conversa não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }
    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para acessar esta conversa.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const unreadThreadsCount = await countUnreadThreadsForUser(user);
    return NextResponse.json(
      { ...result.data, unreadThreadsCount },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/messages/threads/[id]] Erro ao carregar conversa:", {
      operation: "messages.thread.get",
      userId: user.id,
      threadId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as mensagens.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ message: DirectMessageItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = sendMessageSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Mensagem inválida.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const access = await canUserAccessThread(id, user);
    if (!access.allowed) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error:
            access.reason === "not_found"
              ? "Conversa não encontrada."
              : "Sem permissão para enviar mensagem nesta conversa.",
          code: access.reason === "not_found" ? "NOT_FOUND" : "FORBIDDEN",
        },
        {
          status: access.reason === "not_found" ? 404 : 403,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    if (access.thread.status !== "ABERTO") {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Este atendimento está encerrado. Reabra para enviar novas mensagens.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const content = parsed.data.content;

    const created = await prisma.$transaction(async (tx) => {
      const msg = await tx.directMessage.create({
        data: {
          threadId: id,
          senderId: user.id,
          content,
        },
      });

      await tx.messageThread.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          ...(isStaffRole(user.role) && !access.thread.staffId
            ? { staffId: user.id }
            : {}),
        },
      });

      if (isStaffRole(user.role)) {
        await tx.notification.upsert({
          where: {
            recipientId_referenceKey: {
              recipientId: access.thread.guardianId,
              referenceKey: `MSG_${msg.id}`,
            },
          },
          update: {},
          create: {
            recipientId: access.thread.guardianId,
            studentId: access.thread.studentId,
            type: NotificationType.COMUNICADO,
            title: `Nova resposta no atendimento: ${access.thread.subject}`,
            message: `${user.name}: "${content.slice(0, 220)}"`,
            referenceKey: `MSG_${msg.id}`,
          },
        });
      }

      return msg;
    });

    const message: DirectMessageItem = {
      id: created.id,
      threadId: created.threadId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: created.content,
      readAt: null,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json({ message }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[POST /api/messages/threads/[id]] Erro ao enviar mensagem:", {
      operation: "messages.send",
      userId: user.id,
      threadId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível enviar a mensagem.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ status: ThreadStatus } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Apenas a equipe escolar pode encerrar ou reabrir atendimentos.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = patchThreadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Status inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const access = await canUserAccessThread(id, user);
    if (!access.allowed) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error:
            access.reason === "not_found"
              ? "Conversa não encontrada."
              : "Sem permissão para alterar este atendimento.",
          code: access.reason === "not_found" ? "NOT_FOUND" : "FORBIDDEN",
        },
        {
          status: access.reason === "not_found" ? 404 : 403,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    const updated = await prisma.messageThread.update({
      where: { id },
      data: { status: parsed.data.status as ThreadStatus },
      select: { status: true },
    });

    return NextResponse.json(
      { status: updated.status },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/messages/threads/[id]] Erro ao atualizar status:", {
      operation: "messages.thread.patch",
      userId: user.id,
      threadId: id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível atualizar o status do atendimento.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
