import { VerificationDocType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { getSchoolConfig } from "@/features/school-config";
import { generateVerificationCode } from "@/features/verifications/queries";
import { VERIFICATION_DOC_TYPES } from "@/features/verifications/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const createVerificationSchema = z.object({
  docType: z.enum(VERIFICATION_DOC_TYPES),
  title: z.string().trim().min(3).max(160),
  subjectName: z.string().trim().min(2).max(140),
  classroomName: z.string().trim().min(2).max(140),
  summary: z
    .object({
      schoolYear: z.number().int().optional(),
      termLabel: z.string().max(40).optional(),
      attendanceRate: z.number().nullable().optional(),
      overallAverage: z.number().nullable().optional(),
      totalStudents: z.number().int().optional(),
      belowAverageCount: z.number().int().optional(),
      lowAttendanceCount: z.number().int().optional(),
    })
    .default({}),
});

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    { code: string; verificationUrl: string; issuedAt: string } | ApiErrorPayload
  >
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
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

  const parsed = createVerificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: parsed.error.issues[0]?.message ?? "Dados do documento inválidos.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const school = await getSchoolConfig();
    const year = parsed.data.summary.schoolYear ?? school.schoolYear;
    const summaryJson = JSON.stringify({
      ...parsed.data.summary,
      schoolYear: year,
    });

    let created = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateVerificationCode(year);
      try {
        created = await prisma.documentVerification.create({
          data: {
            code,
            docType: parsed.data.docType as VerificationDocType,
            title: parsed.data.title,
            subjectName: parsed.data.subjectName,
            classroomName: parsed.data.classroomName,
            summaryJson,
            issuedByName: user.name,
          },
          select: { code: true, issuedAt: true },
        });
        break;
      } catch {
        // Retenta se houver colisao improvavel de codigo
      }
    }

    if (!created) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "Não foi possível gerar o código de verificação.", code: "INTERNAL_ERROR" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    const origin = request.nextUrl.origin || "https://rcolasalle.vercel.app";
    const verificationUrl = `${origin}/validar/${created.code}`;

    return NextResponse.json(
      {
        code: created.code,
        verificationUrl,
        issuedAt: created.issuedAt.toISOString(),
      },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[POST /api/verifications] Erro ao registrar verificação:", {
      operation: "verifications.create",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível registrar o código antifraude.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
