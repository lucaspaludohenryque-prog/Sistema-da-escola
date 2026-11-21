import { NotificationType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { listThreadsForUser } from "@/features/messages/queries";
import type { MessageThreadSummary } from "@/features/messages/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const createThreadSchema = z.object({
  studentId: z.string().trim().min(1, "Selecione um estudante."),
  guardianId: z.string().trim().optional(),
  subject: z
    .string({ required_error: "Informe o assunto do atendimento." })
    .trim()
    .min(3, "O assunto deve ter ao menos 3 caracteres.")
    .max(120, "O assunto deve ter no máximo 120 caracteres."),
  content: z
    .string({ required_error: "Escreva a mensagem inicial." })
    .trim()
    .min(2, "A mensagem deve ter ao menos 2 caracteres.")
    .max(2000, "A mensagem excede o limite de 2000 caracteres."),
});

export async function GET(): Promise<
  NextResponse<{ threads: MessageThreadSummary[]; unreadThreadsCount: number } | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (user.role === "ALUNO") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Atendimento restrito a Responsáveis e equipe escolar.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const threads = await listThreadsForUser(user);
    const unreadThreadsCount = threads.filter((t) => t.unreadCount > 0).length;
    return NextResponse.json(
      { threads, unreadThreadsCount },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/messages/threads] Erro ao listar atendimentos:", {
      operation: "messages.threads.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as conversas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ thread: MessageThreadSummary } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (user.role === "ALUNO") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas Responsáveis e equipe escolar podem abrir atendimentos.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = createThreadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados do atendimento inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { studentId, guardianId: requestedGuardianId, subject, content } =
    parsed.data;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        classroom: {
          select: { name: true, subject: true, teacherId: true },
        },
        guardianLinks: {
          select: {
            guardianId: true,
            guardian: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Estudante não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    let resolvedGuardianId: string;
    let resolvedGuardianName: string;
    let resolvedStaffId: string | null = null;
    let resolvedStaffName: string | null = null;

    if (user.role === "RESPONSAVEL") {
      const link = student.guardianLinks.find((l) => l.guardianId === user.id);
      if (!link) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Você não possui vínculo com este estudante.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }
      resolvedGuardianId = user.id;
      resolvedGuardianName = user.name;
      resolvedStaffId = student.classroom.teacherId;
    } else {
      if (
        !canManageClassrooms(user.role) &&
        student.classroom.teacherId !== user.id
      ) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Sem permissão para iniciar atendimento nesta turma.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const targetLink = requestedGuardianId
        ? student.guardianLinks.find((l) => l.guardianId === requestedGuardianId)
        : student.guardianLinks[0];

      if (!targetLink) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: "Este estudante não possui responsável vinculado no portal.",
            code: "VALIDATION_ERROR",
          },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      resolvedGuardianId = targetLink.guardian.id;
      resolvedGuardianName = targetLink.guardian.name;
      resolvedStaffId = user.id;
      resolvedStaffName = user.name;
    }

    const created = await prisma.$transaction(async (tx) => {
      const thread = await tx.messageThread.create({
        data: {
          subject,
          studentId: student.id,
          guardianId: resolvedGuardianId,
          staffId: resolvedStaffId,
          status: "ABERTO",
        },
      });

      const firstMessage = await tx.directMessage.create({
        data: {
          threadId: thread.id,
          senderId: user.id,
          content,
        },
      });

      if (isStaffRole(user.role)) {
        await tx.notification.upsert({
          where: {
            recipientId_referenceKey: {
              recipientId: resolvedGuardianId,
              referenceKey: `MSG_${firstMessage.id}`,
            },
          },
          update: {},
          create: {
            recipientId: resolvedGuardianId,
            studentId: student.id,
            type: NotificationType.COMUNICADO,
            title: `Nova mensagem da escola: ${subject}`,
            message: `${user.name} iniciou um atendimento sobre ${student.name}: "${content.slice(0, 220)}"`,
            referenceKey: `MSG_${firstMessage.id}`,
          },
        });
      }

      return { thread, firstMessage };
    });

    const summary: MessageThreadSummary = {
      id: created.thread.id,
      subject: created.thread.subject,
      status: created.thread.status,
      studentId: student.id,
      studentName: student.name,
      classroomName: student.classroom.name,
      classroomSubject: student.classroom.subject,
      guardianId: resolvedGuardianId,
      guardianName: resolvedGuardianName,
      staffId: resolvedStaffId,
      staffName: resolvedStaffName,
      lastMessage: {
        content: created.firstMessage.content,
        senderName: user.name,
        createdAt: created.firstMessage.createdAt.toISOString(),
      },
      unreadCount: 0,
      updatedAt: created.thread.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { thread: summary },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/messages/threads] Erro ao criar atendimento:", {
      operation: "messages.threads.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível abrir o atendimento.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
