import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { listOccurrencesForUser } from "@/features/occurrences";
import { OccurrencesView } from "@/features/occurrences/components/OccurrencesView";
import { getSchoolConfig } from "@/features/school-config";

export const metadata: Metadata = {
  title: "Ocorrências",
  description: "Registro e acompanhamento de ocorrências disciplinares e pedagógicas.",
};

export default async function OcorrenciasPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const [classrooms, occurrences, schoolConfig] = await Promise.all([
    listClassroomsForUser(user),
    listOccurrencesForUser(user),
    getSchoolConfig(),
  ]);

  return (
    <OccurrencesView
      classrooms={classrooms}
      initialOccurrences={occurrences}
      schoolName={schoolConfig.name}
    />
  );
}
