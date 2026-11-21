import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, listClassroomsForUser } from "@/features/classrooms";
import {
  getCurrentYearMonth,
  listSchoolEventsForUser,
} from "@/features/calendar/queries";
import { CalendarView } from "@/features/calendar/components/CalendarView";

export const metadata: Metadata = {
  title: "Calendário Escolar",
  description: "Calendário mensal de provas, trabalhos, feriados, reuniões e eventos.",
};

export default async function CalendarioPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const initialMonth = getCurrentYearMonth();
  const canCreate = isStaffRole(user.role);
  const canCreateGlobal = canManageClassrooms(user.role);

  const [events, classrooms] = await Promise.all([
    listSchoolEventsForUser(user, initialMonth),
    canCreate ? listClassroomsForUser(user) : Promise.resolve([]),
  ]);

  return (
    <CalendarView
      initialMonth={initialMonth}
      initialEvents={events}
      classrooms={classrooms}
      canCreate={canCreate}
      canCreateGlobal={canCreateGlobal}
    />
  );
}
