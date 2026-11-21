import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getAuthenticatedUser,
  getDefaultDashboardPath,
  isStaffRole,
} from "@/features/auth";
import { MeritCenterView } from "@/features/badges/components/MeritCenterView";
import { listBadgesForUser } from "@/features/badges/queries";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Medalhas & Mérito",
  description:
    "Central de reconhecimento escolar e sugestões automáticas de medalhas de mérito.",
};

export default async function MeritoPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (!isStaffRole(user.role)) {
    redirect(getDefaultDashboardPath(user.role));
  }

  const [initialBadges, classrooms] = await Promise.all([
    listBadgesForUser(user),
    prisma.classroom.findMany({
      where: canManageClassrooms(user.role) ? {} : { teacherId: user.id },
      select: {
        id: true,
        name: true,
        subject: true,
        students: {
          where: { active: true },
          select: { id: true, name: true, registration: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ name: "asc" }, { subject: "asc" }],
    }),
  ]);

  return (
    <MeritCenterView initialBadges={initialBadges} classrooms={classrooms} />
  );
}
