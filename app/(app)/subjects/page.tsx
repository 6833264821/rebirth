"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpenText, Plus, Trash2 } from "lucide-react";
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
import type { Subject, WorkItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type FocusFilter = "all" | Subject["focus"];

type SubjectForm = {
  name: string;
  code: string;
  focus: Subject["focus"];
  color: string;
  notes_count: string;
  homework_total: string;
  homework_completed: string;
  description: string;
};

const initialForm: SubjectForm = {
  name: "",
  code: "",
  focus: "major",
  color: "bg-zinc-500",
  notes_count: "0",
  homework_total: "0",
  homework_completed: "0",
  description: ""
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(hasSupabaseEnv ? [] : demoSubjects);
  const [workItems, setWorkItems] = useState<WorkItem[]>(hasSupabaseEnv ? [] : demoWorkItems);
  const [query, setQuery] = useState("");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<SubjectForm>(initialForm);

  const hydrate = useCallback(async () => {
    if (!hasSupabaseEnv) return;

    try {
      const supabase = createClient();
      const [subjectsResponse, workResponse] = await Promise.all([
        supabase.from("subjects").select("*").order("created_at", { ascending: false }),
        supabase.from("work_items").select("*").order("created_at", { ascending: false })
      ]);

      if (subjectsResponse.error) throw subjectsResponse.error;
      if (workResponse.error) throw workResponse.error;

      if (subjectsResponse.data) {
        setSubjects(subjectsResponse.data as Subject[]);
      }
      if (workResponse.data) {
        setWorkItems(workResponse.data as WorkItem[]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load subjects");
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!selectedId) return;
    if (subjects.some((subject) => subject.id === selectedId)) return;
    setSelectedId(null);
    setForm(initialForm);
  }, [selectedId, subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesQuery = [subject.name, subject.code, subject.description ?? ""].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesFocus = focusFilter === "all" || subject.focus === focusFilter;
      return matchesQuery && matchesFocus;
    });
  }, [focusFilter, query, subjects]);

  const selectedSubject = subjects.find((subject) => subject.id === selectedId) ?? null;
  const relatedWork = useMemo(() => workItems.filter((item) => item.subject_id === selectedId || item.subject === selectedSubject?.name), [selectedId, selectedSubject?.name, workItems]);

  const resetForm = () => {
    setSelectedId(null);
    setForm(initialForm);
  };

  const pickSubject = (subject: Subject) => {
    setSelectedId(subject.id);
    setForm({
      name: subject.name,
      code: subject.code,
      focus: subject.focus,
      color: subject.color,
      notes_count: String(subject.notes_count),
      homework_total: String(subject.homework_total),
      homework_completed: String(subject.homework_completed),
      description: subject.description ?? ""
    });
  };

  const saveSubject = async () => {
    if (!form.name.trim() || !form.code.trim()) return;

    const payload = {
      name: form.name,
      code: form.code,
      focus: form.focus,
      color: form.color,
      notes_count: Number(form.notes_count || 0),
      homework_total: Number(form.homework_total || 0),
      homework_completed: Number(form.homework_completed || 0),
      description: form.description || null
    };

    if (!hasSupabaseEnv) {
      if (selectedId) {
        setSubjects((current) => current.map((item) => (item.id === selectedId ? { ...item, ...payload } : item)));
        toast.success("Subject updated");
      } else {
        setSubjects((current) => [{ id: crypto.randomUUID(), workspace_id: "demo-user", created_at: new Date().toISOString(), ...payload }, ...current]);
        toast.success("Subject created");
        resetForm();
      }
      return;
    }

    try {
      const supabase = createClient();
      const response = selectedId
        ? await supabase.from("subjects").update(payload).eq("id", selectedId).select("id").maybeSingle()
        : await supabase.from("subjects").insert(payload).select("id").single();

      if (response.error) throw response.error;
      if (selectedId && !response.data) {
        throw new Error("Subject not found or you do not have permission to update it");
      }
      toast.success(selectedId ? "Subject updated" : "Subject created");
      await hydrate();
      if (!selectedId) {
        resetForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save subject");
    }
  };

  const deleteSubject = async (id: string) => {
    const previous = subjects;
    setSubjects((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) {
      resetForm();
    }

    if (!hasSupabaseEnv) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      setSubjects(previous);
      toast.error(error instanceof Error ? error.message : "Failed to delete subject");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-sm text-muted-foreground">Notion-style subject database with progress, notes and related work.</p>
        <h1 className="text-3xl font-semibold">Subjects</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Subject database</CardTitle>
            <CardDescription>Browse by focus area and open each subject like a Notion collection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subject, code or description" />
              <select value={focusFilter} onChange={(event) => setFocusFilter(event.target.value as FocusFilter)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="all">All focus</option>
                <option value="major">Major</option>
                <option value="support">Support</option>
                <option value="life">Life</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSubjects.map((subject) => {
                const completion = subject.homework_total ? Math.round((subject.homework_completed / subject.homework_total) * 100) : 0;
                const relatedCount = workItems.filter((item) => item.subject_id === subject.id || item.subject === subject.name).length;
                return (
                  <div key={subject.id} className={cn(
                    "rounded-[1.6rem] border transition",
                    selectedId === subject.id ? "border-primary bg-secondary/60 shadow-panel" : "border-border/70 bg-background/75"
                  )}>
                    <button
                      type="button"
                      onClick={() => pickSubject(subject)}
                      className="w-full p-4 text-left hover:bg-secondary/20 rounded-[1.5rem] rounded-b-none"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className={cn("mb-3 h-1.5 w-14 rounded-full", subject.color)} />
                          <p className="font-semibold">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">{subject.code}</p>
                        </div>
                        <Badge variant={subject.focus === "major" ? "accent" : subject.focus === "support" ? "warning" : "success"}>{subject.focus}</Badge>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{subject.notes_count} notes taken</p>
                        <p>{subject.homework_completed}/{subject.homework_total} homework completed</p>
                        <p>{relatedCount} related work items</p>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                        <div className={cn("h-full rounded-full", subject.color)} style={{ width: `${completion}%` }} />
                      </div>
                    </button>

                    <div className="border-t border-border/50 px-4 py-2">
                      <Link
                        href={`/subjects/${subject.id}`}
                        className="flex items-center justify-end gap-1 text-xs text-muted-foreground transition hover:text-foreground"
                      >
                        Open page
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{selectedId ? "Edit subject" : "New subject"}</CardTitle>
                <CardDescription>Manage metadata and keep the relation with work items clear.</CardDescription>
              </div>
              {selectedId ? (
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  <Plus className="mr-1 h-4 w-4" />
                  New
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject-name">Name</Label>
                <Input id="subject-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Com Prog" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject-code">Code</Label>
                <Input id="subject-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="CP101" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select value={form.focus} onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value as Subject["focus"] }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="major">Major</option>
                <option value="support">Support</option>
                <option value="life">Life</option>
              </select>
              <select value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="bg-zinc-500">Zinc</option>
                <option value="bg-neutral-500">Neutral</option>
                <option value="bg-stone-500">Stone</option>
                <option value="bg-slate-500">Slate</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input value={form.notes_count} onChange={(event) => setForm((current) => ({ ...current, notes_count: event.target.value }))} type="number" placeholder="Notes count" />
              <Input value={form.homework_total} onChange={(event) => setForm((current) => ({ ...current, homework_total: event.target.value }))} type="number" placeholder="Homework total" />
              <Input value={form.homework_completed} onChange={(event) => setForm((current) => ({ ...current, homework_completed: event.target.value }))} type="number" placeholder="Homework done" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-description">Description</Label>
              <Textarea id="subject-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What this subject contains, key topics, notes or links." />
            </div>
            <Button type="button" className="w-full" onClick={() => void saveSubject()}>
              {selectedId ? "Update subject" : "Save subject"}
            </Button>

            {selectedSubject ? (
              <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">Related work</p>
                    <p className="text-sm text-muted-foreground">Open the matching work items as pages.</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void deleteSubject(selectedSubject.id)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
                <div className="space-y-2">
                  {relatedWork.length ? relatedWork.map((item) => (
                    <Link key={item.id} href={`/work/${item.id}`} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm transition hover:bg-secondary">
                      <span>{item.name}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )) : <p className="text-sm text-muted-foreground">No linked work items yet.</p>}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject gallery</CardTitle>
          <CardDescription>Use this like a lightweight Notion database gallery view for school and life tracks.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <BookOpenText className="h-4 w-4" />
          <span>Subjects connect directly with the Work database through the subject relation.</span>
        </CardContent>
      </Card>
    </div>
  );
}
