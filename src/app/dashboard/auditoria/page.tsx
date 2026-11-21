import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { AuditBackupView } from "@/features/audit/components/AuditBackupView";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auditoria & Backup",
  description:
    "Logs de auditoria LGPD e exportação completa de backup JSON do sistema escolar.",
};

export default async function AuditoriaPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [records, distinctActions] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);

  return (
    <AuditBackupView
      initialLogs={records.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
      initialActions={distinctActions.map((a) => a.action)}
    />
  );
}
