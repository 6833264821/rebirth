"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudSun, Flame, ListTodo, PiggyBank, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoCalendarEvents, demoHabitLogs, demoTransactions, demoWorkItems } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { currency, shortDate } from "@/lib/utils";

type WeatherInfo = {
  temperature: number;
  description: string;
};

const budgetSeries = [
  { name: "Income", value: demoTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0) },
  { name: "Expense", value: demoTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0) }
];

export default function DashboardPage() {
  const [workItems, setWorkItems] = useState(demoWorkItems);
  const [habitLogs, setHabitLogs] = useState(demoHabitLogs);
  const [transactions, setTransactions] = useState(demoTransactions);
  const [calendarEvents, setCalendarEvents] = useState(demoCalendarEvents);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);

    try {
      if (hasSupabaseEnv) {
        const supabase = createClient();
        const [workResponse, habitResponse, transactionResponse, calendarResponse] = await Promise.all([
          supabase.from("work_items").select("*").order("created_at", { ascending: false }).limit(6),
          supabase.from("habit_logs").select("*").order("date", { ascending: false }).limit(12),
          supabase.from("transactions").select("*").order("date", { ascending: false }).limit(12),
          supabase.from("calendar_events").select("*").order("starts_at", { ascending: true }).limit(10)
        ]);

        if (workResponse.data) setWorkItems(workResponse.data as typeof demoWorkItems);
        if (habitResponse.data) setHabitLogs(habitResponse.data as typeof demoHabitLogs);
        if (transactionResponse.data) setTransactions(transactionResponse.data as typeof demoTransactions);
        if (calendarResponse.data) setCalendarEvents(calendarResponse.data as typeof demoCalendarEvents);
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
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
    </div>
  );
}
