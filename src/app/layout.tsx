/* eslint-disable @next/next/no-page-custom-font -- Carrega Inter via stylesheet padrao sem depender de next/font/google no build. */
import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/shared/components/AppProviders";
import "./globals.css";

const SITE_URL = "https://rcolasalle.vercel.app";
const SITE_TITLE = "RCO La Salle Curitiba | Registro de Classe Online";
const SITE_DESCRIPTION =
  "Sistema escolar de Registro de Classe Online (RCO) para gestão de turmas, chamada, notas e ocorrências.";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("rco-theme");if(t==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F7F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0D0F" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RCO La Salle",
  },
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-[100dvh] bg-[#F7F7F8] font-sans text-zinc-900 antialiased selection:bg-zinc-200 selection:text-zinc-900 dark:bg-[#0C0D0F] dark:text-zinc-100 dark:selection:bg-white/15 dark:selection:text-zinc-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
