import type { UserRole } from "@/features/auth/types";

export type HelpAudienceId = "PROFESSOR" | "GESTAO" | "FAMILIA" | "ALUNO";

export interface HelpModuleLink {
  label: string;
  href: string;
  allowedRoles?: readonly UserRole[];
}

export interface HelpGuideModule {
  id: string;
  index: string;
  audience: HelpAudienceId;
  title: string;
  summary: string;
  keywords: readonly string[];
  steps: readonly string[];
  tip: string;
  links: readonly HelpModuleLink[];
}

export interface HelpChecklistStep {
  id: string;
  label: string;
  description: string;
  href?: string;
  allowedRoles?: readonly UserRole[];
  triggerCommandPalette?: boolean;
}

export interface HelpAudienceDefinition {
  id: HelpAudienceId;
  tabLabel: string;
  shortLabel: string;
  heading: string;
  description: string;
  checklist: readonly HelpChecklistStep[];
}

export interface HelpFaqItem {
  id: string;
  question: string;
  answer: string;
  audiences: readonly HelpAudienceId[];
  keywords: readonly string[];
  relatedLink?: HelpModuleLink;
}

export interface HelpShortcutItem {
  shortcut: string;
  resource: string;
  description: string;
}
