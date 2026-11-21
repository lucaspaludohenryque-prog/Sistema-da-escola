import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://rcolasalle.vercel.app";
const SITE_TITLE = "RCO La Salle Curitiba | Registro de Classe Online";
const SITE_DESCRIPTION =
  "Sistema escolar de Registro de Classe Online (RCO) para gestão de turmas, chamada, notas e ocorrências.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | RCO La Salle Curitiba",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "RCO La Salle Curitiba",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="pt-BR">
      <body className="min-h-[100dvh] bg-[#F6F8FA] font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
