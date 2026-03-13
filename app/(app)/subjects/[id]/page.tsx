import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpenText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoSubjects, demoWorkItems } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Subject, WorkItem } from "@/lib/types";
import { cn, shortDate } from "@/lib/utils";

type SubjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function getSubjectData(id: string): Promise<{ subject: Subject | null; workItems: WorkItem[] }> {
  if (hasSupabaseEnv) {
    try {
      const supabase = await createServerSupabaseClient();
      const [subjectRes, workRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", id).single(),
        supabase.from("work_items").select("*").eq("subject_id", id).order("created_at", { ascending: false })
      ]);

      if (!subjectRes.error && subjectRes.data) {
        return {
          subject: subjectRes.data as Subject,
          workItems: (workRes.data ?? []) as WorkItem[]
        };
      }
    } catch {
      // fall through to demo data
    }
  }

  const subject = demoSubjects.find((s) => s.id === id) ?? null;
  const workItems = subject
    ? demoWorkItems.filter((item) => item.subject_id === id || item.subject === subject.name)
    : [];
  return { subject, workItems };
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { id } = await params;
  const { subject, workItems } = await getSubjectData(id);

  if (!subject) {
    notFound();
  }

  const completion = subject.homework_total
    ? Math.round((subject.homework_completed / subject.homework_total) * 100)
    : 0;

  const statusOrder: Record<string, number> = { "in-progress": 0, pending: 1, completed: 2 };
  const sortedWork = [...workItems].sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild type="button" variant="outline">
          <Link href="/subjects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to subjects
          </Link>
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="/work">
            <BookOpenText className="mr-2 h-4 w-4" />
            Work database
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={cn("h-3 w-12 rounded-full", subject.color)} />
            <Badge variant={subject.focus === "major" ? "accent" : subject.focus === "support" ? "warning" : "success"}>
              {subject.focus}
            </Badge>
          </div>
          <CardTitle className="text-3xl">{subject.name}</CardTitle>
          <CardDescription className="text-base">{subject.code}</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Left panel: metadata */}
          <div className="space-y-5 rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{subject.description ?? "No description provided."}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Homework progress</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{subject.homework_completed} / {subject.homework_total} completed</span>
                  <span className="font-semibold">{completion}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full transition-all", subject.color)}
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notes taken</p>
                <p className="mt-2 text-3xl font-bold">{subject.notes_count}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Related work items</p>
                <p className="mt-2 text-3xl font-bold">{workItems.length}</p>
              </div>
            </div>
          </div>

          {/* Right panel: related work */}
          <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Related work</p>
              <p className="mt-1 text-sm text-muted-foreground">All work items linked to this subject.</p>
            </div>

            <div className="space-y-2">
              {sortedWork.length ? sortedWork.map((item) => (
                <Link
                  key={item.id}
                  href={`/work/${item.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm transition hover:bg-secondary"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{item.status}</span>
                      <span>·</span>
                      <span>{item.due_date ? shortDate(item.due_date) : "No due date"}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              )) : (
                <p className="text-sm text-muted-foreground">No linked work items yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
