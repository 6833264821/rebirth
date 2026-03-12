"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartNoAxesCombined, CircleDollarSign, LayoutDashboard, ListChecks, UserCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habit Tracking", icon: ListChecks },
  { href: "/work", label: "Work", icon: ChartNoAxesCombined },
  { href: "/finance", label: "Finance", icon: CircleDollarSign },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserCircle2 }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 rounded-[2rem] p-4 lg:flex lg:flex-col">
      <div className="flex items-center justify-between rounded-2xl bg-secondary/70 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Rebirth</p>
          <h1 className="text-xl font-semibold">Life OS</h1>
        </div>
        <Badge variant="accent">v1</Badge>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
                active ? "bg-primary text-primary-foreground shadow-panel" : "hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
        Track habits, work, money and calendar in one dashboard.
      </div>
    </aside>
  );
}
