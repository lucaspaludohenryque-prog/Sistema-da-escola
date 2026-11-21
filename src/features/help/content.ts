import type { UserRole } from "@/features/auth/types";
import type {
  HelpAudienceDefinition,
  HelpAudienceId,
  HelpFaqItem,
  HelpGuideModule,
  HelpShortcutItem,
} from "./types";

const STAFF_ROLES: readonly UserRole[] = ["ADMIN", "COORDENACAO", "PROFESSOR"];
const MANAGER_ROLES: readonly UserRole[] = ["ADMIN", "COORDENACAO"];
const ADMIN_ONLY: readonly UserRole[] = ["ADMIN"];
const GUARDIAN_ONLY: readonly UserRole[] = ["RESPONSAVEL"];
const STUDENT_ONLY: readonly UserRole[] = ["ALUNO"];
const GUARDIAN_OR_STUDENT: readonly UserRole[] = ["RESPONSAVEL", "ALUNO"];
const NO_STUDENT: readonly UserRole[] = [
  "ADMIN",
  "COORDENACAO",
  "PROFESSOR",
  "RESPONSAVEL",
];

export const HELP_AUDIENCES: Record<HelpAudienceId, HelpAudienceDefinition> = {
  PROFESSOR: {
    id: "PROFESSOR",
    tabLabel: "Guia do Professor",
    shortLabel: "Professor",
    heading: "Rotina docente passo a passo",
    description:
      "Tudo o que o professor usa no dia a dia: chamada, mapa de sala, notas, ocorrências, tarefas e comunicação com as famílias.",
    checklist: [
      {
        id: "prof-turmas",
        label: "Conferir suas turmas e lista de estudantes",
        description: "Verifique a composição das turmas e a ficha individual.",
        href: "/dashboard/turmas",
        allowedRoles: STAFF_ROLES,
      },
      {
        id: "prof-mapa",
        label: "Montar o Mapa de Sala da turma",
        description: "Distribua automaticamente os alunos e ajuste as carteiras.",
        href: "/dashboard/mapa-sala",
        allowedRoles: STAFF_ROLES,
      },
      {
        id: "prof-chamada",
        label: "Fazer sua primeira chamada e diário de conteúdo",
        description: "Marque P, F ou FJ e registre o conteúdo ministrado no dia.",
        href: "/dashboard/chamada",
        allowedRoles: STAFF_ROLES,
      },
      {
        id: "prof-notas",
        label: "Criar uma avaliação em Notas",
        description: "Defina peso, trimestre e lance as notas da turma.",
        href: "/dashboard/notas",
        allowedRoles: STAFF_ROLES,
      },
      {
        id: "prof-busca",
        label: "Testar a busca rápida Ctrl + K",
        description: "Encontre qualquer aluno, turma ou ocorrência sem usar o menu.",
        triggerCommandPalette: true,
      },
    ],
  },
  GESTAO: {
    id: "GESTAO",
    tabLabel: "Gestão & Secretaria",
    shortLabel: "Gestão",
    heading: "Administração, secretaria e governança",
    description:
      "Configuração da escola, contas de usuários, importação CSV, vínculos de família, fechamento trimestral e conformidade LGPD.",
    checklist: [
      {
        id: "gestao-config",
        label: "Revisar identidade da escola (logo, cor e ano letivo)",
        description: "Confirme nome oficial, brasão, telefone e cor institucional.",
        href: "/dashboard/configuracoes",
        allowedRoles: ADMIN_ONLY,
      },
      {
        id: "gestao-usuarios",
        label: "Conferir usuários e perfis cadastrados",
        description: "Cadastre docentes, coordenação, responsáveis e alunos.",
        href: "/dashboard/usuarios",
        allowedRoles: ADMIN_ONLY,
      },
      {
        id: "gestao-turmas",
        label: "Verificar turmas e telefones de WhatsApp",
        description: "Importe alunos via CSV e mantenha os contatos atualizados.",
        href: "/dashboard/turmas",
        allowedRoles: STAFF_ROLES,
      },
      {
        id: "gestao-vinculos",
        label: "Revisar vínculos Família ↔ Aluno",
        description: "Garanta que cada responsável esteja ligado aos filhos corretos.",
        href: "/dashboard/familia-vinculos",
        allowedRoles: MANAGER_ROLES,
      },
      {
        id: "gestao-auditoria",
        label: "Conhecer a Auditoria LGPD e o Backup JSON",
        description: "Consulte o histórico de ações e baixe uma cópia de segurança.",
        href: "/dashboard/auditoria",
        allowedRoles: ADMIN_ONLY,
      },
    ],
  },
  FAMILIA: {
    id: "FAMILIA",
    tabLabel: "Guia da Família",
    shortLabel: "Família",
    heading: "Acompanhamento escolar simplificado",
    description:
      "Como acompanhar boletins, confirmar leitura de avisos, justificar faltas, conversar com a escola e instalar o portal no celular.",
    checklist: [
      {
        id: "fam-painel",
        label: "Explorar o Painel da Família",
        description: "Veja frequência, médias trimestrais e medalhas dos seus filhos.",
        href: "/dashboard/familia",
        allowedRoles: GUARDIAN_ONLY,
      },
      {
        id: "fam-avisos",
        label: "Ler os Avisos e confirmar ciência",
        description: "Toque em 'Li e estou ciente' nos comunicados de falta ou ocorrência.",
        href: "/dashboard/avisos",
        allowedRoles: GUARDIAN_OR_STUDENT,
      },
      {
        id: "fam-calendario",
        label: "Consultar o Calendário de provas e entregas",
        description: "Acompanhe datas de avaliações, reuniões e feriados escolares.",
        href: "/dashboard/calendario",
      },
      {
        id: "fam-atendimento",
        label: "Conhecer o canal de Atendimento",
        description: "Envie mensagens direto para a coordenação ou professores.",
        href: "/dashboard/mensagens",
        allowedRoles: NO_STUDENT,
      },
      {
        id: "fam-pwa",
        label: "Salvar o portal na tela inicial do celular",
        description: "Use o portal como aplicativo sem precisar baixar na loja.",
      },
    ],
  },
  ALUNO: {
    id: "ALUNO",
    tabLabel: "Guia do Estudante",
    shortLabel: "Estudante",
    heading: "Seu dia a dia escolar organizado",
    description:
      "Consulte notas, frequência, medalhas, horários das aulas, datas de provas e entregas de tarefas em um só lugar.",
    checklist: [
      {
        id: "alu-painel",
        label: "Conferir boletim e frequência no Meu Painel",
        description: "Acompanhe suas médias por trimestre e suas medalhas de mérito.",
        href: "/dashboard/aluno",
        allowedRoles: STUDENT_ONLY,
      },
      {
        id: "alu-horarios",
        label: "Consultar a Grade de Horários da turma",
        description: "Veja as aulas da semana, horários e salas.",
        href: "/dashboard/horarios",
      },
      {
        id: "alu-calendario",
        label: "Checar provas e eventos no Calendário",
        description: "Organize seus estudos com antecedência.",
        href: "/dashboard/calendario",
      },
      {
        id: "alu-tarefas",
        label: "Abrir Tarefas & Materiais de aula",
        description: "Acesse links de estudo e marque suas atividades concluídas.",
        href: "/dashboard/tarefas",
      },
      {
        id: "alu-comunicados",
        label: "Ler o Mural de Comunicados",
        description: "Fique por dentro dos recados oficiais da escola e da turma.",
        href: "/dashboard/comunicados",
      },
    ],
  },
};

export const HELP_GUIDE_MODULES: readonly HelpGuideModule[] = [
  // =========================================================================
  // ABA 1 — GUIA DO PROFESSOR (10 MODULOS)
  // =========================================================================
  {
    id: "prof-inicio",
    index: "01",
    audience: "PROFESSOR",
    title: "Início, Busca Rápida (Ctrl + K), Modo Escuro e App no Celular (PWA)",
    summary:
      "Navegação ágil no painel inicial, atalho de pesquisa global, conforto visual e instalação como aplicativo.",
    keywords: [
      "inicio",
      "ctrl k",
      "busca",
      "modo escuro",
      "dark mode",
      "pwa",
      "celular",
      "atalho",
    ],
    steps: [
      "Na tela Início, acompanhe os indicadores gerais de turmas, frequência média e alertas recentes.",
      "Pressione Ctrl + K (ou Cmd + K no Mac) em qualquer página para abrir a Busca Rápida e localizar alunos, matrículas, turmas ou ocorrências em segundos.",
      "Use o ícone de sol/lua no topo direito para alternar entre Modo Claro e Modo Escuro; a escolha fica salva automaticamente no aparelho.",
      "No celular, toque no banner de instalação ou em 'Adicionar à tela inicial' no navegador para usar o RCO em tela cheia como aplicativo (PWA).",
    ],
    tip: "Você pode recolher a barra lateral no topo esquerdo do menu para ganhar mais espaço horizontal ao trabalhar em tabelas de notas e chamadas.",
    links: [
      { label: "Abrir Início", href: "/dashboard", allowedRoles: STAFF_ROLES },
    ],
  },
  {
    id: "prof-chamada",
    index: "02",
    audience: "PROFESSOR",
    title: "Fazer Chamada e Diário de Conteúdo",
    summary:
      "Registro diário de presença (P/F/FJ), histórico editável, alerta automático abaixo de 75% e aviso imediato à família.",
    keywords: [
      "chamada",
      "frequencia",
      "falta",
      "diario",
      "conteudo",
      "75%",
      "aviso",
      "fj",
      "presenca",
    ],
    steps: [
      "Acesse Chamada, selecione a turma, a data e o número da aula (1ª, 2ª, etc.).",
      "Todos os alunos iniciam marcados como Presente (P); clique em F (Falta) ou FJ (Falta Justificada) apenas nos casos necessários.",
      "Preencha o campo de Conteúdo Ministrado no diário e clique em Salvar Chamada.",
      "Ao salvar uma falta (F), o sistema dispara automaticamente um aviso no Portal da Família do responsável vinculado e sinaliza alunos com frequência abaixo de 75%.",
      "Para corrigir uma chamada anterior, role até o Histórico de Aulas da turma, abra o dia desejado, ajuste e salve novamente.",
    ],
    tip: "Para agilizar aulas geminadas, clique primeiro na sua Grade de Horários: o botão de chamada já abre a turma e o número da aula pré-selecionados.",
    links: [
      { label: "Abrir Chamada", href: "/dashboard/chamada", allowedRoles: STAFF_ROLES },
    ],
  },
  {
    id: "prof-mapa-sala",
    index: "03",
    audience: "PROFESSOR",
    title: "Mapa de Sala e Chamada Visual",
    summary:
      "Organize o espelho de classe por fileiras e colunas, troque alunos de carteira e faça chamada clicando nos assentos.",
    keywords: [
      "mapa de sala",
      "espelho",
      "carteira",
      "chamada visual",
      "assento",
      "fileira",
    ],
    steps: [
      "Abra Mapa de Sala e selecione a turma desejada.",
      "Clique em 'Distribuir automaticamente' para preencher rapidamente as carteiras em ordem alfabética, ou ajuste o número de fileiras e colunas da sala.",
      "Para trocar dois alunos de lugar (ou mover para uma carteira vazia), clique no primeiro assento e em seguida clique no assento de destino.",
      "Salve o layout e, quando quiser registrar frequência visualmente, alterne para o modo 'Chamada Visual': clique diretamente sobre a carteira de cada aluno para alternar entre P, F e FJ.",
    ],
    tip: "O indicador discreto no canto da carteira ajuda a identificar rapidamente estudantes que exigem acompanhamento próximo na sala.",
    links: [
      { label: "Abrir Mapa de Sala", href: "/dashboard/mapa-sala", allowedRoles: STAFF_ROLES },
    ],
  },
  {
    id: "prof-ocorrencias",
    index: "04",
    audience: "PROFESSOR",
    title: "Registrar Ocorrências, Encaminhamentos e WhatsApp",
    summary:
      "Registre ocorrências pedagógicas, disciplinares ou elogios, acompanhe a ciência da família e contate via WhatsApp.",
    keywords: [
      "ocorrencias",
      "disciplinar",
      "elogio",
      "whatsapp",
      "ciente",
      "encaminhamento",
      "gravidade",
    ],
    steps: [
      "Em Ocorrências, clique em 'Nova ocorrência', selecione a turma, o estudante, a categoria e a gravidade (Leve, Moderada ou Grave).",
      "Descreva o fato de forma objetiva e pedagógica; ao salvar, o responsável vinculado recebe notificação automática no portal.",
      "Acompanhe o selo verde 'Responsável ciente' (com data e hora) assim que a família confirmar a leitura.",
      "Se precisar reforçar o contato com rapidez, clique no botão de WhatsApp do registro para abrir uma mensagem pronta com o telefone cadastrado do responsável.",
      "Quando o encaminhamento for concluído, clique em 'Resolver' e registre a providência tomada.",
    ],
    tip: "Ocorrências de categoria positiva (elogio ou reconhecimento) também chegam aos responsáveis e fortalecem o vínculo com a família.",
    links: [
      { label: "Abrir Ocorrências", href: "/dashboard/ocorrencias", allowedRoles: STAFF_ROLES },
    ],
  },
  {
    id: "prof-notas",
    index: "05",
    audience: "PROFESSOR",
    title: "Lançar Notas, Pesos e Recuperação Paralela",
    summary:
      "Crie avaliações trimestrais com pesos, lance notas em grade compacta e aplique recuperação paralela automática.",
    keywords: [
      "notas",
      "avaliacao",
      "peso",
      "recuperacao",
      "media",
      "trimestre",
      "trancado",
      "boletim",
    ],
    steps: [
      "Abra Notas, selecione a turma e o trimestre (1º, 2º ou 3º) ou consulte o Resumo Anual.",
      "Clique em 'Nova avaliação' para criar provas, trabalhos ou atividades informando o título, nota máxima e peso.",
      "Digite as notas diretamente na coluna da avaliação (os campos alinham os números automaticamente) e clique em Salvar notas.",
      "Para alunos com média abaixo do esperado, lance a nota de Recuperação Paralela: se ela for maior que a média do trimestre, o sistema substitui automaticamente pela maior nota.",
      "Caso apareça o aviso de trimestre trancado, o período já foi fechado pela coordenação/direção e fica em modo somente leitura.",
    ],
    tip: "Confira a aba 'Resumo Anual' antes do Conselho de Classe para visualizar a média dos 3 trimestres lado a lado.",
    links: [
      { label: "Abrir Notas", href: "/dashboard/notas", allowedRoles: STAFF_ROLES },
    ],
  },
  {
    id: "prof-horarios",
    index: "06",
    audience: "PROFESSOR",
    title: "Grade de Horários e Atalho para Chamada",
    summary:
      "Organize as aulas semanais por turno e abra a chamada diretamente a partir do horário do dia.",
    keywords: ["horarios", "grade", "aula", "turno", "atalho", "semana"],
    steps: [
      "Acesse Horários e filtre pela turma ou visualize sua grade semanal completa.",
      "Cadastre cada aula informando dia da semana, número da aula, horário de início/término e sala.",
      "No dia da aula, clique no atalho de chamada diretamente no cartão do horário para abrir a tela de Chamada já posicionada na turma e aula certas.",
    ],
    tip: "Manter a grade atualizada ajuda também alunos e pais, que visualizam os horários diretamente nos seus portais.",
    links: [
      { label: "Abrir Horários", href: "/dashboard/horarios" },
    ],
  },
  {
    id: "prof-planejamento-conselho",
    index: "07",
    audience: "PROFESSOR",
    title: "Planejamento de Aulas e Conselho de Classe",
    summary:
      "Controle os tópicos do plano de ensino por trimestre e emita a Ata oficial do Conselho em PDF com QR Code.",
    keywords: [
      "planejamento",
      "plano de ensino",
      "conselho",
      "ata",
      "pdf",
      "qr code",
      "imprimir",
    ],
    steps: [
      "Em Planejamento, selecione a turma e o trimestre para cadastrar os tópicos previstos e marcar os já ministrados com barra de progresso.",
      "Ao final do período, abra Conselho de Classe e selecione a turma e o trimestre para ver automaticamente a lista consolidada de médias, frequência e alertas.",
      "Preencha a síntese pedagógica e os encaminhamentos do conselho e salve o registro.",
      "Clique em 'Imprimir Ata (PDF)' para gerar o documento oficial A4 com brasão, campos de assinatura e QR Code verificável.",
    ],
    tip: "Mesmo usando o Modo Escuro na tela, ao clicar em imprimir o sistema força automaticamente fundo branco e texto escuro para economizar tinta.",
    links: [
      { label: "Abrir Planejamento", href: "/dashboard/planejamento", allowedRoles: STAFF_ROLES },
      { label: "Abrir Conselho", href: "/dashboard/conselho", allowedRoles: STAFF_ROLES },
    ],
  },
  {
    id: "prof-tarefas",
    index: "08",
    audience: "PROFESSOR",
    title: "Tarefas e Materiais de Aula",
    summary:
      "Publique tarefas, trabalhos e materiais com links de apoio, integre ao calendário e acompanhe entregas da turma.",
    keywords: [
      "tarefas",
      "materiais",
      "dever",
      "trabalho",
      "entregas",
      "link",
      "calendario",
    ],
    steps: [
      "Acesse Tarefas & Materiais, escolha a turma e clique em 'Nova tarefa / material'.",
      "Informe título, descrição, tipo (Tarefa, Trabalho ou Material de Estudo), data de entrega e, se desejar, um link externo de apoio.",
      "Ao salvar com data de entrega, a atividade aparece automaticamente no Calendário Escolar dos alunos e responsáveis.",
      "Clique em 'Ver entregas' para conferir quem marcou como concluído ou registrar o status de entrega por aluno.",
    ],
    tip: "Use o tipo 'Material de Estudo' para disponibilizar roteiros de prova e listas de revisão sem exigir prazo de entrega.",
    links: [
      { label: "Abrir Tarefas & Materiais", href: "/dashboard/tarefas" },
    ],
  },
  {
    id: "prof-radar-merito",
    index: "09",
    audience: "PROFESSOR",
    title: "Radar Pedagógico e Medalhas de Mérito",
    summary:
      "Monitore o índice de risco pedagógico (0–100) para intervenção precoce e reconheça avanços com medalhas.",
    keywords: [
      "radar",
      "risco",
      "evasao",
      "merito",
      "medalhas",
      "reconhecimento",
      "score",
    ],
    steps: [
      "No Radar Pedagógico, filtre por turma ou nível de atenção para visualizar o score determinístico de 0 a 100 calculado a partir de faltas, notas baixas e ocorrências.",
      "Leia os fatores detalhados de cada estudante e siga a recomendação pedagógica ou abra diretamente a Ficha do Aluno.",
      "Em Mérito & Medalhas, confira as sugestões automáticas de destaque (frequência exemplar, evolução acadêmica, colaboração) ou conceda uma medalha manualmente.",
      "Toda medalha concedida aparece no painel do estudante e envia uma notificação positiva ao responsável.",
    ],
    tip: "Combinar o acompanhamento do Radar com medalhas de evolução ajuda a engajar famílias que normalmente só recebiam contatos em situações de alerta.",
    links: [
      { label: "Abrir Radar", href: "/dashboard/radar", allowedRoles: STAFF_ROLES },
      { label: "Abrir Mérito", href: "/dashboard/merito", allowedRoles: STAFF_ROLES },
    ],
  },
  {
    id: "prof-comunicacao",
    index: "10",
    audience: "PROFESSOR",
    title: "Comunicados, Mensagens (Atendimento) e Reuniões",
    summary:
      "Divulgue comunicados oficiais, converse com pais sem expor WhatsApp pessoal e agende reuniões pedagógicas.",
    keywords: [
      "comunicados",
      "mensagens",
      "atendimento",
      "chat",
      "reunioes",
      "pais",
      "whatsapp",
    ],
    steps: [
      "Use o Mural de Comunicados para publicar avisos gerais da escola ou direcionados a uma turma específica, marcando prioridade quando for urgente.",
      "Em Atendimento (Mensagens), abra ou responda conversas vinculadas a um estudante específico, mantendo todo o histórico oficial registrado no portal sem precisar compartilhar telefone pessoal.",
      "Em Reuniões, agende encontros presenciais ou online com os responsáveis, informando data, horário, local/link e pauta; o portal mostra em tempo real quando a família confirma presença.",
    ],
    tip: "Ao encerrar um atendimento resolvido em Mensagens, marque a conversa como 'Resolvida' para manter sua caixa de entrada limpa.",
    links: [
      { label: "Comunicados", href: "/dashboard/comunicados" },
      { label: "Atendimento", href: "/dashboard/mensagens", allowedRoles: NO_STUDENT },
      { label: "Reuniões", href: "/dashboard/reunioes", allowedRoles: NO_STUDENT },
    ],
  },

  // =========================================================================
  // ABA 2 — GUIA DA GESTAO & SECRETARIA (7 MODULOS)
  // =========================================================================
  {
    id: "gestao-identidade",
    index: "01",
    audience: "GESTAO",
    title: "Identidade da Escola (Logo, Nome, Ano Letivo e Cor Principal)",
    summary:
      "Personalize o brasão, nome oficial, cidade/UF, telefone, ano letivo e cor institucional em todo o portal e nos PDFs.",
    keywords: [
      "configuracoes",
      "logo",
      "brasao",
      "cor",
      "ano letivo",
      "identidade",
      "telefone",
    ],
    steps: [
      "Acesse Configurações (exclusivo do perfil Administrador).",
      "Atualize o nome oficial da escola, cidade, UF, telefone da secretaria e o ano letivo vigente.",
      "Envie a imagem do brasão/logo e escolha a cor principal institucional; o sistema aplica a cor de forma contida nos botões, destaques e cabeçalhos impressos.",
      "Clique em Salvar configurações para refletir imediatamente na Landing Page, Login, páginas legais, Ficha A4 e Atas.",
    ],
    tip: "Prefira um brasão em PNG com fundo transparente para ficar nítido tanto no Modo Claro quanto no Modo Escuro e na impressão A4.",
    links: [
      { label: "Abrir Configurações", href: "/dashboard/configuracoes", allowedRoles: ADMIN_ONLY },
    ],
  },
  {
    id: "gestao-usuarios",
    index: "02",
    audience: "GESTAO",
    title: "Cadastro de Usuários e Perfis de Acesso",
    summary:
      "Crie contas, atribua perfis (Admin, Coordenação, Professor, Responsável, Aluno), redefina senhas ou desative acessos.",
    keywords: [
      "usuarios",
      "perfis",
      "senha",
      "cadastro",
      "desativar",
      "professor",
      "responsavel",
      "aluno",
    ],
    steps: [
      "Abra Usuários e clique em 'Novo usuário'.",
      "Informe nome completo, e-mail de acesso, senha inicial e selecione o perfil correspondente.",
      "Para alterar dados ou definir uma nova senha quando alguém esquecer o acesso, clique em Editar no usuário desejado.",
      "Quando um servidor ou família deixar a escola, desative a conta em vez de excluir registros históricos para preservar a integridade das atas e auditorias.",
    ],
    tip: "Sempre após criar uma conta de Responsável ou Aluno, acesse 'Vínculos Família' para ligar a conta ao cadastro do estudante na turma.",
    links: [
      { label: "Abrir Usuários", href: "/dashboard/usuarios", allowedRoles: ADMIN_ONLY },
    ],
  },
  {
    id: "gestao-turmas-csv",
    index: "03",
    audience: "GESTAO",
    title: "Gestão de Turmas, Edição de Telefones e Importação/Exportação CSV",
    summary:
      "Cadastre turmas, importe vários estudantes de uma vez por planilha CSV, atualize telefones de WhatsApp e exporte dados.",
    keywords: [
      "turmas",
      "csv",
      "excel",
      "planilha",
      "importar",
      "exportar",
      "whatsapp",
      "telefone",
      "alunos",
    ],
    steps: [
      "Acesse Turmas para criar novas turmas (série, disciplina, turno e professor responsável) ou abrir uma turma existente.",
      "Dentro da turma, use 'Importar CSV' para cadastrar dezenas de alunos de uma só vez seguindo o modelo de colunas (nome, matrícula, nome do responsável e telefone).",
      "Para alterar o WhatsApp de um responsável, clique no botão de edição ao lado do aluno na tabela da turma, atualize o número com DDD e salve.",
      "Clique em 'Exportar CSV' para baixar a planilha completa da turma compatível com Microsoft Excel e Google Planilhas.",
    ],
    tip: "Cadastre telefones sempre com DDD (ex.: 41 99999-9999) para que os botões de envio pelo WhatsApp abram a conversa corretamente.",
    links: [
      { label: "Abrir Turmas", href: "/dashboard/turmas", allowedRoles: STAFF_ROLES },
    ],
  },
  {
    id: "gestao-vinculos",
    index: "04",
    audience: "GESTAO",
    title: "Vínculo Família ↔ Aluno",
    summary:
      "Associe responsáveis a um ou mais filhos e vincule contas de estudantes para habilitar avisos automáticos e boletins.",
    keywords: [
      "vinculos",
      "familia",
      "mae",
      "pai",
      "responsavel",
      "avisos",
      "filhos",
      "ligar",
    ],
    steps: [
      "Acesse Vínculos Família no menu Gestão.",
      "Na aba de Responsáveis, selecione o usuário da mãe/pai e escolha o estudante (ou vários filhos) que ele acompanhará.",
      "Informe o parentesco e confirme o vínculo; imediatamente o responsável passa a ver os filhos no Painel da Família e receber avisos automáticos de faltas e ocorrências.",
      "Na aba de Conta de Estudante, associe o usuário com perfil Aluno ao respectivo cadastro na turma.",
    ],
    tip: "Se uma mãe relatar que não recebeu o aviso de uma falta, este é o primeiro lugar a verificar: basta confirmar se o vínculo está ativo.",
    links: [
      { label: "Abrir Vínculos Família", href: "/dashboard/familia-vinculos", allowedRoles: MANAGER_ROLES },
    ],
  },
  {
    id: "gestao-justificativas",
    index: "05",
    audience: "GESTAO",
    title: "Aprovação de Justificativas de Falta",
    summary:
      "Analise pedidos enviados pelas famílias com motivo ou atestado e converta faltas automaticamente para FJ.",
    keywords: [
      "justificativas",
      "abono",
      "atestado",
      "falta",
      "fj",
      "aprovar",
      "recusar",
    ],
    steps: [
      "Abra Justificativas (o número vermelho no menu indica quantos pedidos aguardam análise).",
      "Leia a justificativa enviada pelo responsável, confira a data da falta e o texto ou referência do atestado médico.",
      "Clique em 'Aprovar' para converter automaticamente o registro da chamada de F (Falta) para FJ (Falta Justificada) e notificar a família.",
      "Caso seja necessário indeferir, clique em 'Recusar' informando uma breve orientação para o responsável.",
    ],
    tip: "Ao aprovar uma justificativa, o percentual de frequência do estudante e o Radar Pedagógico são atualizados automaticamente.",
    links: [
      { label: "Abrir Justificativas", href: "/dashboard/justificativas", allowedRoles: MANAGER_ROLES },
    ],
  },
  {
    id: "gestao-fechamento-qrcode",
    index: "06",
    audience: "GESTAO",
    title: "Fechamento/Trancamento de Trimestre e Ficha Oficial com QR Code",
    summary:
      "Tranque períodos encerrados após o Conselho de Classe e valide a autenticidade de boletins e atas em /validar.",
    keywords: [
      "fechamento",
      "trancar",
      "destrancar",
      "trimestre",
      "ficha",
      "boletim",
      "qr code",
      "validar",
    ],
    steps: [
      "Em Notas, selecione a turma e o trimestre concluído; perfis de Administração e Coordenação veem o botão 'Fechar / Trancar trimestre'.",
      "Com o trimestre trancado, professores não conseguem alterar notas retroativamente sem liberação da gestão, garantindo segurança ao fechamento.",
      "Para liberar uma correção pontual, a Administração ou Coordenação pode destrancar o trimestre na mesma tela.",
      "Toda Ficha do Aluno (em Turmas → aluno → Ficha) e toda Ata do Conselho gera código único e QR Code verificável publicamente em /validar.",
    ],
    tip: "A página pública /validar funciona mesmo sem login, permitindo que outras escolas ou famílias confiram a autenticidade sem expor dados privados.",
    links: [
      { label: "Abrir Notas", href: "/dashboard/notas", allowedRoles: STAFF_ROLES },
      { label: "Validar Documento", href: "/validar" },
    ],
  },
  {
    id: "gestao-auditoria-backup",
    index: "07",
    audience: "GESTAO",
    title: "Auditoria LGPD e Backup Completo em JSON",
    summary:
      "Consulte a trilha de ações administrativas para conformidade LGPD e exporte cópia completa de segurança dos dados.",
    keywords: [
      "auditoria",
      "lgpd",
      "logs",
      "backup",
      "json",
      "seguranca",
      "exportar",
    ],
    steps: [
      "Acesse Auditoria & Backup (exclusivo do Administrador).",
      "Filtre os registros por ação, usuário ou busca textual para conferir quem realizou operações sensíveis (criação de usuários, fechamento de trimestres, exclusões, backups).",
      "Clique em 'Exportar Backup JSON' periodicamente para baixar uma cópia estruturada das turmas, alunos, chamadas, notas e ocorrências e guardar em local seguro da escola.",
    ],
    tip: "Estabeleça uma rotina mensal ou ao final de cada trimestre para baixar o backup JSON e arquivá-lo na nuvem institucional restrita.",
    links: [
      { label: "Abrir Auditoria & Backup", href: "/dashboard/auditoria", allowedRoles: ADMIN_ONLY },
    ],
  },

  // =========================================================================
  // ABA 3 — GUIA DA FAMILIA (5 MODULOS)
  // =========================================================================
  {
    id: "fam-painel",
    index: "01",
    audience: "FAMILIA",
    title: "Painel da Família e Troca entre Filhos",
    summary:
      "Acompanhe frequência, médias trimestrais, medalhas de mérito e ocorrências de cada filho em um painel simples.",
    keywords: [
      "painel",
      "familia",
      "filhos",
      "boletim",
      "notas",
      "frequencia",
      "medalhas",
    ],
    steps: [
      "Ao entrar no portal, você vê diretamente o Painel da Família com o resumo escolar.",
      "Se você acompanha mais de um filho na escola, use o seletor no topo da página para alternar entre eles com um toque.",
      "Consulte os cartões de frequência, média geral, evolução por trimestre, medalhas recebidas e ocorrências recentes.",
      "Sempre que precisar de uma via impressa ou em PDF, clique em 'Ver Ficha / Boletim' para abrir o documento completo com QR Code.",
    ],
    tip: "O gráfico de evolução ajuda a perceber rapidamente se houve melhora ou queda de rendimento entre o 1º, 2º e 3º trimestres.",
    links: [
      { label: "Abrir Painel da Família", href: "/dashboard/familia", allowedRoles: GUARDIAN_ONLY },
    ],
  },
  {
    id: "fam-avisos",
    index: "02",
    audience: "FAMILIA",
    title: "Avisos Automáticos e Confirmação 'Li e estou ciente'",
    summary:
      "Receba notificações de faltas, ocorrências e medalhas e confirme leitura para a escola saber que você acompanhou.",
    keywords: [
      "avisos",
      "notificacoes",
      "ciente",
      "li e estou ciente",
      "sininho",
      "falta",
      "ocorrencia",
    ],
    steps: [
      "O ícone de sino no topo (e o item Avisos no menu) mostra um número vermelho sempre que houver novidades aguardando sua leitura.",
      "Abra a tela Avisos para ler os detalhes completos de faltas, ocorrências ou reconhecimentos.",
      "Toque no botão 'Li e estou ciente' para registrar sua confirmação com data e hora.",
      "A escola visualiza imediatamente que você tomou ciência, evitando ligações desnecessárias.",
    ],
    tip: "Confirmar ciência não impede de conversar com a escola: se tiver alguma dúvida sobre o aviso, use o canal Atendimento.",
    links: [
      { label: "Abrir Avisos", href: "/dashboard/avisos", allowedRoles: GUARDIAN_OR_STUDENT },
    ],
  },
  {
    id: "fam-justificar",
    index: "03",
    audience: "FAMILIA",
    title: "Como Justificar uma Falta pelo Portal",
    summary:
      "Envie o motivo da ausência (como consulta médica ou imprevisto familiar) direto pelo portal para análise da coordenação.",
    keywords: [
      "justificar",
      "justificativa",
      "falta",
      "atestado",
      "abono",
      "ausencia",
    ],
    steps: [
      "No Painel da Família (ou a partir de um aviso de falta em Avisos), clique em 'Justificar falta'.",
      "Selecione a data/aula da ausência, escreva o motivo com clareza e informe se há atestado médico (você pode entregar o papel físico na secretaria quando o aluno retornar).",
      "Envie o pedido e acompanhe o status (Pendente, Aprovada ou Recusada) na própria tela.",
      "Assim que a coordenação aprovar, a falta muda automaticamente para Falta Justificada (FJ).",
    ],
    tip: "Envie a justificativa assim que possível após a ausência para manter a frequência do estudante sempre em dia.",
    links: [
      { label: "Abrir Painel da Família", href: "/dashboard/familia", allowedRoles: GUARDIAN_ONLY },
      { label: "Abrir Avisos", href: "/dashboard/avisos", allowedRoles: GUARDIAN_OR_STUDENT },
    ],
  },
  {
    id: "fam-atendimento-rotina",
    index: "04",
    audience: "FAMILIA",
    title: "Atendimento com a Escola, Reuniões, Calendário e Tarefas",
    summary:
      "Fale direto com a coordenação ou professores, confirme presença em reuniões e acompanhe provas e tarefas.",
    keywords: [
      "atendimento",
      "mensagens",
      "reunioes",
      "calendario",
      "tarefas",
      "provas",
      "escola",
    ],
    steps: [
      "Em Atendimento, clique em 'Nova conversa', escolha o filho e o assunto para enviar uma mensagem direta à equipe escolar e acompanhar as respostas no mesmo lugar.",
      "Em Reuniões, visualize convocações da escola e clique em 'Confirmar presença' ou solicite um novo horário caso não possa comparecer.",
      "Em Calendário e Tarefas & Materiais, confira as datas de provas, trabalhos e links de estudo publicados pelos professores.",
    ],
    tip: "Pelo Calendário você consegue ver de uma só vez todas as provas da semana e ajudar na organização dos estudos em casa.",
    links: [
      { label: "Atendimento", href: "/dashboard/mensagens", allowedRoles: NO_STUDENT },
      { label: "Reuniões", href: "/dashboard/reunioes", allowedRoles: NO_STUDENT },
      { label: "Calendário", href: "/dashboard/calendario" },
      { label: "Tarefas", href: "/dashboard/tarefas" },
    ],
  },
  {
    id: "fam-pwa",
    index: "05",
    audience: "FAMILIA",
    title: "Como Instalar o Portal no Celular como Aplicativo (PWA)",
    summary:
      "Coloque o ícone da escola na tela inicial do Android ou iPhone sem precisar baixar nada na loja de aplicativos.",
    keywords: [
      "instalar",
      "aplicativo",
      "app",
      "celular",
      "android",
      "iphone",
      "pwa",
      "loja",
    ],
    steps: [
      "No Android (Google Chrome): acesse o portal normalmente, toque no aviso 'Instalar aplicativo' no topo da tela ou abra o menu de três pontinhos (⋮) e toque em 'Adicionar à tela inicial'.",
      "No iPhone / iPad (Safari): toque no botão Compartilhar (quadrado com seta para cima na barra inferior), role para baixo e toque em 'Adicionar à Tela de Início'.",
      "Confirme o nome do atalho e pronto: o portal passa a abrir em tela cheia com o ícone da escola, exatamente como um aplicativo instalado.",
    ],
    tip: "O aplicativo instalado ocupa quase zero espaço na memória do celular e se atualiza automaticamente toda vez que a escola traz uma novidade.",
    links: [],
  },

  // =========================================================================
  // ABA 4 — GUIA DO ESTUDANTE (3 MODULOS)
  // =========================================================================
  {
    id: "alu-painel",
    index: "01",
    audience: "ALUNO",
    title: "Acompanhar Boletim, Frequência e Conquistas/Medalhas",
    summary:
      "Veja suas médias trimestrais, percentual de presença e medalhas de mérito recebidas ao longo do ano.",
    keywords: [
      "boletim",
      "notas",
      "frequencia",
      "medalhas",
      "conquistas",
      "meu painel",
      "media",
    ],
    steps: [
      "No Meu Painel, confira no topo sua frequência geral, sua média atual e o resumo de avisos.",
      "Role até a seção de Boletim para ver cada avaliação lançada pelos professores e acompanhar sua evolução nos trimestres.",
      "Confira suas Medalhas e Conquistas para ver os reconhecimentos concedidos pela escola e pelos docentes.",
    ],
    tip: "Se sua frequência estiver perto de 75%, fique atento às faltas para não correr risco por ausência nas disciplinas.",
    links: [
      { label: "Abrir Meu Painel", href: "/dashboard/aluno", allowedRoles: STUDENT_ONLY },
    ],
  },
  {
    id: "alu-rotina",
    index: "02",
    audience: "ALUNO",
    title: "Consultar Horários, Calendário de Provas e Comunicados",
    summary:
      "Organize sua semana consultando a grade de aulas, datas de avaliações e recados oficiais da turma.",
    keywords: [
      "horarios",
      "calendario",
      "provas",
      "comunicados",
      "aulas",
      "semana",
    ],
    steps: [
      "Em Horários, consulte quais disciplinas acontecem em cada dia da semana e em qual sala.",
      "Em Calendário, verifique todas as provas, entregas de trabalhos, passeios e feriados marcados.",
      "Em Comunicados, leia os recados publicados pela direção, coordenação e professores da sua turma.",
    ],
    tip: "Use o atalho Ctrl + K no computador (ou o botão Buscar no topo) para pular direto entre Horários, Calendário e Tarefas.",
    links: [
      { label: "Horários", href: "/dashboard/horarios" },
      { label: "Calendário", href: "/dashboard/calendario" },
      { label: "Comunicados", href: "/dashboard/comunicados" },
    ],
  },
  {
    id: "alu-tarefas",
    index: "03",
    audience: "ALUNO",
    title: "Entregar Tarefas e Acessar Materiais de Aula",
    summary:
      "Veja atividades pendentes, abra links de materiais de estudo e marque tarefas concluídas dentro do prazo.",
    keywords: [
      "tarefas",
      "entregar",
      "materiais",
      "dever",
      "prazo",
      "estudo",
    ],
    steps: [
      "Acesse Tarefas & Materiais para visualizar todas as atividades da sua turma organizadas por prazo.",
      "Clique nos links de apoio anexados pelos professores para baixar listas, roteiros ou abrir referências de estudo.",
      "Quando concluir uma atividade, marque a entrega diretamente no cartão da tarefa para manter seu controle organizado.",
    ],
    tip: "Confira sempre os filtros de tarefas pendentes no início da semana para evitar entregas em cima da hora.",
    links: [
      { label: "Abrir Tarefas & Materiais", href: "/dashboard/tarefas" },
    ],
  },
];

export const HELP_FAQ_ITEMS: readonly HelpFaqItem[] = [
  {
    id: "faq-aviso-falta",
    question:
      "Marquei falta e o responsável não recebeu o aviso — o que verificar?",
    answer:
      "Os avisos automáticos de falta e ocorrência são enviados para a conta de responsável vinculada ao estudante. Peça à Coordenação ou Administração para conferir em 'Vínculos Família' se o usuário do responsável está associado corretamente ao aluno e se a conta está ativa.",
    audiences: ["PROFESSOR", "GESTAO"],
    keywords: ["falta", "aviso", "responsavel", "vinculo", "nao recebeu"],
    relatedLink: {
      label: "Abrir Vínculos Família",
      href: "/dashboard/familia-vinculos",
      allowedRoles: MANAGER_ROLES,
    },
  },
  {
    id: "faq-corrigir-chamada",
    question: "Como corrigir uma chamada salva em um dia anterior?",
    answer:
      "Acesse a tela 'Chamada', selecione a turma correspondente e role até a seção 'Histórico de Aulas'. Clique sobre a aula do dia anterior para carregá-la novamente no formulário, ajuste os botões P, F ou FJ (ou o conteúdo do diário) e clique em Salvar novamente.",
    audiences: ["PROFESSOR", "GESTAO"],
    keywords: ["corrigir", "chamada", "dia anterior", "historico", "editar"],
    relatedLink: {
      label: "Abrir Chamada",
      href: "/dashboard/chamada",
      allowedRoles: STAFF_ROLES,
    },
  },
  {
    id: "faq-trimestre-trancado",
    question: "O trimestre aparece trancado na tela de Notas — como liberar?",
    answer:
      "Quando a Coordenação ou Direção encerra um período após o Conselho de Classe, o trimestre é trancado para evitar alterações acidentais nos boletins. Para lançar ou corrigir uma nota retroativa, solicite à Coordenação ou Administração que destranque temporariamente o trimestre na tela 'Notas'.",
    audiences: ["PROFESSOR", "GESTAO"],
    keywords: ["trimestre", "trancado", "notas", "liberar", "destrancar", "fechado"],
    relatedLink: {
      label: "Abrir Notas",
      href: "/dashboard/notas",
      allowedRoles: STAFF_ROLES,
    },
  },
  {
    id: "faq-trocar-whatsapp",
    question: "Como trocar o número do WhatsApp de um responsável?",
    answer:
      "Acesse 'Turmas', abra a turma do estudante e clique no botão de editar ao lado do nome do aluno. Atualize o campo de telefone do responsável com DDD e salve. O novo número passa a ser usado imediatamente nos botões de WhatsApp das ocorrências e da ficha.",
    audiences: ["PROFESSOR", "GESTAO", "FAMILIA"],
    keywords: ["whatsapp", "telefone", "trocar", "numero", "responsavel", "contato"],
    relatedLink: {
      label: "Abrir Turmas",
      href: "/dashboard/turmas",
      allowedRoles: STAFF_ROLES,
    },
  },
  {
    id: "faq-validar-documento",
    question: "Como conferir se um boletim ou ata impressa é verdadeira?",
    answer:
      "Aponte a câmera do celular para o QR Code impresso no cabeçalho da Ficha do Aluno ou da Ata do Conselho de Classe, ou acesse a página pública '/validar' e digite o código identificador impresso abaixo do QR Code. O portal confirma na hora a autenticidade junto à secretaria, sem expor dados privados.",
    audiences: ["PROFESSOR", "GESTAO", "FAMILIA", "ALUNO"],
    keywords: ["boletim", "ata", "qr code", "validar", "autenticidade", "verdadeira"],
    relatedLink: {
      label: "Abrir página /validar",
      href: "/validar",
    },
  },
  {
    id: "faq-pwa-app",
    question: "O site funciona sem precisar baixar na loja de aplicativos?",
    answer:
      "Sim. O portal é um aplicativo web instalável (PWA). Você pode acessá-lo direto pelo navegador ou tocar em 'Adicionar à tela inicial' (no Chrome do Android ou no menu Compartilhar do Safari no iPhone) para criar um ícone na tela do celular, sem precisar da Play Store ou App Store.",
    audiences: ["PROFESSOR", "GESTAO", "FAMILIA", "ALUNO"],
    keywords: ["app", "aplicativo", "pwa", "loja", "celular", "android", "iphone"],
  },
];

export const HELP_QUICK_SHORTCUTS: readonly HelpShortcutItem[] = [
  {
    shortcut: "Ctrl + K / Cmd + K",
    resource: "Busca Rápida Global",
    description: "Pesquisa alunos, matrículas, turmas, ocorrências e atalhos de qualquer tela.",
  },
  {
    shortcut: "Ícone Sol / Lua",
    resource: "Modo Claro e Escuro",
    description: "Alterna o tema visual no topo do sistema e salva sua preferência no navegador.",
  },
  {
    shortcut: "Ctrl + P / Botão Imprimir",
    resource: "Impressão A4 Limpa",
    description: "Imprime Ficha do Aluno e Ata do Conselho sempre em fundo branco com QR Code.",
  },
  {
    shortcut: "Ícone Menu Lateral",
    resource: "Recolher Barra Lateral",
    description: "Compacta o menu no desktop para ampliar a visualização de tabelas e mapas.",
  },
  {
    shortcut: "ESC",
    resource: "Fechar Janelas e Busca",
    description: "Fecha instantaneamente modais, menus suspensos e a janela de busca rápida.",
  },
];

export function getVisibleAudiencesForRole(
  role: UserRole
): readonly HelpAudienceId[] {
  if (role === "ADMIN" || role === "COORDENACAO") {
    return ["GESTAO", "PROFESSOR", "FAMILIA", "ALUNO"];
  }
  if (role === "PROFESSOR") {
    return ["PROFESSOR", "FAMILIA"];
  }
  if (role === "RESPONSAVEL") {
    return ["FAMILIA"];
  }
  return ["ALUNO"];
}

export function getDefaultAudienceForRole(role: UserRole): HelpAudienceId {
  if (role === "ADMIN" || role === "COORDENACAO") {
    return "GESTAO";
  }
  if (role === "PROFESSOR") {
    return "PROFESSOR";
  }
  if (role === "RESPONSAVEL") {
    return "FAMILIA";
  }
  return "ALUNO";
}
