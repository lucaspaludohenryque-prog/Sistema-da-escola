import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { getClassroomDetailForUser } from "@/features/classrooms";
import { ClassroomDetailView } from "@/features/classrooms/components/ClassroomDetailView";

interface ClassroomDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Detalhes da Turma",
  description: "Lista de alunos matriculados e gestão cadastral da turma.",
};

export default async function ClassroomDetailPage({
  params,
}: ClassroomDetailPageProps): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const result = await getClassroomDetailForUser(id, user);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "forbidden") {
    redirect("/dashboard/turmas");
  }

  return <ClassroomDetailView initialClassroom={result.classroom} />;
}
