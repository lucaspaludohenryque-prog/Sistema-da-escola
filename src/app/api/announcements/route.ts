import { NotificationType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { listAnnouncementsForUser } from "@/features/announcements/queries";
import {
  ANNOUNCEMENT_PRIORITIES,
  type AnnouncementItem,
} from "@/features/announcements/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: "Informe o título do comunicado." })
    .trim()
    .min(3, "O título deve ter ao menos 3 caracteres.")
    .max(140, "O título deve ter no máximo 140 caracteres."),
  content: z
    .string({ required_error: "Informe o texto do comunicado." })
    .trim()
    .min(5, "O comunicado deve ter ao menos 5 caracteres.")
    .max(4000, "O comunicado excede o limite de 4000 caracteres."),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES).default("NORMAL"),
  pinned: z.boolean().optional().default(false),
  classroomId: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export async function GET(): Promise<
  NextResponse<{ announcements: AnnouncementItem[] } | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const announcements = await listAnnouncementsForUser(user);
    return NextResponse.json(
      { announcements },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/announcements] Erro ao listar comunicados:", {
      operation: "announcements.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os comunicados.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ announcement: AnnouncementItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas a equipe escolar pode publicar comunicados.", code: "FORBIDDEN" },
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

  const parsed = createAnnouncementSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados do comunicado inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { title, content, priority, pinned, classroomId } = parsed.data;
  const isManager = canManageClassrooms(user.role);

  if (!isManager && !classroomId) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Professores devem selecionar uma de suas turmas para publicar o comunicado.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    let classroomLabel: string | null = null;
    if (classroomId) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
        select: { id: true, name: true, subject: true, teacherId: true },
      });

      if (!classroom) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Turma não encontrada.", code: "NOT_FOUND" },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      if (!isManager && classroom.teacherId !== user.id) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Sem permissão para publicar comunicados nesta turma.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      classroomLabel = `${classroom.name} - ${classroom.subject}`;
    }

    const created = await prisma.$transaction(async (tx) => {
      const record = await tx.announcement.create({
        data: {
          title,
          content,
          priority,
          pinned: isManager ? pinned : false,
          classroomId,
          authorId: user.id,
        },
      });

      // Buscar responsaveis vinculados aos alunos impactados e disparar Notification COMUNICADO
      const guardianLinks = await tx.guardianStudent.findMany({
        where: {
          student: {
            active: true,
            ...(classroomId ? { classroomId } : {}),
          },
        },
        select: {
          guardianId: true,
          studentId: true,
        },
      });

      // Um aviso por responsavel (evita multiplicar comunicados caso tenha mais de 1 filho na escola)
      const notifiedGuardians = new Map<string, string>();
      for (const link of guardianLinks) {
        if (!notifiedGuardians.has(link.guardianId)) {
          notifiedGuardians.set(link.guardianId, link.studentId);
        }
      }

      const notifTitle = classroomLabel
        ? `Comunicado (${classroomLabel}): ${title}`
        : `Comunicado Escolar: ${title}`;
      const notifMessage =
        content.length > 280 ? `${content.slice(0, 277)}...` : content;
      const referenceKey = `ANN_${record.id}`;

      for (const [guardianId, studentId] of notifiedGuardians.entries()) {
        await tx.notification.upsert({
          where: {
            recipientId_referenceKey: {
              recipientId: guardianId,
              referenceKey,
            },
          },
          update: {
            title: notifTitle,
            message: notifMessage,
          },
          create: {
            recipientId: guardianId,
            studentId,
            type: NotificationType.COMUNICADO,
            title: notifTitle,
            message: notifMessage,
            referenceKey,
          },
        });
      }

      return record;
    });

    const announcement: AnnouncementItem = {
      id: created.id,
      title: created.title,
      content: created.content,
      priority: created.priority,
      pinned: created.pinned,
      classroomId: created.classroomId,
      classroomLabel,
      authorId: created.authorId,
      authorName: user.name,
      canManage: true,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(
      { announcement },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/announcements] Erro ao publicar comunicado:", {
      operation: "announcements.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível publicar o comunicado.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
