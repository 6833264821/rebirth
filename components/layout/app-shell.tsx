import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

type AppShellProps = {
  children: ReactNode;
  name: string;
  avatarUrl?: string | null;
  isDemo: boolean;
};

export function AppShell({ children, name, avatarUrl, isDemo }: AppShellProps) {
  return (
    <div className="container flex min-h-screen gap-4 py-4 lg:gap-6">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
        <Topbar name={name} avatarUrl={avatarUrl} isDemo={isDemo} />
        <main className="pb-10">{children}</main>
      </div>
    </div>
  );
}
