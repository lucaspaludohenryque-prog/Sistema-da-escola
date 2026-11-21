import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { listManagedUsers } from "@/features/users";
import { UsersView } from "@/features/users/components/UsersView";

export const metadata: Metadata = {
  title: "Usuários",
  description: "Gestão de contas, perfis de acesso e redefinição de senhas.",
};

export default async function UsuariosPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await listManagedUsers();

  return <UsersView initialUsers={users} currentUserId={user.id} />;
}
