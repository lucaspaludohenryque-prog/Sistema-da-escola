import type { Metadata } from "next";
import Link from "next/link";
import { SESSION_COOKIE_NAME } from "@/features/auth/constants";
import { LegalDocumentLayout } from "@/features/legal/components/LegalDocumentLayout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Transparência sobre cookies estritamente necessários e preferências salvas localmente no Registro de Classe Online.",
};

export default function CookiesPage(): React.JSX.Element {
  return (
    <LegalDocumentLayout
      activeSlug="cookies"
      title="Política de Cookies e Armazenamento Local"
      subtitle="Explicação direta sobre o que o portal grava no seu navegador para manter sua sessão segura e lembrar suas preferências."
      lastUpdated="21 de novembro de 2026"
    >
      {(schoolConfig) => (
        <>
          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              1. Sem anúncios e sem rastreamento comercial
            </h2>
            <p>
              O portal escolar de{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                {schoolConfig.name}
              </strong>{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                não utiliza cookies de publicidade, pixels de redes sociais,
                venda de dados ou rastreamento de terceiros
              </strong>
              . Utilizamos exclusivamente o mínimo técnico indispensável para
              autenticação segura e conforto visual na navegação.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              2. O que o sistema realmente armazena no seu navegador
            </h2>

            <div className="overflow-x-auto rounded-lg border border-zinc-200/90 dark:border-white/[0.08]">
              <table className="w-full min-w-[540px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50 text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400">
                    <th className="px-4 py-2.5">Mecanismo</th>
                    <th className="px-4 py-2.5">Categoria</th>
                    <th className="px-4 py-2.5">Finalidade real</th>
                    <th className="px-4 py-2.5">Retenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
                  <tr>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Cookie de Sessão
                      </p>
                      <code className="mt-0.5 inline-block font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {SESSION_COOKIE_NAME}
                      </code>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex rounded-md border border-zinc-200/90 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200">
                        Estritamente necessário (HTTP-only)
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-300">
                      Mantém o usuário autenticado com segurança por meio de
                      token JWT assinado. Não pode ser lido por scripts no
                      navegador.
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-600 tabular-nums dark:text-zinc-400">
                      Até 8 horas ou até clicar em Sair
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Armazenamento Local
                      </p>
                      <code className="mt-0.5 inline-block font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        localStorage
                      </code>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex rounded-md border border-zinc-200/90 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200">
                        Preferências locais
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-300">
                      Salva no próprio aparelho a escolha de Modo Claro/Escuro (
                      <code className="font-mono text-[11px]">rco-theme</code>),
                      estado recolhido da barra lateral (
                      <code className="font-mono text-[11px]">
                        rco-sidebar-collapsed
                      </code>
                      ), progresso do checklist do tutorial (
                      <code className="font-mono text-[11px]">
                        rco_help_checklist_*
                      </code>
                      ) e ciência do aviso de cookies (
                      <code className="font-mono text-[11px]">
                        rco_cookie_consent
                      </code>
                      ).
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-400">
                      Permanece no navegador até você limpar os dados do site
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
              3. Como gerenciar ou apagar estes dados
            </h2>
            <p>
              Você pode apagar cookies e dados locais a qualquer momento nas
              configurações do seu navegador (Chrome, Edge, Safari ou Firefox).
              Ao limpar o cookie de sessão{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-white/[0.08]">
                {SESSION_COOKIE_NAME}
              </code>
              , sua conta será desconectada e bastará entrar novamente com seu
              e-mail e senha. Ao limpar o armazenamento local, o tema e o
              checklist do tutorial voltam ao padrão inicial.
            </p>
            <p>
              Para saber mais sobre proteção de dados escolares, acesse a{" "}
              <Link
                href="/privacidade"
                className="font-medium text-[var(--school-primary)] underline underline-offset-2"
              >
                Política de Privacidade (LGPD)
              </Link>{" "}
              ou os{" "}
              <Link
                href="/termos"
                className="font-medium text-[var(--school-primary)] underline underline-offset-2"
              >
                Termos de Uso
              </Link>
              .
            </p>
          </section>
        </>
      )}
    </LegalDocumentLayout>
  );
}
