import { AttendanceStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import {
  ACADEMIC_TERMS,
  FINAL_STATUS_LABELS,
  calculateAnnualAverage,
  calculateFinalTermAverage,
  calculateWeightedTermAverage,
  determineStudentFinalStatus,
  formatScoreBr,
} from "@/features/grades";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function slugifyFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/classrooms/[id]/export-csv
 * Exporta planilha CSV com BOM UTF-8 (\uFEFF) e separador ';' pronta para Excel PT-BR.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  if (!isStaffRole(user.role)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à equipe escolar.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const { id: classroomId } = await context.params;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        subject: true,
        year: true,
        teacherId: true,
        students: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, registration: true, active: true },
        },
        assessments: {
          select: {
            id: true,
            term: true,
            maxScore: true,
            weight: true,
            grades: { select: { studentId: true, score: true } },
          },
        },
        termRecoveries: {
          select: { studentId: true, term: true, score: true },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Turma não encontrada.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Sem permissão para exportar dados desta turma.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const studentIds = classroom.students.map((s) => s.id);
    const attGroups =
      studentIds.length > 0
        ? await prisma.attendance.groupBy({
            by: ["studentId", "status"],
            where: {
              studentId: { in: studentIds },
              lesson: { classroomId: classroom.id },
            },
            _count: { _all: true },
          })
        : [];

    const attMap = new Map<
      string,
      { present: number; absent: number; justified: number }
    >();
    for (const g of attGroups) {
      const cur = attMap.get(g.studentId) ?? { present: 0, absent: 0, justified: 0 };
      if (g.status === AttendanceStatus.PRESENTE) cur.present += g._count._all;
      else if (g.status === AttendanceStatus.FALTA) cur.absent += g._count._all;
      else cur.justified += g._count._all;
      attMap.set(g.studentId, cur);
    }

    const gradeLookup = new Map<string, number>();
    const assessmentsByTerm = new Map<number, typeof classroom.assessments>();
    for (const a of classroom.assessments) {
      const list = assessmentsByTerm.get(a.term) ?? [];
      list.push(a);
      assessmentsByTerm.set(a.term, list);
      for (const g of a.grades) {
        gradeLookup.set(`${a.id}:${g.studentId}`, g.score);
      }
    }

    const recoveryLookup = new Map<string, number>();
    for (const r of classroom.termRecoveries) {
      recoveryLookup.set(`${r.term}:${r.studentId}`, r.score);
    }

    const header = [
      "Matrícula",
      "Nome do Aluno",
      "Total de Aulas",
      "Presenças",
      "Faltas",
      "Justificadas",
      "% Frequência",
      "Média 1º Trim",
      "Média 2º Trim",
      "Média 3º Trim",
      "Média Anual",
      "Situação Final",
    ];

    const lines: string[] = [header.map(escapeCsvCell).join(";")];

    for (const student of classroom.students) {
      const att = attMap.get(student.id) ?? { present: 0, absent: 0, justified: 0 };
      const totalLessons = att.present + att.absent + att.justified;
      const rate =
        totalLessons > 0
          ? Math.round(((att.present + att.justified) / totalLessons) * 100)
          : null;

      const termFinals = ACADEMIC_TERMS.map((term) => {
        const list = assessmentsByTerm.get(term) ?? [];
        const rawAvg = calculateWeightedTermAverage(
          list.map((a) => ({
            score: gradeLookup.get(`${a.id}:${student.id}`) ?? null,
            maxScore: a.maxScore,
            weight: a.weight,
          }))
        );
        const rec = recoveryLookup.get(`${term}:${student.id}`) ?? null;
        return calculateFinalTermAverage(rawAvg, rec);
      });

      const gradedCount = termFinals.filter((v) => v !== null).length;
      const annualAvg = calculateAnnualAverage(termFinals);
      const status = determineStudentFinalStatus(annualAvg, rate, gradedCount);

      const row = [
        student.registration,
        student.name,
        totalLessons,
        att.present,
        att.absent,
        att.justified,
        rate !== null ? `${rate}%` : "-",
        formatScoreBr(termFinals[0] ?? null),
        formatScoreBr(termFinals[1] ?? null),
        formatScoreBr(termFinals[2] ?? null),
        formatScoreBr(annualAvg),
        FINAL_STATUS_LABELS[status],
      ];

      lines.push(row.map(escapeCsvCell).join(";"));
    }

    const csvBody = `\uFEFF${lines.join("\r\n")}`;
    const filename = `rco-${slugifyFilename(classroom.name)}-${slugifyFilename(classroom.subject)}-${classroom.year}.csv`;

    return new NextResponse(csvBody, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/classrooms/[id]/export-csv] Erro ao exportar CSV:", {
      operation: "classroom.exportCsv",
      userId: user.id,
      classroomId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível exportar a planilha da turma.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
