import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { DashboardShell } from "@/features/dashboard";
import { getSchoolConfig } from "@/features/school-config";

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

  return (
    <DashboardShell user={user} schoolConfig={schoolConfig}>
      {children}
    </DashboardShell>
  );
}
