import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { DashboardShell } from "@/features/dashboard";
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

  const initialUnacknowledgedCount =
    user.role === "RESPONSAVEL" || user.role === "ALUNO"
      ? await countUnacknowledgedNotifications(user.id)
      : 0;

  return (
    <DashboardShell
      user={user}
      schoolConfig={schoolConfig}
      initialUnacknowledgedCount={initialUnacknowledgedCount}
    >
      {children}
    </DashboardShell>
  );
}
