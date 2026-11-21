import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { GradesView } from "@/features/grades/components/GradesView";

export const metadata: Metadata = {
  title: "Notas",
  description: "Planilha de avaliações, lançamento de notas e médias por trimestre.",
};

export default async function NotasPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const classrooms = await listClassroomsForUser(user);

  return <GradesView classrooms={classrooms} />;
}
