import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import {
  canManageClassrooms,
  listClassroomsForUser,
} from "@/features/classrooms";
import { ClassroomsView } from "@/features/classrooms/components/ClassroomsView";

export const metadata: Metadata = {
  title: "Turmas",
  description: "Gestão de turmas, disciplinas e estudantes matriculados.",
};

export default async function TurmasPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const classrooms = await listClassroomsForUser(user);
  const canManage = canManageClassrooms(user.role);

  return (
    <ClassroomsView
      initialClassrooms={classrooms}
      canManage={canManage}
    />
  );
}
