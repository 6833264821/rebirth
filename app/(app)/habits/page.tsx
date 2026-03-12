"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatISO } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoHabitLogs, demoHabits } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

const today = formatISO(new Date(), { representation: "date" });

export default function HabitsPage() {
  const [habits, setHabits] = useState(demoHabits);
  const [logs, setLogs] = useState(demoHabitLogs);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [saving, setSaving] = useState(false);

  const hydrate = useCallback(async () => {
    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = createClient();
    const [habitResponse, logResponse] = await Promise.all([
      supabase.from("habits").select("*").order("created_at", { ascending: false }),
      supabase.from("habit_logs").select("*").eq("date", today)
    ]);

    if (habitResponse.data) {
      setHabits(habitResponse.data as typeof demoHabits);
    }

    if (logResponse.data) {
      setLogs(logResponse.data as typeof demoHabitLogs);
    }
  }, []);

  const ensureTodayLogs = useCallback(async (habitData = habits) => {
    if (!hasSupabaseEnv || !habitData.length) {
      return;
    }

    const supabase = createClient();
    const payload = habitData.map((habit) => ({ habit_id: habit.id, date: today, completed: false }));
    await supabase.from("habit_logs").upsert(payload, { onConflict: "habit_id,date", ignoreDuplicates: true });
  }, [habits]);

  useEffect(() => {
    void (async () => {
      await ensureTodayLogs();
      await hydrate();
    })();
  }, [ensureTodayLogs, hydrate]);

  const rows = useMemo(
    () =>
      habits.map((habit) => ({
        ...habit,
        log: logs.find((item) => item.habit_id === habit.id && item.date === today)
      })),
    [habits, logs]
  );

  const completion = rows.length ? Math.round((rows.filter((item) => item.log?.completed).length / rows.length) * 100) : 0;

  const addHabit = async () => {
    if (!name.trim()) return;

    setSaving(true);

    try {
      if (!hasSupabaseEnv) {
        const id = crypto.randomUUID();
        setHabits((current) => [{ id, workspace_id: "demo-user", name, category, created_at: new Date().toISOString(), frequency: "daily" }, ...current]);
        setLogs((current) => [{ id: crypto.randomUUID(), habit_id: id, date: today, completed: false, notes: null, created_at: new Date().toISOString() }, ...current]);
      } else {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("habits")
          .insert({ name, category, frequency: "daily" })
          .select()
          .single();

        if (error) throw error;
        await ensureTodayLogs([data as typeof demoHabits[number]]);
        await hydrate();
      }

      setName("");
      setCategory("other");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add habit");
    } finally {
      setSaving(false);
    }
  };

  const toggleHabit = async (habitId: string, completed: boolean) => {
    const previous = logs;
    setLogs((current) =>
      current.map((item) => (item.habit_id === habitId && item.date === today ? { ...item, completed } : item))
    );

    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = createClient();
    const existing = logs.find((item) => item.habit_id === habitId && item.date === today);
    const { error } = await supabase.from("habit_logs").upsert({
      id: existing?.id,
      habit_id: habitId,
      date: today,
      completed
    }, { onConflict: "habit_id,date" });

    if (error) {
      setLogs(previous);
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-sm text-muted-foreground">Auto-generated daily checklist from your habit templates.</p>
        <h1 className="text-3xl font-semibold">Habit Tracking</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Today board</CardTitle>
            <CardDescription>Tick each routine as the day moves.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="accent">{completion}% completed</Badge>
              <span className="text-sm text-muted-foreground">{rows.filter((item) => item.log?.completed).length}/{rows.length} finished</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <table className="w-full text-sm">
                <thead className="bg-secondary/70 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Done</th>
                    <th className="px-4 py-3 font-medium">Habit</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-border/70">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={Boolean(row.log?.completed)} onChange={(event) => void toggleHabit(row.id, event.target.checked)} className="h-4 w-4 rounded border-border" />
                      </td>
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create habit template</CardTitle>
            <CardDescription>New items will join the daily auto-checklist.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Habit name</Label>
              <Input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Drink water" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-category">Category</Label>
              <Input id="habit-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="health" />
            </div>
            <Button type="button" className="w-full" onClick={() => void addHabit()} disabled={saving}>
              Add habit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
