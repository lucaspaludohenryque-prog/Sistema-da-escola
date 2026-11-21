import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { CouncilView } from "@/features/council/components/CouncilView";

export const metadata: Metadata = {
  title: "Conselho de Classe",
  description: "Resumo de indicadores da turma e ata imprimível do Conselho de Classe.",
};

export default async function ConselhoPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (!isStaffRole(user.role)) {
    redirect("/dashboard");
  }

  const classrooms = await listClassroomsForUser(user);
  return <CouncilView classrooms={classrooms} />;
}
