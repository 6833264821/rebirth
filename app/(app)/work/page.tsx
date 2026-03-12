"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoWorkItems } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { Priority, WorkStatus, WorkType } from "@/lib/types";
import { shortDate } from "@/lib/utils";

export default function WorkPage() {
  const [items, setItems] = useState(demoWorkItems);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [form, setForm] = useState<{ name: string; subject: string; priority: Priority; type: WorkType; status: WorkStatus; link: string; start_date: string; due_date: string; details: string }>({
    name: "",
    subject: "",
    priority: "medium",
    type: "task",
    status: "pending",
    link: "",
    start_date: "",
    due_date: "",
    details: ""
  });

  const loadItems = async () => {
    if (!hasSupabaseEnv) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("work_items").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems(data as typeof demoWorkItems);
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = [item.name, item.subject, item.details].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
      return matchesQuery && matchesPriority;
    });
  }, [items, priorityFilter, query]);

  const submitItem = async () => {
    if (!form.name.trim()) return;

    const payload = {
      ...form,
      details: form.details || null,
      link: form.link || null,
      subject: form.subject || null,
      start_date: form.start_date || null,
      due_date: form.due_date || null
    };

    if (!hasSupabaseEnv) {
      setItems((current) => [{ id: crypto.randomUUID(), workspace_id: "demo-user", created_at: new Date().toISOString(), ...payload }, ...current]);
      setForm({ name: "", subject: "", priority: "medium", type: "task", status: "pending", link: "", start_date: "", due_date: "", details: "" });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("work_items").insert(payload);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadItems();
    setForm({ name: "", subject: "", priority: "medium", type: "task", status: "pending", link: "", start_date: "", due_date: "", details: "" });
  };

  const updateStatus = async (id: string, status: string) => {
    const previous = items;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status: status as typeof item.status } : item)));

    if (!hasSupabaseEnv) return;
    const supabase = createClient();
    const { error } = await supabase.from("work_items").update({ status }).eq("id", id);
    if (error) {
      setItems(previous);
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-sm text-muted-foreground">Projects, assignments, deadlines and useful links.</p>
        <h1 className="text-3xl font-semibold">Work</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Active board</CardTitle>
            <CardDescription>Filter or sort what matters right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task, subject or note" />
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <table className="w-full text-sm">
                <thead className="bg-secondary/70 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-border/70 align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">{item.subject ?? item.type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "default"}>{item.priority}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <select value={item.status} onChange={(event) => void updateStatus(item.id, event.target.value)} className="rounded-lg border border-border bg-background px-2 py-1">
                          <option value="pending">pending</option>
                          <option value="in-progress">in-progress</option>
                          <option value="completed">completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.due_date ? shortDate(item.due_date) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New work item</CardTitle>
            <CardDescription>Create tasks or projects with context and dates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="work-name">Title</Label>
              <Input id="work-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Final thesis revision" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="work-subject">Subject</Label>
                <Input id="work-subject" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Database" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work-link">Link</Label>
                <Input id="work-link" value={form.link} onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Priority }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as WorkType }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="task">Task</option>
                <option value="project">Project</option>
                <option value="deadline">Deadline</option>
              </select>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as WorkStatus }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} />
              <Input type="date" value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-details">Details</Label>
              <Textarea id="work-details" value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} placeholder="Requirements, meeting notes, blockers" />
            </div>
            <Button type="button" className="w-full" onClick={() => void submitItem()}>Save work item</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
