import { AttendanceStatus, JustificationStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/features/auth";
import { canManageClassrooms, type ApiErrorPayload } from "@/features/classrooms";
import { listJustificationsForUser } from "@/features/justifications/queries";
import {
  JUSTIFICATION_STATUSES,
  type AbsenceJustificationItem,
} from "@/features/justifications/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const createJustificationSchema = z.object({
  attendanceId: z.string().trim().min(1, "Registro de falta inválido."),
  reason: z
    .string({ required_error: "Informe o motivo da justificativa." })
    .trim()
    .min(5, "Descreva o motivo com ao menos 5 caracteres.")
    .max(1000, "O motivo excede o limite de 1000 caracteres."),
});

export async function GET(
  request: NextRequest
): Promise<
  NextResponse<
    { justifications: AbsenceJustificationItem[]; pendingCount: number } | ApiErrorPayload
  >
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (!canManageClassrooms(user.role) && user.role !== "RESPONSAVEL") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso restrito à Coordenação, Administração e Responsáveis.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const rawStatus = request.nextUrl.searchParams.get("status");
  const statusFilter =
    rawStatus && (JUSTIFICATION_STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as JustificationStatus)
      : undefined;

  try {
    const result = await listJustificationsForUser(user, statusFilter);
    return NextResponse.json(result, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    console.error("[GET /api/justifications] Erro ao listar justificativas:", {
      operation: "justifications.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar as justificativas.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<{ justification: { id: string; status: string; reason: string } } | ApiErrorPayload>
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (user.role !== "RESPONSAVEL") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Apenas Responsáveis podem enviar justificativas de falta.", code: "FORBIDDEN" },
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

  const parsed = createJustificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados da justificativa inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { attendanceId, reason } = parsed.data;

  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      select: {
        id: true,
        status: true,
        studentId: true,
        justification: {
          select: { id: true, status: true },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Registro de frequência não encontrado.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const link = await prisma.guardianStudent.findUnique({
      where: {
        guardianId_studentId: {
          guardianId: user.id,
          studentId: attendance.studentId,
        },
      },
      select: { id: true },
    });

    if (!link) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Você não possui vínculo com este estudante.", code: "FORBIDDEN" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    if (attendance.status !== AttendanceStatus.FALTA) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: "Apenas registros com status FALTA podem receber justificativa.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (attendance.justification?.status === JustificationStatus.APROVADA) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Esta falta já foi justificada e aprovada.", code: "VALIDATION_ERROR" },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const saved = await prisma.absenceJustification.upsert({
      where: { attendanceId: attendance.id },
      update: {
        guardianId: user.id,
        reason,
        status: JustificationStatus.PENDENTE,
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
      },
      create: {
        attendanceId: attendance.id,
        studentId: attendance.studentId,
        guardianId: user.id,
        reason,
        status: JustificationStatus.PENDENTE,
      },
      select: { id: true, status: true, reason: true },
    });

    return NextResponse.json(
      { justification: saved },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/justifications] Erro ao enviar justificativa:", {
      operation: "justifications.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível enviar a justificativa.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
