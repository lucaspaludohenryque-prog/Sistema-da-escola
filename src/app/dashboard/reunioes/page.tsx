import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, getDefaultDashboardPath, isStaffRole } from "@/features/auth";
import { MeetingsView } from "@/features/meetings/components/MeetingsView";
import { listMeetingsForUser } from "@/features/meetings/queries";
import { listStudentsForNewThread } from "@/features/messages/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reuniões Pedagógicas",
  description: "Agendamento e confirmação de reuniões entre escola e responsáveis.",
};

export default async function ReunioesPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "ALUNO") {
    redirect(getDefaultDashboardPath(user.role));
  }

  const [initialMeetings, studentOptions] = await Promise.all([
    listMeetingsForUser(user),
    isStaffRole(user.role) ? listStudentsForNewThread(user) : Promise.resolve([]),
  ]);

  return (
    <MeetingsView
      userRole={user.role}
      initialMeetings={initialMeetings}
      studentOptions={studentOptions}
    />
  );
}
