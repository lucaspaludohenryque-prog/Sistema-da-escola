import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { listClassroomsForUser } from "@/features/classrooms";
import { listScheduleForUser } from "@/features/schedule/queries";
import { ScheduleView } from "@/features/schedule/components/ScheduleView";

export const metadata: Metadata = {
  title: "Grade de Horários",
  description: "Grade semanal de aulas e acesso rápido à chamada.",
};

export default async function HorariosPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const canManage = isStaffRole(user.role);
  const [slots, classrooms] = await Promise.all([
    listScheduleForUser(user),
    canManage ? listClassroomsForUser(user) : Promise.resolve([]),
  ]);

  return (
    <ScheduleView
      initialSlots={slots}
      classrooms={classrooms}
      canManage={canManage}
    />
  );
}
