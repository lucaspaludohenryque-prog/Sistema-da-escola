import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { ModulePlaceholder } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Chamada",
};

export default function ChamadaPage(): React.JSX.Element {
  return (
    <ModulePlaceholder
      title="Chamada"
      description="Registre a frequência diária por aula e disciplina com salvamento seguro, histórico por data e justificativa de faltas."
      icon={ClipboardCheck}
      plannedCapabilities={[
        "Lançamento rápido de presença, falta e falta justificada",
        "Registro do conteúdo ministrado vinculado à aula do dia",
        "Cálculo automático de percentual de frequência por estudante",
        "Alertas para coordenação em casos de faltas consecutivas",
      ]}
    />
  );
}
