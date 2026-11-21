import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { AttendanceView } from "@/features/attendance/components/AttendanceView";

export const metadata: Metadata = {
  title: "Chamada",
  description: "Registro diário de frequência, diário de conteúdo e histórico de chamadas.",
};

interface ChamadaPageProps {
  searchParams: Promise<{
    classroomId?: string;
    lessonNumber?: string;
    content?: string;
  }>;
}

export default async function ChamadaPage({
  searchParams,
}: ChamadaPageProps): Promise<React.JSX.Element> {
  const [user, params] = await Promise.all([
    getAuthenticatedUser(),
    searchParams,
  ]);

  if (!user) {
    redirect("/login");
  }

  const classrooms = await listClassroomsForUser(user);
  const parsedLesson = Number(params.lessonNumber);
  const initialLessonNumber =
    Number.isInteger(parsedLesson) && parsedLesson >= 1 && parsedLesson <= 6
      ? parsedLesson
      : undefined;

  return (
    <AttendanceView
      classrooms={classrooms}
      initialClassroomId={params.classroomId}
      initialLessonNumber={initialLessonNumber}
      initialPrefillContent={params.content}
    />
  );
}
