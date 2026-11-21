import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { AttendanceView } from "@/features/attendance/components/AttendanceView";

export const metadata: Metadata = {
  title: "Chamada",
  description: "Registro diário de frequência, diário de conteúdo e histórico de chamadas.",
};

export default async function ChamadaPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const classrooms = await listClassroomsForUser(user);

  return <AttendanceView classrooms={classrooms} />;
}
