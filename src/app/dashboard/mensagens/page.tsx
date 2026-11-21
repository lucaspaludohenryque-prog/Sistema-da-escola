import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, getDefaultDashboardPath } from "@/features/auth";
import { MessagesView } from "@/features/messages/components/MessagesView";
import {
  listStudentsForNewThread,
  listThreadsForUser,
} from "@/features/messages/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atendimento & Mensagens",
  description: "Central de chat direto entre equipe escolar e responsáveis.",
};

export default async function MensagensPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "ALUNO") {
    redirect(getDefaultDashboardPath(user.role));
  }

  const [initialThreads, studentOptions] = await Promise.all([
    listThreadsForUser(user),
    listStudentsForNewThread(user),
  ]);

  return (
    <MessagesView
      currentUser={user}
      initialThreads={initialThreads}
      studentOptions={studentOptions}
    />
  );
}
