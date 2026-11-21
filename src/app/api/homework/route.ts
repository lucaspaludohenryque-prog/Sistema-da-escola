import { SchoolEventType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { listHomeworksForUser } from "@/features/homework/queries";
import { HOMEWORK_TYPES, type HomeworkItem } from "@/features/homework/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const createHomeworkSchema = z.object({
  classroomId: z.string().trim().min(1, "Selecione uma turma."),
  title: z
    .string({ required_error: "Informe o título da atividade." })
    .trim()
    .min(3, "O título deve ter ao menos 3 caracteres.")
    .max(140, "O título deve ter no máximo 140 caracteres."),
  description: z
    .string({ required_error: "Informe as orientações da atividade." })
    .trim()
    .min(3, "As orientações devem ter ao menos 3 caracteres.")
    .max(3000, "A descrição excede o limite de 3000 caracteres."),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de entrega inválida (YYYY-MM-DD)."),
  resourceUrl: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine(
      (v) => v === null || /^https?:\/\/.+/i.test(v),
      "Informe uma URL válida iniciando com http:// ou https://."
    ),
  type: z.enum(HOMEWORK_TYPES).default("TAREFA"),
  addToCalendar: z.boolean().optional().default(false),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ homeworks: HomeworkItem[] } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const classroomId = request.nextUrl.searchParams.get("classroomId") ?? undefined;

  try {
    const homeworks = await listHomeworksForUser(user, classroomId || undefined);
    return NextResponse.json(
      { homeworks },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/homework] Erro ao listar tarefas:", {
      operation: "homework.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as tarefas e materiais.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ homework: HomeworkItem; calendarEventCreated: boolean } | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas a equipe pedagógica pode publicar tarefas e materiais.", code: "FORBIDDEN" },
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

  const parsed = createHomeworkSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados da tarefa inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const {
    classroomId,
    title,
    description,
    dueDate,
    resourceUrl,
    type,
    addToCalendar,
  } = parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        subject: true,
        teacherId: true,
        _count: { select: { students: { where: { active: true } } } },
      },
    });

    if (!classroom) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para publicar tarefas nesta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const hw = await tx.homework.create({
        data: {
          classroomId,
          authorId: user.id,
          title,
          description,
          dueDate,
          resourceUrl,
          type,
        },
      });

      if (addToCalendar) {
        await tx.schoolEvent.create({
          data: {
            title: `${type === "TRABALHO" ? "Entrega de Trabalho" : "Prazo"}: ${title}`,
            description:
              description.length > 400
                ? `${description.slice(0, 397)}...`
                : description,
            date: dueDate,
            type:
              type === "TRABALHO" || type === "TAREFA"
                ? SchoolEventType.TRABALHO
                : SchoolEventType.EVENTO,
            classroomId,
            authorId: user.id,
          },
        });
      }

      return hw;
    });

    const homework: HomeworkItem = {
      id: created.id,
      classroomId: created.classroomId,
      classroomName: classroom.name,
      classroomSubject: classroom.subject,
      authorId: created.authorId,
      authorName: user.name,
      title: created.title,
      description: created.description,
      dueDate: created.dueDate,
      resourceUrl: created.resourceUrl,
      type: created.type,
      createdAt: created.createdAt.toISOString(),
      canManage: true,
      totalStudents: classroom._count.students,
      submittedCount: 0,
      studentSubmissions: [],
    };

    return NextResponse.json(
      { homework, calendarEventCreated: addToCalendar },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/homework] Erro ao criar tarefa:", {
      operation: "homework.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível publicar a tarefa.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
