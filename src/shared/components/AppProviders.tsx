"use client";

import { CookieConsentBanner } from "./CookieConsentBanner";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <CookieConsentBanner />
      </ToastProvider>
    </ThemeProvider>
  );
}
