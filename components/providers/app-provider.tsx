"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
