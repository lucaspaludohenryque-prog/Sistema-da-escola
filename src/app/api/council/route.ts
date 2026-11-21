import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { getClassCouncilForUser } from "@/features/council/queries";
import type { ClassCouncilPayload } from "@/features/council/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const termSchema = z.coerce
  .number()
  .int()
  .refine((v): v is 1 | 2 | 3 => v === 1 || v === 2 || v === 3, {
    message: "Selecione o 1º, 2º ou 3º trimestre.",
  });

const upsertMinuteSchema = z.object({
  classroomId: z.string().trim().min(1, "Selecione uma turma."),
  term: termSchema,
  date: z
    .string({ required_error: "Informe a data do conselho." })
    .trim()
    .regex(ISO_DATE_REGEX, "Data deve estar no formato AAAA-MM-DD."),
  summary: z
    .string({ required_error: "Informe o parecer geral da turma." })
    .trim()
    .min(5, "O parecer geral deve ter ao menos 5 caracteres.")
    .max(4000, "O parecer geral excede o limite de 4000 caracteres."),
  decisions: z
    .string({ required_error: "Informe as decisões e encaminhamentos." })
    .trim()
    .min(5, "Os encaminhamentos devem ter ao menos 5 caracteres.")
    .max(4000, "Os encaminhamentos excedem o limite de 4000 caracteres."),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<ClassCouncilPayload | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe escolar.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const classroomId = request.nextUrl.searchParams.get("classroomId") ?? "";
  const termParsed = termSchema.safeParse(
    request.nextUrl.searchParams.get("term") ?? "1"
  );

  if (!classroomId || !termParsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Parâmetros classroomId e term são obrigatórios.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await getClassCouncilForUser({
      classroomId,
      term: termParsed.data,
      user,
    });

    if (result.status === "not_found") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (result.status === "forbidden") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para acessar o conselho desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(result.data, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/council] Erro ao carregar conselho de classe:", {
      operation: "council.get",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os dados do conselho.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ClassCouncilPayload | ApiErrorPayload>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe escolar.", code: "FORBIDDEN" },
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

  const parsed = upsertMinuteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados da ata inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { classroomId, term, date, summary, decisions } = parsed.data;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, teacherId: true },
    });

    if (!classroom) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para registrar ata desta turma.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.classCouncilMinute.upsert({
      where: { classroomId_term: { classroomId, term } },
      update: { date, summary, decisions, authorId: user.id },
      create: { classroomId, term, date, summary, decisions, authorId: user.id },
    });

    const refreshed = await getClassCouncilForUser({ classroomId, term, user });
    if (refreshed.status !== "ok") {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Ata salva, mas houve falha ao recarregar dados.", code: "INTERNAL_ERROR" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(refreshed.data, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[POST /api/council] Erro ao salvar ata de conselho:", {
      operation: "council.upsert",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível salvar a ata do conselho.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
