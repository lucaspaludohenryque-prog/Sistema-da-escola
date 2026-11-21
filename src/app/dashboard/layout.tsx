import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { DashboardShell } from "@/features/dashboard";
import { countPendingJustifications } from "@/features/justifications/queries";
import { countUnreadThreadsForUser } from "@/features/messages/queries";
import { countUnacknowledgedNotifications } from "@/features/notifications";
import { getSchoolConfig } from "@/features/school-config";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const [user, schoolConfig] = await Promise.all([
    getAuthenticatedUser(),
    getSchoolConfig(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const [
    initialUnacknowledgedCount,
    initialPendingJustificationsCount,
    initialUnreadMessagesCount,
  ] = await Promise.all([
    user.role === "RESPONSAVEL" || user.role === "ALUNO"
      ? countUnacknowledgedNotifications(user.id)
      : Promise.resolve(0),
    canManageClassrooms(user.role)
      ? countPendingJustifications()
      : Promise.resolve(0),
    user.role !== "ALUNO" ? countUnreadThreadsForUser(user) : Promise.resolve(0),
  ]);

  return (
    <DashboardShell
      user={user}
      schoolConfig={schoolConfig}
      initialUnacknowledgedCount={initialUnacknowledgedCount}
      initialPendingJustificationsCount={initialPendingJustificationsCount}
      initialUnreadMessagesCount={initialUnreadMessagesCount}
    >
      {children}
    </DashboardShell>
  );
}
