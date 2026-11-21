import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentLayout } from "@/features/legal/components/LegalDocumentLayout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Política de Privacidade (LGPD)",
  description:
    "Como o Registro de Classe Online trata e protege dados escolares em conformidade com a Lei nº 13.709/2018 (LGPD).",
};

export default function PrivacidadePage(): React.JSX.Element {
  return (
    <LegalDocumentLayout
      activeSlug="privacidade"
      title="Política de Privacidade e Proteção de Dados (LGPD)"
      subtitle="Transparência sobre quais informações escolares são tratadas no portal, para qual finalidade educacional e como protegemos alunos, famílias e docentes."
      lastUpdated="21 de novembro de 2026"
    >
      {(schoolConfig) => (
        <>
          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              1. Compromisso com a LGPD e proteção de crianças e adolescentes
            </h2>
            <p>
              O tratamento de dados pessoais no Registro de Classe Online (RCO)
              de{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                {schoolConfig.name}
              </strong>{" "}
              observa rigorosamente a{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 —
                LGPD)
              </strong>
              . Por envolver estudantes menores de idade, aplicamos cuidado
              reforçado conforme o{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                Art. 14 da LGPD
              </strong>
              , garantindo que o tratamento ocorra sempre no melhor interesse da
              criança e do adolescente, com transparência junto aos pais ou
              responsáveis legais.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              2. Quais dados são tratados e com qual finalidade
            </h2>
            <p>
              Coletamos e armazenamos apenas as informações estritamente
              necessárias para a prestação dos serviços educacionais e o
              cumprimento de obrigações legais de registro escolar:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Identificação escolar e contato:
                </strong>{" "}
                nome completo, matrícula, turma, e-mail de acesso, vínculo entre
                responsável e estudante e telefone do responsável para contato
                pedagógico.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Vida acadêmica:
                </strong>{" "}
                registros de presença e faltas, justificativas enviadas pela
                família, notas de avaliações, recuperação paralela, tarefas
                entregues, medalhas de mérito e pareceres de conselho.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Acompanhamento pedagógico e comunicação:
                </strong>{" "}
                ocorrências disciplinares ou pedagógicas, confirmações de
                ciência dos avisos, mensagens no canal de atendimento escola ↔
                família e agendamentos de reuniões.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Segurança e rastreabilidade:
                </strong>{" "}
                registros de auditoria das operações administrativas (quem
                executou, quando e qual tipo de ação) para proteção contra uso
                indevido.
              </li>
            </ul>
            <p>
              Nenhum dado escolar é comercializado, alugado ou utilizado para
              fins publicitários.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              3. Medidas técnicas de segurança adotadas no sistema
            </h2>
            <p>
              O portal implementa salvaguardas técnicas ativas para proteger os
              dados contra acesso não autorizado, perda ou alteração indevida:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Criptografia de senhas:
                </strong>{" "}
                as senhas nunca são armazenadas em texto puro; utilizamos hash
                irreversível com algoritmo{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-white/[0.08]">
                  bcrypt
                </code>
                .
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Sessões protegidas:
                </strong>{" "}
                a autenticação utiliza cookie{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-white/[0.08]">
                  HttpOnly
                </code>{" "}
                assinado digitalmente com JWT e expiração automática, impedindo
                leitura por scripts no navegador.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Controle de acesso por perfil (RBAC):
                </strong>{" "}
                cada perfil (Administrador, Coordenação, Professor, Responsável
                e Aluno) visualiza exclusivamente os dados e estudantes aos
                quais possui vínculo autorizado.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Logs de auditoria e backup institucional:
                </strong>{" "}
                ações sensíveis são auditadas e acessíveis apenas à
                administração escolar.
              </li>
              <li>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  Validação pública sem exposição sensível:
                </strong>{" "}
                a consulta de autenticidade de boletins e atas em{" "}
                <Link
                  href="/validar"
                  className="font-medium text-[var(--school-primary)] underline underline-offset-2"
                >
                  /validar
                </Link>{" "}
                confirma apenas os metadados mínimos do documento, sem exibir
                telefones, endereços, ocorrências ou notas detalhadas.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              4. Direitos dos titulares e responsáveis legais
            </h2>
            <p>
              Nos termos da LGPD, estudantes (por meio de seus responsáveis
              legais), pais e servidores têm direito a:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Confirmar a existência de tratamento e consultar os dados
                acadêmicos disponíveis diretamente no portal.
              </li>
              <li>
                Solicitar à secretaria a correção de dados cadastrais
                incompletos, inexatos ou desatualizados (como nome, e-mail ou
                telefone de contato).
              </li>
              <li>
                Obter esclarecimentos sobre guarda legal de documentos
                escolares (histórico, frequência e avaliações que a instituição
                precisa manter por exigência da legislação educacional).
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              5. Canal de atendimento sobre privacidade
            </h2>
            <p>
              Para exercer direitos previstos na LGPD ou solicitar atualizações
              cadastrais, procure a secretaria escolar de{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                {schoolConfig.name}
              </strong>
              {schoolConfig.city
                ? ` (${schoolConfig.city}${
                    schoolConfig.state ? ` - ${schoolConfig.state}` : ""
                  })`
                : ""}
              {schoolConfig.phone
                ? ` ou entre em contato pelo telefone ${schoolConfig.phone}`
                : ""}
              . Para informações sobre cookies e preferências salvas no
              navegador, consulte a{" "}
              <Link
                href="/cookies"
                className="font-medium text-[var(--school-primary)] underline underline-offset-2"
              >
                Política de Cookies
              </Link>
              .
            </p>
          </section>
        </>
      )}
    </LegalDocumentLayout>
  );
}
