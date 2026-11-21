import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  type ApiErrorPayload,
  type StudentRecord,
} from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const importRowSchema = z.object({
  name: z.string().trim(),
  registration: z.string().trim(),
  guardianName: z.string().trim().optional().default(""),
  guardianPhone: z.string().trim().optional().default(""),
});

const importPayloadSchema = z.object({
  students: z
    .array(importRowSchema)
    .min(1, "Envie ao menos 1 aluno no arquivo CSV.")
    .max(500, "O limite máximo por importação é de 500 alunos."),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/classrooms/[id]/import-students
 * Importa alunos em lote via JSON extraido de CSV, ignorando matriculas ja existentes.
 * Exclusivo para ADMIN e COORDENACAO.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<
  NextResponse<
    | {
        importedCount: number;
        skippedCount: number;
        errors: string[];
        students: StudentRecord[];
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

  if (!canManageClassrooms(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: "Apenas Administração e Coordenação podem importar alunos em lote.",
        code: "FORBIDDEN",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { id: classroomId } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Corpo da requisição inválido.", code: "VALIDATION_ERROR" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = importPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados do CSV inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true },
    });

    if (!classroom) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const errors: string[] = [];
    const seenInFile = new Set<string>();
    const validCandidates: Array<{
      name: string;
      registration: string;
      guardianName: string;
      guardianPhone: string;
    }> = [];

    parsed.data.students.forEach((row, index) => {
      const line = index + 2;
      if (row.name.length < 2) {
        errors.push(`Linha ${line}: nome inválido ou vazio.`);
        return;
      }
      if (row.registration.length < 2) {
        errors.push(`Linha ${line} (${row.name}): matrícula inválida ou vazia.`);
        return;
      }
      const normReg = row.registration.trim();
      if (seenInFile.has(normReg)) {
        errors.push(`Linha ${line}: matrícula ${normReg} repetida no arquivo.`);
        return;
      }
      seenInFile.add(normReg);

      validCandidates.push({
        name: row.name.slice(0, 120),
        registration: normReg.slice(0, 40),
        guardianName: (row.guardianName || "Responsável não informado").slice(0, 120),
        guardianPhone: (row.guardianPhone || "Não informado").slice(0, 30),
      });
    });

    if (validCandidates.length === 0) {
      return NextResponse.json(
        { importedCount: 0, skippedCount: 0, errors, students: [] },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    const existing = await prisma.student.findMany({
      where: {
        registration: { in: validCandidates.map((c) => c.registration) },
      },
      select: { registration: true },
    });
    const existingSet = new Set(existing.map((e) => e.registration));

    const toCreate = validCandidates.filter((c) => !existingSet.has(c.registration));
    const skippedCount = validCandidates.length - toCreate.length;

    let createdStudents: StudentRecord[] = [];

    if (toCreate.length > 0) {
      await prisma.student.createMany({
        data: toCreate.map((c) => ({
          classroomId,
          name: c.name,
          registration: c.registration,
          guardianName: c.guardianName,
          guardianPhone: c.guardianPhone,
          active: true,
        })),
        skipDuplicates: true,
      });

      const inserted = await prisma.student.findMany({
        where: {
          classroomId,
          registration: { in: toCreate.map((c) => c.registration) },
        },
        select: {
          id: true,
          name: true,
          registration: true,
          guardianName: true,
          guardianPhone: true,
          active: true,
          classroomId: true,
          createdAt: true,
        },
      });

      createdStudents = inserted.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      }));
    }

    return NextResponse.json(
      {
        importedCount: createdStudents.length,
        skippedCount,
        errors,
        students: createdStudents,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/classrooms/[id]/import-students] Erro ao importar CSV:", {
      operation: "students.importCsv",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível importar os alunos do CSV.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
