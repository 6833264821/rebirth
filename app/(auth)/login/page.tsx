import { Sparkles, Target, Wallet } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/env";

const highlights = [
  { icon: Target, title: "Goal clarity", description: "See habit completion, work momentum and calendar shape in one place." },
  { icon: Wallet, title: "Money awareness", description: "Track income, expenses and monthly cash direction without leaving the app." },
  { icon: Sparkles, title: "Calm UI", description: "shadcn-inspired interface with white/black theme and restrained motion." }
];

export default function LoginPage() {
  return (
    <div className="container flex min-h-screen items-center py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-none bg-transparent shadow-none">
          <CardContent className="grid gap-6 p-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="glass-panel relative overflow-hidden rounded-[2rem] p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.25),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.15),transparent_24%)]" />
              <div className="relative space-y-8">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Personal operating system</p>
                  <h2 className="max-w-xl text-4xl font-semibold leading-tight text-balance lg:text-5xl">
                    Rebuild your daily life into one focused web workspace.
                  </h2>
                  <p className="max-w-lg text-sm text-muted-foreground lg:text-base">
                    Dashboard, habits, projects, finance and calendar sync built for desktop and tablet-first use, but still comfortable on mobile.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {highlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                        <Icon className="mb-3 h-5 w-5" />
                        <h3 className="mb-1 font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-8">
              {!hasSupabaseEnv ? (
                <div className="mb-4 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
                  Supabase env is not configured yet. You can still preview the app in demo mode.
                </div>
              ) : null}
              <LoginForm />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
