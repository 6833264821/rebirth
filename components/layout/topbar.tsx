"use client";

import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type TopbarProps = {
  name: string;
  avatarUrl?: string | null;
  isDemo: boolean;
  notificationCount?: number;
};

export function Topbar({ name, avatarUrl, isDemo, notificationCount = 2 }: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (!hasSupabaseEnv) {
      toast.info("Demo mode active. Connect Supabase to enable auth.");
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="glass-panel sticky top-4 z-20 flex items-center justify-between rounded-[1.75rem] px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Daily Control Center</p>
        <h2 className="text-xl font-semibold text-balance">Build rhythm, keep the system calm.</h2>
      </div>

      <div className="flex items-center gap-3">
        {isDemo ? <Badge variant="warning">Demo mode</Badge> : null}
        <Button asChild variant="outline" size="icon">
          <Link href="/profile#notifications" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {notificationCount}
              </span>
            ) : null}
          </Link>
        </Button>
        <ThemeToggle />
        <Link href="/profile" className="flex items-center gap-3 rounded-full border border-border/80 bg-background/80 px-2 py-1.5 transition hover:bg-secondary">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl ?? undefined} alt={name} />
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">Profile settings</p>
          </div>
        </Link>
        <Button type="button" variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
