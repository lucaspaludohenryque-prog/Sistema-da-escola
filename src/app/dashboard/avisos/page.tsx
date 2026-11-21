import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, getDefaultDashboardPath } from "@/features/auth";
import { listNotificationsForUser } from "@/features/notifications";
import { NotificationsView } from "@/features/notifications/components/NotificationsView";

export const metadata: Metadata = {
  title: "Avisos",
  description: "Central de notificações escolares de faltas e ocorrências.",
};

export default async function AvisosPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "RESPONSAVEL" && user.role !== "ALUNO") {
    redirect(getDefaultDashboardPath(user.role));
  }

  const data = await listNotificationsForUser(user.id);

  return (
    <NotificationsView
      initialNotifications={data.notifications}
      initialUnacknowledgedCount={data.unacknowledgedCount}
    />
  );
}
