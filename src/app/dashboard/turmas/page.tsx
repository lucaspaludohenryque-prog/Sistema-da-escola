import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Turmas",
};

export default function TurmasPage(): React.JSX.Element {
  return (
    <ModulePlaceholder
      title="Turmas"
      description="Centralize o cadastro de turmas, grade de disciplinas, vínculo de professores e listagem de estudantes matriculados por ano letivo."
      icon={Users}
      plannedCapabilities={[
        "Listagem de turmas por turno, série e ano letivo",
        "Enturmação de estudantes e controle de transferências",
        "Associação de professores e componentes curriculares",
        "Consulta rápida da ficha resumida da turma",
      ]}
    />
  );
}
