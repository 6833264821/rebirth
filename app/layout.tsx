import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { AppProviders } from "@/components/providers/app-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono"
});

export const metadata: Metadata = {
  title: "Rebirth 2.0",
  description: "A life operating system for habits, work, money and time."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
