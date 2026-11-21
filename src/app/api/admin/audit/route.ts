import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/features/auth";
import type { ApiErrorPayload } from "@/features/classrooms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string;
  createdAt: string;
}

export async function GET(
  request: NextRequest
): Promise<
  NextResponse<
    { logs: AuditLogItem[]; actions: string[] } | ApiErrorPayload
  >
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Sessão ausente ou expirada.", code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Acesso exclusivo para Administradores.", code: "FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const action = request.nextUrl.searchParams.get("action")?.trim() || "";
  const userRole = request.nextUrl.searchParams.get("userRole")?.trim() || "";
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";

  try {
    const [records, distinctActions] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          ...(action ? { action } : {}),
          ...(userRole ? { userRole } : {}),
          ...(q
            ? {
                OR: [
                  { userName: { contains: q, mode: "insensitive" } },
                  { details: { contains: q, mode: "insensitive" } },
                  { action: { contains: q, mode: "insensitive" } },
                  { entity: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.auditLog.findMany({
        distinct: ["action"],
        select: { action: true },
        orderBy: { action: "asc" },
      }),
    ]);

    return NextResponse.json(
      {
        logs: records.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
        actions: distinctActions.map((a) => a.action),
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    console.error("[GET /api/admin/audit] Erro ao listar logs de auditoria:", {
      operation: "admin.audit.list",
      userId: user.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json<ApiErrorPayload>(
      { error: "Não foi possível carregar os registros de auditoria.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
