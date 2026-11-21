import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { HomeworkBoardView } from "@/features/homework/components/HomeworkBoardView";
import { listHomeworksForUser } from "@/features/homework/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tarefas & Materiais",
  description:
    "Mural de tarefas, trabalhos, leituras e materiais de aula com acompanhamento de entregas.",
};

export default async function TarefasPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const [homeworks, classrooms] = await Promise.all([
    listHomeworksForUser(user),
    isStaffRole(user.role) ? listClassroomsForUser(user) : Promise.resolve([]),
  ]);

  return (
    <HomeworkBoardView
      userRole={user.role}
      initialHomeworks={homeworks}
      classrooms={classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
      }))}
    />
  );
}
