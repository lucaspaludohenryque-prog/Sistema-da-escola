import { BadgeCategory, NotificationType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { listBadgesForUser } from "@/features/badges/queries";
import { BADGE_CATEGORIES, type StudentBadgeItem } from "@/features/badges/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const createBadgeSchema = z.object({
  studentId: z.string().trim().min(1, "Selecione um estudante."),
  category: z.enum(BADGE_CATEGORIES),
  title: z
    .string({ required_error: "Informe o título da medalha." })
    .trim()
    .min(3, "O título deve ter ao menos 3 caracteres.")
    .max(100, "O título deve ter no máximo 100 caracteres."),
  reason: z
    .string({ required_error: "Informe o motivo do reconhecimento." })
    .trim()
    .min(5, "O motivo deve ter ao menos 5 caracteres.")
    .max(500, "O motivo excede o limite de 500 caracteres."),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ badges: StudentBadgeItem[] } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const classroomId = request.nextUrl.searchParams.get("classroomId") ?? undefined;
  const studentId = request.nextUrl.searchParams.get("studentId") ?? undefined;

  try {
    const badges = await listBadgesForUser(user, {
      classroomId: classroomId || undefined,
      studentId: studentId || undefined,
    });
    return NextResponse.json({ badges }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/badges] Erro ao listar medalhas:", {
      operation: "badges.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as medalhas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ badge: StudentBadgeItem } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas a equipe pedagógica pode conceder medalhas.", code: "FORBIDDEN" },
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

  const parsed = createBadgeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados da medalha inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { studentId, category, title, reason } = parsed.data;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        registration: true,
        userId: true,
        classroomId: true,
        classroom: {
          select: { id: true, name: true, subject: true, teacherId: true },
        },
        guardianLinks: {
          select: { guardianId: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Estudante não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (
      !canManageClassrooms(user.role) &&
      student.classroom.teacherId !== user.id
    ) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para conceder medalhas nesta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const record = await tx.studentBadge.create({
        data: {
          studentId: student.id,
          classroomId: student.classroomId,
          category: category as BadgeCategory,
          title,
          reason,
          awardedById: user.id,
        },
      });

      const recipientIds = new Set<string>();
      for (const link of student.guardianLinks) {
        recipientIds.add(link.guardianId);
      }
      if (student.userId) {
        recipientIds.add(student.userId);
      }

      const notifTitle = `🏆 Nova Medalha de Mérito para ${student.name}!`;
      const notifMessage = `${student.name} recebeu a medalha "${title}" em ${student.classroom.name} (${student.classroom.subject}). Motivo: ${reason}`;
      const referenceKey = `BADGE_${record.id}`;

      for (const recipientId of recipientIds) {
        await tx.notification.upsert({
          where: {
            recipientId_referenceKey: {
              recipientId,
              referenceKey,
            },
          },
          update: {
            title: notifTitle,
            message: notifMessage,
          },
          create: {
            recipientId,
            studentId: student.id,
            type: NotificationType.COMUNICADO,
            title: notifTitle,
            message: notifMessage,
            referenceKey,
          },
        });
      }

      return record;
    });

    const badge: StudentBadgeItem = {
      id: created.id,
      studentId: student.id,
      studentName: student.name,
      studentRegistration: student.registration,
      classroomId: student.classroomId,
      classroomName: student.classroom.name,
      classroomSubject: student.classroom.subject,
      category: created.category,
      title: created.title,
      reason: created.reason,
      awardedById: user.id,
      awardedByName: user.name,
      canDelete: true,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json({ badge }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[POST /api/badges] Erro ao conceder medalha:", {
      operation: "badges.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível conceder a medalha.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
