import { addMonths, endOfMonth, startOfMonth } from "date-fns";

import type { CalendarEvent } from "@/lib/types";

export async function fetchGoogleCalendarEvents(token: string, month: Date) {
  const timeMin = startOfMonth(month).toISOString();
  const timeMax = endOfMonth(addMonths(month, 0)).toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load Google Calendar events");
  }

  const payload = await response.json();

  return (payload.items ?? []).map((item: Record<string, unknown>) => ({
    id: `google-${String(item.id)}`,
    title: String(item.summary ?? "Untitled event"),
    description: item.description ? String(item.description) : null,
    starts_at: String((item.start as { dateTime?: string; date?: string })?.dateTime ?? (item.start as { date?: string })?.date),
    ends_at: String((item.end as { dateTime?: string; date?: string })?.dateTime ?? (item.end as { date?: string })?.date),
    source: "google",
    google_event_id: String(item.id),
    color: item.colorId ? "amber" : "slate"
  })) as CalendarEvent[];
}

export async function createGoogleCalendarEvent(token: string, event: { title: string; description?: string; starts_at: string; ends_at: string; }) {
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: event.title,
      description: event.description,
      start: { dateTime: event.starts_at },
      end: { dateTime: event.ends_at }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to create Google Calendar event");
  }

  return response.json();
}

export async function updateGoogleCalendarEvent(
  token: string,
  googleEventId: string,
  event: { title: string; description?: string; starts_at: string; ends_at: string; }
) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: event.title,
      description: event.description,
      start: { dateTime: event.starts_at },
      end: { dateTime: event.ends_at }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to update Google Calendar event");
  }

  return response.json();
}
