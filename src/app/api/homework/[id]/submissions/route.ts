import { HomeworkSubmissionStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { getHomeworkSubmissionsForStaff } from "@/features/homework/queries";
import {
  HOMEWORK_SUBMISSION_STATUSES,
  type HomeworkSubmissionDetail,
} from "@/features/homework/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const studentPatchSchema = z.object({
  studentNote: z
    .string()
    .trim()
    .max(600, "A observação deve ter no máximo 600 caracteres.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

const staffPatchSchema = z.object({
  studentId: z.string().trim().min(1, "Estudante inválido."),
  status: z.enum(HOMEWORK_SUBMISSION_STATUSES),
  teacherFeedback: z
    .string()
    .trim()
    .max(600, "O feedback deve ter no máximo 600 caracteres.")
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<
  NextResponse<
    | {
        homework: {
          id: string;
          title: string;
          dueDate: string;
          classroomName: string;
          classroomSubject: string;
        };
        submissions: HomeworkSubmissionDetail[];
      }
    | ApiErrorPayload
  >
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe pedagógica.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id: homeworkId } = await context.params;

  try {
    const result = await getHomeworkSubmissionsForStaff(homeworkId, user);
    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Tarefa não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }
    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para acompanhar entregas desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { homework: result.homework, submissions: result.submissions },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/homework/[id]/submissions] Erro ao listar entregas:", {
      operation: "homework.submissions.list",
      userId: user.id,
      homeworkId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as entregas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<
  NextResponse<
    | {
        submission: {
          studentId: string;
          status: string;
          studentNote: string | null;
          teacherFeedback: string | null;
          submittedAt: string | null;
        };
      }
    | ApiErrorPayload
  >
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const { id: homeworkId } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const hw = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        classroomId: true,
        classroom: { select: { teacherId: true } },
      },
    });

    if (!hw) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Tarefa não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (user.role === "ALUNO") {
      const parsed = studentPatchSchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: parsed.error.issues[0]?.message ?? "Observação inválida.",
            code: "VALIDATION_ERROR",
          },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true, classroomId: true },
      });

      if (!student || student.classroomId !== hw.classroomId) {
        return NextResponse.json<ApiErrorPayload>(
          { error: "Esta tarefa não pertence à sua turma.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const now = new Date();
      const saved = await prisma.homeworkSubmission.upsert({
        where: {
          homeworkId_studentId: {
            homeworkId: hw.id,
            studentId: student.id,
          },
        },
        update: {
          status: HomeworkSubmissionStatus.ENTREGUE,
          studentNote: parsed.data.studentNote,
          submittedAt: now,
        },
        create: {
          homeworkId: hw.id,
          studentId: student.id,
          status: HomeworkSubmissionStatus.ENTREGUE,
          studentNote: parsed.data.studentNote,
          submittedAt: now,
        },
      });

      return NextResponse.json(
        {
          submission: {
            studentId: saved.studentId,
            status: saved.status,
            studentNote: saved.studentNote,
            teacherFeedback: saved.teacherFeedback,
            submittedAt: saved.submittedAt ? saved.submittedAt.toISOString() : null,
          },
        },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    if (!isStaffRole(user.role)) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Apenas alunos e equipe pedagógica podem atualizar entregas.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && hw.classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para gerenciar entregas desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const parsed = staffPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: parsed.error.issues[0]?.message ?? "Dados da entrega inválidos.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { studentId, status, teacherFeedback } = parsed.data;

    const student = await prisma.student.findFirst({
      where: { id: studentId, classroomId: hw.classroomId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Estudante não pertence à turma desta tarefa.", code: "VALIDATION_ERROR" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const existingSub = await prisma.homeworkSubmission.findUnique({
      where: { homeworkId_studentId: { homeworkId: hw.id, studentId } },
      select: { submittedAt: true },
    });

    const submittedAt =
      status === "ENTREGUE" || status === "CONFERIDO"
        ? existingSub?.submittedAt ?? new Date()
        : existingSub?.submittedAt ?? null;

    const saved = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId: hw.id,
          studentId,
        },
      },
      update: {
        status: status as HomeworkSubmissionStatus,
        teacherFeedback,
        submittedAt,
      },
      create: {
        homeworkId: hw.id,
        studentId,
        status: status as HomeworkSubmissionStatus,
        teacherFeedback,
        submittedAt,
      },
    });

    return NextResponse.json(
      {
        submission: {
          studentId: saved.studentId,
          status: saved.status,
          studentNote: saved.studentNote,
          teacherFeedback: saved.teacherFeedback,
          submittedAt: saved.submittedAt ? saved.submittedAt.toISOString() : null,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/homework/[id]/submissions] Erro ao atualizar entrega:", {
      operation: "homework.submissions.update",
      userId: user.id,
      homeworkId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível atualizar o status da entrega.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
