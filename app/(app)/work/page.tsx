"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Plus, Rows3, SquarePen, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoSubjects, demoWorkItems } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { Priority, Subject, WorkChecklistItem, WorkItem, WorkStatus, WorkType } from "@/lib/types";
import { cn, shortDate } from "@/lib/utils";

type WorkDatabaseView = "table" | "board" | "calendar";

type WorkForm = {
  name: string;
  subject_id: string;
  priority: Priority;
  type: WorkType;
  status: WorkStatus;
  link: string;
  start_date: string;
  due_date: string;
  details: string;
  notes: string;
  tags: string;
  checklist: WorkChecklistItem[];
};

const statusColumns: WorkStatus[] = ["pending", "in-progress", "completed"];

const initialForm: WorkForm = {
  name: "",
  subject_id: "",
  priority: "medium",
  type: "task",
  status: "pending",
  link: "",
  start_date: "",
  due_date: "",
  details: "",
  notes: "",
  tags: "",
  checklist: []
};

export default function WorkPage() {
  const [items, setItems] = useState<WorkItem[]>(hasSupabaseEnv ? [] : demoWorkItems);
  const [subjects, setSubjects] = useState<Subject[]>(hasSupabaseEnv ? [] : demoSubjects);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [view, setView] = useState<WorkDatabaseView>("table");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(hasSupabaseEnv ? null : demoWorkItems[0]?.id ?? null);
  const [month, setMonth] = useState(new Date());
  const [checklistInput, setChecklistInput] = useState("");
  const [form, setForm] = useState<WorkForm>(() => {
    if (hasSupabaseEnv) return initialForm;
    const first = demoWorkItems[0];
    return first
      ? {
          name: first.name,
          subject_id: first.subject_id ?? "",
          priority: first.priority,
          type: first.type,
          status: first.status,
          link: first.link ?? "",
          start_date: first.start_date ?? "",
          due_date: first.due_date ?? "",
          details: first.details ?? "",
          notes: first.notes ?? "",
          tags: (first.tags ?? []).join(", "),
          checklist: first.checklist ?? []
        }
      : initialForm;
  });

  const hydrate = useCallback(async () => {
    if (!hasSupabaseEnv) return;

    try {
      const supabase = createClient();
      const [workResponse, subjectResponse] = await Promise.all([
        supabase.from("work_items").select("*").order("created_at", { ascending: false }),
        supabase.from("subjects").select("*").order("created_at", { ascending: false })
      ]);

      if (workResponse.error) throw workResponse.error;
      if (subjectResponse.error) throw subjectResponse.error;

      if (workResponse.data) {
        setItems(workResponse.data as WorkItem[]);
      }
      if (subjectResponse.data) {
        setSubjects(subjectResponse.data as Subject[]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load work database");
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!selectedId) return;
    if (items.some((item) => item.id === selectedId)) return;
    setSelectedId(null);
    setChecklistInput("");
    setForm(initialForm);
  }, [items, selectedId]);

  // Persist + restore view preference
  useEffect(() => {
    const saved = localStorage.getItem("work-view");
    if (saved === "table" || saved === "board" || saved === "calendar") {
      setView(saved);
    }
  }, []);

  const handleViewChange = useCallback((next: WorkDatabaseView) => {
    setView(next);
    localStorage.setItem("work-view", next);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const subjectName = subjects.find((subject) => subject.id === item.subject_id)?.name ?? item.subject ?? "";
      const matchesQuery = [item.name, item.details ?? "", item.notes ?? "", subjectName, ...(item.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
      const matchesSubject = subjectFilter === "all" || item.subject_id === subjectFilter || item.subject === subjects.find((subject) => subject.id === subjectFilter)?.name;
      return matchesQuery && matchesPriority && matchesSubject;
    });
  }, [items, priorityFilter, query, subjectFilter, subjects]);

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;

  const resetForm = () => {
    setSelectedId(null);
    setChecklistInput("");
    setForm(initialForm);
  };

  const pickItem = (item: WorkItem) => {
    setSelectedId(item.id);
    setChecklistInput("");
    setForm({
      name: item.name,
      subject_id: item.subject_id ?? subjects.find((subject) => subject.name === item.subject)?.id ?? "",
      priority: item.priority,
      type: item.type,
      status: item.status,
      link: item.link ?? "",
      start_date: item.start_date ?? "",
      due_date: item.due_date ?? "",
      details: item.details ?? "",
      notes: item.notes ?? "",
      tags: (item.tags ?? []).join(", "),
      checklist: item.checklist ?? []
    });
  };

  const saveItem = async () => {
    if (!form.name.trim()) return;

    const subject = subjects.find((item) => item.id === form.subject_id);
    const payload = {
      name: form.name,
      subject_id: form.subject_id || null,
      subject: subject?.name ?? null,
      priority: form.priority,
      type: form.type,
      status: form.status,
      link: form.link || null,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      details: form.details || null,
      notes: form.notes || null,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      checklist: form.checklist
    };

    if (!hasSupabaseEnv) {
      if (selectedId) {
        setItems((current) => current.map((item) => (item.id === selectedId ? { ...item, ...payload } : item)));
      } else {
        const nextItem: WorkItem = {
          id: crypto.randomUUID(),
          workspace_id: "demo-user",
          created_at: new Date().toISOString(),
          ...payload
        };
        setItems((current) => [nextItem, ...current]);
        setSelectedId(nextItem.id);
      }
      toast.success(selectedId ? "Work item updated" : "Work item created");
      if (!selectedId) {
        resetForm();
      }
      return;
    }

    try {
      const supabase = createClient();
      const response = selectedId
        ? await supabase.from("work_items").update(payload).eq("id", selectedId).select("id").maybeSingle()
        : await supabase.from("work_items").insert(payload).select("id").single();

      if (response.error) throw response.error;
      if (selectedId && !response.data) {
        throw new Error("Work item not found or you do not have permission to update it");
      }
      await hydrate();
      toast.success(selectedId ? "Work item updated" : "Work item created");
      if (!selectedId) {
        resetForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save work item");
    }
  };

  const updateStatus = async (id: string, status: WorkStatus) => {
    const previous = items;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    if (selectedId === id) {
      setForm((current) => ({ ...current, status }));
    }

    if (!hasSupabaseEnv) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("work_items").update({ status }).eq("id", id);
      if (error) throw error;
    } catch (error) {
      setItems(previous);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const deleteItem = async (id: string) => {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) {
      resetForm();
    }

    if (!hasSupabaseEnv) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("work_items").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      setItems(previous);
      toast.error(error instanceof Error ? error.message : "Failed to delete work item");
    }
  };

  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;
    setForm((current) => ({
      ...current,
      checklist: [...current.checklist, { id: crypto.randomUUID(), label: checklistInput.trim(), done: false }]
    }));
    setChecklistInput("");
  };

  const toggleChecklistItem = (id: string) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    }));
  };

  const removeChecklistItem = (id: string) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.filter((item) => item.id !== id)
    }));
  };

  const boardColumns = useMemo(() => {
    return statusColumns.map((status) => ({
      status,
      items: filtered.filter((item) => item.status === status)
    }));
  }, [filtered]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const workForDay = useCallback((day: Date) => {
    const target = format(day, "yyyy-MM-dd");
    return filtered.filter((item) => item.due_date === target);
  }, [filtered]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Notion-style work database with subjects, views and page-style detail.</p>
          <h1 className="text-3xl font-semibold">Work Database</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={view === "table" ? "default" : "outline"} onClick={() => handleViewChange("table")}>
            <Table2 className="mr-2 h-4 w-4" />
            Table
          </Button>
          <Button type="button" variant={view === "board" ? "default" : "outline"} onClick={() => handleViewChange("board")}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Board
          </Button>
          <Button type="button" variant={view === "calendar" ? "default" : "outline"} onClick={() => handleViewChange("calendar")}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Database views</CardTitle>
            <CardDescription>Filter, switch view, open as page, and edit inline from one source of truth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_180px]">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task, note, tag or subject" />
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="all">All subjects</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </div>

            {view === "table" ? (
              <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/70 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Due</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const subject = subjects.find((entry) => entry.id === item.subject_id)?.name ?? item.subject ?? "No subject";
                      return (
                        <tr key={item.id} className={cn("border-t border-border/70 transition hover:bg-secondary/35", selectedId === item.id && "bg-secondary/45")}>
                          <td className="px-4 py-3">
                            <button type="button" className="text-left" onClick={() => pickItem(item)}>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-muted-foreground">{item.type}</p>
                            </button>
                          </td>
                          <td className="px-4 py-3">{subject}</td>
                          <td className="px-4 py-3">
                            <select value={item.status} onChange={(event) => void updateStatus(item.id, event.target.value as WorkStatus)} className="rounded-lg border border-border bg-background px-2 py-1" onClick={(event) => event.stopPropagation()}>
                              <option value="pending">pending</option>
                              <option value="in-progress">in-progress</option>
                              <option value="completed">completed</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{item.due_date ? shortDate(item.due_date) : "-"}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button asChild type="button" variant="outline" size="sm">
                                <Link href={`/work/${item.id}`}>
                                  Open page
                                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => pickItem(item)}>
                                <SquarePen className="mr-1 h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {view === "board" ? (
              <div className="grid gap-4 xl:grid-cols-3">
                {boardColumns.map((column) => (
                  <div
                    key={column.status}
                    className={cn(
                      "rounded-[1.5rem] border bg-background/70 p-4 transition-colors",
                      draggedId ? "border-primary/40 bg-secondary/30" : "border-border/70"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggedId) return;
                      const dragged = items.find((i) => i.id === draggedId);
                      if (dragged && dragged.status !== column.status) {
                        void updateStatus(draggedId, column.status);
                      }
                      setDraggedId(null);
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{column.status}</p>
                        <p className="text-sm text-muted-foreground">{column.items.length} items</p>
                      </div>
                      <Badge variant={column.status === "completed" ? "success" : column.status === "in-progress" ? "accent" : "default"}>{column.status}</Badge>
                    </div>
                    <div className="space-y-3">
                      {column.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          draggable
                          onClick={() => pickItem(item)}
                          onDragStart={() => setDraggedId(item.id)}
                          onDragEnd={() => setDraggedId(null)}
                          className={cn(
                            "w-full rounded-2xl border p-4 text-left transition hover:border-primary/40 cursor-grab active:cursor-grabbing",
                            selectedId === item.id ? "border-primary bg-secondary/60" : "border-border/70 bg-background",
                            draggedId === item.id && "opacity-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium">{item.name}</p>
                            <Badge variant={item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "default"}>{item.priority}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{subjects.find((subject) => subject.id === item.subject_id)?.name ?? item.subject ?? "No subject"}</p>
                          <p className="mt-3 text-xs text-muted-foreground">Due {item.due_date ? shortDate(item.due_date) : "TBD"}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {view === "calendar" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="outline" size="icon" onClick={() => setMonth((current) => subMonths(current, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="font-medium">{format(month, "MMMM yyyy")}</div>
                  <Button type="button" variant="outline" size="icon" onClick={() => setMonth((current) => addMonths(current, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const dayItems = workForDay(day);
                    return (
                      <div key={day.toISOString()} className={cn("min-h-28 rounded-2xl border border-border/70 bg-background/70 p-3", !isSameMonth(day, month) && "opacity-40")}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">{format(day, "d")}</span>
                          {dayItems.length ? <Badge variant="accent">{dayItems.length}</Badge> : null}
                        </div>
                        <div className="space-y-2">
                          {dayItems.slice(0, 2).map((item) => (
                            <button key={item.id} type="button" onClick={() => pickItem(item)} className="w-full rounded-xl bg-secondary/70 px-2 py-1 text-left text-xs transition hover:bg-secondary">
                              <p className="truncate font-medium">{item.name}</p>
                              <p className="truncate text-muted-foreground">{subjects.find((subject) => subject.id === item.subject_id)?.code ?? item.subject ?? item.type}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{selectedId ? "Page properties" : "New work page"}</CardTitle>
                <CardDescription>{selectedId ? "Edit the selected work page like a Notion side panel." : "Create a new item with subject relation, notes and checklist."}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedId ? (
                  <Button asChild type="button" variant="outline" size="sm">
                    <Link href={`/work/${selectedId}`}>
                      Open page
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  <Plus className="mr-1 h-4 w-4" />
                  New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="work-name">Title</Label>
              <Input id="work-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Weekly coding assignment" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="work-subject">Subject relation</Label>
                <select id="work-subject" value={form.subject_id} onChange={(event) => setForm((current) => ({ ...current, subject_id: event.target.value }))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                  <option value="">No subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
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
              <Label htmlFor="work-details">Summary</Label>
              <Textarea id="work-details" value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} placeholder="Short summary shown in database views." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-notes">Page notes</Label>
              <Textarea id="work-notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Write notes, outline, references or progress log here." className="min-h-32" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-tags">Tags</Label>
              <Input id="work-tags" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="homework, urgent, backend" />
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">Checklist</p>
                  <p className="text-sm text-muted-foreground">Track block-by-block progress like a Notion page checklist.</p>
                </div>
                {selectedItem ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => void deleteItem(selectedItem.id)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Input value={checklistInput} onChange={(event) => setChecklistInput(event.target.value)} placeholder="New checklist item" />
                <Button type="button" onClick={addChecklistItem}>Add</Button>
              </div>
              <div className="space-y-2">
                {form.checklist.length ? form.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2">
                    <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(item.id)} className="h-4 w-4" />
                    <span className={cn("flex-1 text-sm", item.done && "text-muted-foreground line-through")}>{item.label}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeChecklistItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No checklist items yet.</p>}
              </div>
            </div>

            <Button type="button" className="w-full" onClick={() => void saveItem()}>
              {selectedId ? <SquarePen className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {selectedId ? "Update page" : "Create page"}
            </Button>

            <div className="rounded-[1.5rem] border border-border/70 bg-secondary/35 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <Rows3 className="h-4 w-4" />
                Relation note
              </div>
              Work items share the same data across table, board and calendar views. Subject relation is managed in <Link href="/subjects" className="underline underline-offset-4">Subjects</Link>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
