import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { demoProfile } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: Readonly<{ children: ReactNode }>) {
  if (!hasSupabaseEnv) {
    return <AppShell name={demoProfile.display_name} isDemo avatarUrl={demoProfile.avatar_url}>{children}</AppShell>;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = user.user_metadata.display_name || user.user_metadata.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata.avatar_url || null;

  return (
    <AppShell name={displayName} isDemo={false} avatarUrl={avatarUrl}>
      {children}
    </AppShell>
  );
}
