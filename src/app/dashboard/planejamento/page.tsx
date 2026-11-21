import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { LessonPlansView } from "@/features/lesson-plans/components/LessonPlansView";

export const metadata: Metadata = {
  title: "Planejamento de Aulas",
  description: "Plano de ensino trimestral com controle de conteúdos ministrados.",
};

export default async function PlanejamentoPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (!isStaffRole(user.role)) {
    redirect("/dashboard");
  }

  const classrooms = await listClassroomsForUser(user);
  return <LessonPlansView classrooms={classrooms} />;
}
