import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoSubjects, demoWorkItems } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WorkChecklistItem, WorkItem } from "@/lib/types";
import { shortDate } from "@/lib/utils";

type WorkDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function getWorkItem(id: string) {
  if (!hasSupabaseEnv) {
    return demoWorkItems.find((item) => item.id === id) ?? null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("work_items").select("*").eq("id", id).single();
    if (error) {
      return demoWorkItems.find((item) => item.id === id) ?? null;
    }
    return data as WorkItem;
  } catch {
    return demoWorkItems.find((item) => item.id === id) ?? null;
  }
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { id } = await params;
  const item = await getWorkItem(id);

  if (!item) {
    notFound();
  }

  const subject = demoSubjects.find((entry) => entry.id === item.subject_id || entry.name === item.subject);
  const checklist = (item.checklist ?? []) as WorkChecklistItem[];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild type="button" variant="outline">
          <Link href="/work">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to work database
          </Link>
        </Button>
        {item.link ? (
          <Button asChild type="button">
            <Link href={item.link} target="_blank" rel="noreferrer">
              Open link
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "default"}>{item.priority}</Badge>
            <Badge variant="accent">{item.type}</Badge>
            <Badge variant={item.status === "completed" ? "success" : item.status === "in-progress" ? "accent" : "default"}>{item.status}</Badge>
          </div>
          <CardTitle className="text-3xl">{item.name}</CardTitle>
          <CardDescription>{item.details ?? "No summary provided."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Subject</p>
              <p className="mt-2 text-lg font-semibold">{subject?.name ?? item.subject ?? "No relation"}</p>
              <p className="text-sm text-muted-foreground">{subject?.code ?? "No code"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Start date</p>
                <p className="mt-2 font-medium">{item.start_date ? shortDate(item.start_date) : "Not set"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Due date</p>
                <p className="mt-2 font-medium">{item.due_date ? shortDate(item.due_date) : "Not set"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(item.tags ?? []).length ? (item.tags ?? []).map((tag) => <Badge key={tag}>{tag}</Badge>) : <span className="text-sm text-muted-foreground">No tags</span>}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.notes ?? "No notes yet."}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Checklist</p>
              <div className="mt-3 space-y-2">
                {checklist.length ? checklist.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2">
                    {entry.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <span className={entry.done ? "text-sm line-through text-muted-foreground" : "text-sm"}>{entry.label}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No checklist items yet.</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
