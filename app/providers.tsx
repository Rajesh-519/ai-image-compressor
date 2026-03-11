"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <RegisterServiceWorker />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
