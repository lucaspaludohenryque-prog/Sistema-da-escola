import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { canManageClassrooms } from "@/features/classrooms";
import { listJustificationsForUser } from "@/features/justifications/queries";
import { JustificationsAdminView } from "@/features/justifications/components/JustificationsAdminView";

export const metadata: Metadata = {
  title: "Justificativas de Falta",
  description: "Aprovação de justificativas de falta enviadas pelos responsáveis.",
};

export default async function JustificativasPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (!canManageClassrooms(user.role)) {
    redirect("/dashboard");
  }

  const { justifications, pendingCount } = await listJustificationsForUser(user);

  return (
    <JustificationsAdminView
      initialJustifications={justifications}
      initialPendingCount={pendingCount}
    />
  );
}
