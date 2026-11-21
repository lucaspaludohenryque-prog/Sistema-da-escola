import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentLayout } from "@/features/legal/components/LegalDocumentLayout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de uso, responsabilidades por perfil e autenticidade digital no Registro de Classe Online.",
};

export default function TermosPage(): React.JSX.Element {
  return (
    <LegalDocumentLayout
      activeSlug="termos"
      title="Termos de Uso do Portal"
      subtitle="Regras de acesso, conduta e utilização do Registro de Classe Online (RCO) por docentes, gestão escolar, responsáveis legais e estudantes."
      lastUpdated="21 de novembro de 2026"
    >
      {(schoolConfig) => (
        <>
          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              1. Finalidade do portal
            </h2>
            <p>
              O Registro de Classe Online (RCO) de{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                {schoolConfig.name}
              </strong>{" "}
              é um ambiente institucional destinado exclusivamente à gestão
              acadêmica e pedagógica do ano letivo. O portal centraliza o
              registro diário de frequência, o lançamento de avaliações e
              médias, o acompanhamento de ocorrências, o planejamento de aulas,
              a comunicação oficial entre escola e família e a emissão de
              documentos escolares com conferência digital.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              2. Acesso e responsabilidades por perfil
            </h2>
            <p>
              As credenciais de acesso (e-mail e senha) são individuais,
              intransferíveis e fornecidas pela administração escolar. Ao
              utilizar o sistema, cada usuário compromete-se a:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Sigilo da senha pessoal:
                </strong>{" "}
                manter a senha em segredo, encerrar a sessão em dispositivos
                compartilhados e comunicar imediatamente a secretaria em caso de
                suspeita de acesso indevido.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Docentes, Coordenação e Administração:
                </strong>{" "}
                registrar informações verdadeiras, objetivas e respeitosas em
                ocorrências, pareceres de conselho, comunicados e mensagens de
                atendimento, observando o regimento escolar e a ética
                profissional.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Pais e Responsáveis:
                </strong>{" "}
                acompanhar o desempenho e os avisos escolares de forma
                colaborativa, utilizando os canais de justificativa, atendimento
                e reuniões exclusivamente para assuntos pedagógicos e
                administrativos ligados aos estudantes vinculados.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Estudantes:
                </strong>{" "}
                acessar o portal em modo de consulta e entrega de tarefas, sem
                permissão para alterar registros oficiais de frequência, notas
                ou ocorrências.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              3. Autenticidade de documentos digitais
            </h2>
            <p>
              Boletins individuais (Ficha do Aluno) e Atas de Conselho de Classe
              emitidos pelo portal contêm um código identificador único e um QR
              Code impresso. Qualquer interessado pode conferir se o documento
              foi legitimamente emitido pela instituição na página pública{" "}
              <Link
                href="/validar"
                className="font-medium text-[var(--school-primary)] underline underline-offset-2"
              >
                Validar documento (/validar)
              </Link>
              , sem exposição de dados privados de contato.
            </p>
            <p>
              A adulteração de documentos impressos ou digitais, bem como a
              reprodução indevida de códigos de validação, sujeita o infrator às
              medidas administrativas e legais cabíveis.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              4. Uso adequado e proibição de compartilhamento indevido
            </h2>
            <p>
              É expressamente proibido capturar, copiar, divulgar em redes
              sociais ou repassar a terceiros não autorizados informações
              escolares de outros alunos, servidores ou famílias exibidas no
              portal. Todo dado consultado deve respeitar a privacidade da
              comunidade escolar e a legislação de proteção de dados vigente.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              5. Disponibilidade e auditoria de registros
            </h2>
            <p>
              A escola busca manter o portal disponível de forma contínua,
              podendo realizar janelas de manutenção preventiva e atualizações
              técnicas quando necessário. Ações administrativas relevantes —
              como gestão de contas, fechamento de trimestres, alteração de
              configurações, exportação de backups e análise de justificativas —
              são registradas em trilha de auditoria para segurança e
              rastreabilidade institucional.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              6. Dúvidas e suporte da instituição
            </h2>
            <p>
              Dúvidas sobre acesso, atualização cadastral ou regras de uso devem
              ser encaminhadas diretamente à secretaria escolar de{" "}
              {schoolConfig.name}
              {schoolConfig.phone
                ? `, pelo telefone ${schoolConfig.phone}`
                : ""}
              . Para detalhes sobre como os dados pessoais são tratados,
              consulte a{" "}
              <Link
                href="/privacidade"
                className="font-medium text-[var(--school-primary)] underline underline-offset-2"
              >
                Política de Privacidade (LGPD)
              </Link>
              .
            </p>
          </section>
        </>
      )}
    </LegalDocumentLayout>
  );
}
