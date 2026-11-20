import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { ModulePlaceholder } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Notas",
};

export default function NotasPage(): React.JSX.Element {
  return (
    <ModulePlaceholder
      title="Notas"
      description="Gerencie avaliações, pesos, recuperação paralela e consolidação de médias bimestrais e anuais por turma."
      icon={GraduationCap}
      plannedCapabilities={[
        "Cadastro de instrumentos avaliativos por bimestre e peso",
        "Digitação ágil em grade com validação de intervalo de notas",
        "Cálculo automático de médias parciais, recuperação e média final",
        "Fechamento de período e geração de boletim consolidado",
      ]}
    />
  );
}
