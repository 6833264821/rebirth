"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoCalendarEvents } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createGoogleCalendarEvent, fetchGoogleCalendarEvents, updateGoogleCalendarEvent } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialForm = {
  id: "",
  title: "",
  description: "",
  starts_at: "",
  ends_at: ""
};

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(demoCalendarEvents);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const loadEvents = async (targetMonth = month) => {
    setLoading(true);

    try {
      let internalEvents: CalendarEvent[] = demoCalendarEvents;
      let googleEvents: CalendarEvent[] = [];

      if (hasSupabaseEnv) {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.provider_token ?? null;
        setProviderToken(token);

        const start = startOfMonth(targetMonth).toISOString();
        const end = endOfMonth(targetMonth).toISOString();
        const { data } = await supabase
          .from("calendar_events")
          .select("*")
          .gte("starts_at", start)
          .lte("starts_at", end)
          .order("starts_at", { ascending: true });

        if (data) {
          internalEvents = data as CalendarEvent[];
        }

        if (token) {
          googleEvents = await fetchGoogleCalendarEvents(token, targetMonth);
        }
      }

      setEvents([...internalEvents, ...googleEvents]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents(month);
  }, [month]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const eventsByDay = useMemo(() => {
    return days.map((day) => ({
      day,
      items: events.filter((event) => format(new Date(event.starts_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
    }));
  }, [days, events]);

  const submitEvent = async () => {
    if (!form.title || !form.starts_at || !form.ends_at) return;

    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        source: "internal" as const
      };

      if (!hasSupabaseEnv) {
        setEvents((current) => {
          if (form.id) {
            return current.map((item) => (item.id === form.id ? { ...item, ...payload } : item));
          }
          return [...current, { id: crypto.randomUUID(), ...payload }];
        });
      } else {
        const supabase = createClient();
        const googlePayload = {
          title: payload.title,
          description: payload.description ?? undefined,
          starts_at: payload.starts_at,
          ends_at: payload.ends_at
        };

        if (form.id) {
          const current = events.find((item) => item.id === form.id);
          if (current?.source === "google" && providerToken && current.google_event_id) {
            await updateGoogleCalendarEvent(providerToken, current.google_event_id, googlePayload);
          } else {
            const { error } = await supabase.from("calendar_events").update(payload).eq("id", form.id);
            if (error) throw error;
          }
        } else {
          const { data, error } = await supabase.from("calendar_events").insert(payload).select().single();
          if (error) throw error;
          if (providerToken) {
            const googleEvent = await createGoogleCalendarEvent(providerToken, googlePayload);
            await supabase.from("calendar_events").update({ google_event_id: googleEvent.id }).eq("id", data.id);
          }
        }
        await loadEvents(month);
      }

      setForm(initialForm);
      toast.success("Calendar updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save event");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Large calendar with editable internal events and Google sync.</p>
          <h1 className="text-3xl font-semibold">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => setMonth((current) => subMonths(current, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-44 text-center text-sm font-medium">{format(month, "MMMM yyyy")}</div>
          <Button type="button" variant="outline" size="icon" onClick={() => setMonth((current) => addMonths(current, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Month view</CardTitle>
            <CardDescription>{loading ? "Syncing events..." : providerToken ? "Google Calendar connected" : "Internal calendar only"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {eventsByDay.map(({ day, items }) => (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    const first = items[0];
                    if (!first) {
                      setForm({ ...initialForm, starts_at: `${format(day, "yyyy-MM-dd")}T09:00`, ends_at: `${format(day, "yyyy-MM-dd")}T10:00` });
                      return;
                    }
                    setForm({
                      id: first.id,
                      title: first.title,
                      description: first.description ?? "",
                      starts_at: format(new Date(first.starts_at), "yyyy-MM-dd'T'HH:mm"),
                      ends_at: format(new Date(first.ends_at), "yyyy-MM-dd'T'HH:mm")
                    });
                  }}
                  className={cn(
                    "min-h-32 rounded-2xl border border-border/70 bg-background/70 p-3 text-left transition hover:border-primary/40",
                    !isSameMonth(day, month) && "opacity-45"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{format(day, "d")}</span>
                    {items.length ? <Badge variant="accent">{items.length}</Badge> : null}
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 3).map((event) => (
                      <div key={event.id} className="rounded-xl bg-secondary/70 px-2 py-1 text-xs">
                        <p className="truncate font-medium">{event.title}</p>
                        <p className="truncate text-muted-foreground">{format(new Date(event.starts_at), "HH:mm")}</p>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{form.id ? "Edit event" : "Create event"}</CardTitle>
            <CardDescription>{providerToken ? "New internal events will also push to Google Calendar." : "Connect Google to enable sync."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cal-title">Title</Label>
              <Input id="cal-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Project sync" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-start">Start</Label>
              <Input id="cal-start" type="datetime-local" value={form.starts_at} onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-end">End</Label>
              <Input id="cal-end" type="datetime-local" value={form.ends_at} onChange={(event) => setForm((current) => ({ ...current, ends_at: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-desc">Description</Label>
              <Textarea id="cal-desc" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Meeting notes, location, reminders" />
            </div>
            <Button type="button" className="w-full" onClick={() => void submitEvent()}>
              {form.id ? "Update event" : "Save event"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
