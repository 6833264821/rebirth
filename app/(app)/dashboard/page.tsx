"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpenText, CloudSun, Flame, ListTodo, PiggyBank, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoCalendarEvents, demoHabitLogs, demoSubjects, demoTransactions, demoWorkItems } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { Subject } from "@/lib/types";
import { currency, shortDate } from "@/lib/utils";

type WeatherInfo = {
  temperature: number;
  description: string;
};

export default function DashboardPage() {
  const [workItems, setWorkItems] = useState(demoWorkItems);
  const [habitLogs, setHabitLogs] = useState(demoHabitLogs);
  const [transactions, setTransactions] = useState(demoTransactions);
  const [calendarEvents, setCalendarEvents] = useState(demoCalendarEvents);
  const [subjects, setSubjects] = useState<Subject[]>(demoSubjects);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);

    try {
      if (hasSupabaseEnv) {
        const supabase = createClient();
        const [workResponse, habitResponse, transactionResponse, calendarResponse, subjectResponse] = await Promise.all([
          supabase.from("work_items").select("*").order("created_at", { ascending: false }).limit(6),
          supabase.from("habit_logs").select("*").order("date", { ascending: false }).limit(12),
          supabase.from("transactions").select("*").order("date", { ascending: false }).limit(12),
          supabase.from("calendar_events").select("*").order("starts_at", { ascending: true }).limit(10),
          supabase.from("subjects").select("*").order("created_at", { ascending: false }).limit(6)
        ]);

        if (workResponse.data) setWorkItems(workResponse.data as typeof demoWorkItems);
        if (habitResponse.data) setHabitLogs(habitResponse.data as typeof demoHabitLogs);
        if (transactionResponse.data) setTransactions(transactionResponse.data as typeof demoTransactions);
        if (calendarResponse.data) setCalendarEvents(calendarResponse.data as typeof demoCalendarEvents);
        if (subjectResponse.data) setSubjects(subjectResponse.data as Subject[]);
      }

      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current=temperature_2m,weather_code", {
        cache: "no-store"
      });
      const payload = await response.json();
      setWeather({
        temperature: Math.round(payload.current.temperature_2m),
        description: "Bangkok"
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const completionRate = useMemo(() => {
    if (!habitLogs.length) return 0;
    return Math.round((habitLogs.filter((item) => item.completed).length / habitLogs.length) * 100);
  }, [habitLogs]);

  const pendingWork = useMemo(() => workItems.filter((item) => item.status !== "completed"), [workItems]);
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const net = income - expense;
  const totalMovement = Math.max(income + expense, 1);
  const topExpenseCategory = useMemo(() => {
    const categoryTotals = transactions
      .filter((item) => item.type === "expense")
      .reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.category] = (accumulator[item.category] ?? 0) + item.amount;
        return accumulator;
      }, {});

    return Object.entries(categoryTotals).sort((left, right) => right[1] - left[1])[0] ?? null;
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back. Here is the current system status.</p>
          <h1 className="text-3xl font-semibold">Dashboard overview</h1>
        </div>
        <Button type="button" variant="outline" onClick={() => void refreshData()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Habit completion</CardDescription>
            <CardTitle className="text-3xl">{completionRate}%</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{habitLogs.filter((item) => item.completed).length} tasks done today</span>
            <Flame className="h-5 w-5 text-accent" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open work items</CardDescription>
            <CardTitle className="text-3xl">{pendingWork.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Across projects and deadlines</span>
            <ListTodo className="h-5 w-5 text-sky-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Net this month</CardDescription>
            <CardTitle className="text-3xl">{currency(income - expense)}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Income minus expenses</span>
            <PiggyBank className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Weather</CardDescription>
            <CardTitle className="text-3xl">{weather ? `${weather.temperature}°C` : "--"}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{weather?.description ?? "Loading Bangkok weather"}</span>
            <CloudSun className="h-5 w-5 text-warning" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cashflow snapshot</CardTitle>
            <CardDescription>Fast look at monthly money direction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Income</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-500">{currency(income)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Expense</p>
                <p className="mt-2 text-2xl font-semibold text-rose-500">{currency(expense)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Net</p>
                <p className={`mt-2 text-2xl font-semibold ${net >= 0 ? "text-foreground" : "text-rose-500"}`}>{currency(net)}</p>
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-secondary/40 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Income ratio</span>
                  <span className="font-medium">{Math.round((income / totalMovement) * 100)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-background/80">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(income / totalMovement) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expense ratio</span>
                  <span className="font-medium">{Math.round((expense / totalMovement) * 100)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-background/80">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${(expense / totalMovement) * 100}%` }} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Monthly direction</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {net >= 0 ? "You are spending below incoming cash this month." : "Expenses are currently ahead of incoming cash."}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Top expense</p>
                  <p className="mt-2 text-lg font-semibold">{topExpenseCategory?.[0] ?? "No expense data"}</p>
                  <p className="text-sm text-muted-foreground">{topExpenseCategory ? currency(topExpenseCategory[1]) : "Add expense entries to see trends."}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming calendar</CardTitle>
            <CardDescription>Combined internal and synced schedule blocks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {calendarEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-start justify-between rounded-2xl border border-border/70 bg-background/70 p-4">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{new Date(event.starts_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <Badge variant={event.source === "google" ? "warning" : "accent"}>{event.source}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today focus</CardTitle>
            <CardDescription>Important work still open today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingWork.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-2xl border border-border/70 bg-background/70 p-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.subject ?? item.type} • due {item.due_date ? shortDate(item.due_date) : "TBD"}</p>
                </div>
                <Badge variant={item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "default"}>{item.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Subjects orbit</CardTitle>
                <CardDescription>Database relation between your subjects and active work.</CardDescription>
              </div>
              <Button asChild type="button" variant="outline" size="sm">
                <Link href="/subjects">
                  Open subjects
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjects.slice(0, 4).map((subject) => (
              <div key={subject.id} className="flex items-start justify-between rounded-2xl border border-border/70 bg-background/70 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpenText className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{subject.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{subject.notes_count} notes • {subject.homework_completed}/{subject.homework_total} homework</p>
                </div>
                <Badge variant={subject.focus === "major" ? "accent" : subject.focus === "support" ? "warning" : "success"}>{subject.focus}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription>Quick scan of movement across categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-start justify-between rounded-2xl border border-border/70 bg-background/70 p-4">
              <div>
                <p className="font-medium">{item.category}</p>
                <p className="text-sm text-muted-foreground">{item.description ?? "No details"}</p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${item.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                  {item.type === "income" ? "+" : "-"}{currency(item.amount)}
                </p>
                <p className="text-sm text-muted-foreground">{shortDate(item.date)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
