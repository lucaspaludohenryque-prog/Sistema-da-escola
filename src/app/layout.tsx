import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/shared/components/AppProviders";
import "./globals.css";

const SITE_URL = "https://rcolasalle.vercel.app";
const SITE_TITLE = "RCO La Salle Curitiba | Registro de Classe Online";
const SITE_DESCRIPTION =
  "Sistema escolar de Registro de Classe Online (RCO) para gestão de turmas, chamada, notas e ocorrências.";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("rco-theme");if(t==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
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
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-[100dvh] bg-[#F6F8FA] font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 dark:bg-slate-950 dark:text-slate-100 dark:selection:bg-blue-500/30 dark:selection:text-blue-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
