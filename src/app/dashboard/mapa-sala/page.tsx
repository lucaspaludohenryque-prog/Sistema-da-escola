import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getAuthenticatedUser,
  getDefaultDashboardPath,
  isStaffRole,
} from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { SeatingMapView } from "@/features/seating/components/SeatingMapView";
import { getClassroomSeatingForUser } from "@/features/seating/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa de Sala",
  description:
    "Espelho de classe interativo com indicadores pedagógicos e chamada visual por carteira.",
};

export default async function MapaSalaPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (!isStaffRole(user.role)) {
    redirect(getDefaultDashboardPath(user.role));
  }

  const classrooms = await listClassroomsForUser(user);
  const firstClassroom = classrooms[0];
  const initialResult = firstClassroom
    ? await getClassroomSeatingForUser(firstClassroom.id, user)
    : null;

  return (
    <SeatingMapView
      classrooms={classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        year: c.year,
        studentCount: c.studentCount,
      }))}
      initialData={initialResult?.status === "ok" ? initialResult.data : null}
    />
  );
}
