import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { canManageClassrooms, listClassroomsForUser } from "@/features/classrooms";
import { listAnnouncementsForUser } from "@/features/announcements/queries";
import { AnnouncementsView } from "@/features/announcements/components/AnnouncementsView";

export const metadata: Metadata = {
  title: "Mural de Comunicados",
  description: "Comunicados oficiais da escola e avisos por turma.",
};

export default async function ComunicadosPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const canCreate = isStaffRole(user.role);
  const canCreateGlobal = canManageClassrooms(user.role);

  const [announcements, classrooms] = await Promise.all([
    listAnnouncementsForUser(user),
    canCreate ? listClassroomsForUser(user) : Promise.resolve([]),
  ]);

  return (
    <AnnouncementsView
      initialAnnouncements={announcements}
      classrooms={classrooms}
      canCreate={canCreate}
      canCreateGlobal={canCreateGlobal}
    />
  );
}
