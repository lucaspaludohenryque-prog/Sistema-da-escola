import type { Metadata } from "next";
import { FileWarning } from "lucide-react";
import { ModulePlaceholder } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Ocorrências",
};

export default function OcorrenciasPage(): React.JSX.Element {
  return (
    <ModulePlaceholder
      title="Ocorrências"
      description="Documente registros disciplinares e acompanhamentos pedagógicos com trilha de auditoria entre professores e coordenação."
      icon={FileWarning}
      plannedCapabilities={[
        "Abertura de ocorrência por estudante, turma e categoria",
        "Registro de encaminhamentos e devolutivas da coordenação",
        "Histórico cronológico por aluno com filtros por período",
        "Emissão de relatório resumido para reuniões pedagógicas",
      ]}
    />
  );
}
