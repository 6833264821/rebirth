import { addDays, formatISO, set } from "date-fns";

import type { CalendarEvent, Habit, HabitLog, NotificationItem, Profile, Subject, Transaction, WorkItem } from "@/lib/types";

const userId = "demo-user";
const now = new Date();
const today = formatISO(now, { representation: "date" });

export const demoProfile: Profile = {
  id: userId,
  display_name: "Analog",
  username: "analogit",
  avatar_url: null,
  timezone: "Asia/Bangkok",
  bio: "Life system for work, routines, money and time."
};

export const demoSubjects: Subject[] = [
  {
    id: "s1",
    workspace_id: userId,
    name: "Com Prog",
    code: "CP101",
    focus: "major",
    color: "bg-sky-500",
    notes_count: 8,
    homework_total: 4,
    homework_completed: 2,
    description: "Programming foundations, lab prep and algorithm practice.",
    created_at: now.toISOString()
  },
  {
    id: "s2",
    workspace_id: userId,
    name: "Data Algo",
    code: "DA201",
    focus: "major",
    color: "bg-amber-500",
    notes_count: 5,
    homework_total: 3,
    homework_completed: 1,
    description: "Data structures, weekly exercises and quiz preparation.",
    created_at: now.toISOString()
  },
  {
    id: "s3",
    workspace_id: userId,
    name: "Friday Act",
    code: "FA110",
    focus: "support",
    color: "bg-emerald-500",
    notes_count: 2,
    homework_total: 2,
    homework_completed: 0,
    description: "Club coordination, short reflections and participation log.",
    created_at: now.toISOString()
  },
  {
    id: "s4",
    workspace_id: userId,
    name: "Intern",
    code: "IN390",
    focus: "life",
    color: "bg-rose-500",
    notes_count: 6,
    homework_total: 5,
    homework_completed: 4,
    description: "Internship progress, documents, mentor follow-ups and reporting.",
    created_at: now.toISOString()
  }
];

export const demoWorkItems: WorkItem[] = [
  {
    id: "w1",
    workspace_id: userId,
    name: "Prepare product design review",
    priority: "high",
    type: "project",
    status: "in-progress",
    details: "Finalize deck and shortlist blockers.",
    due_date: formatISO(addDays(now, 2), { representation: "date" }),
    created_at: now.toISOString(),
    subject: "Design",
    subject_id: "s4",
    link: "https://www.notion.so/",
    start_date: today,
    notes: "Need meeting agenda, reviewer checklist and product screenshots.",
    tags: ["review", "slides", "team"],
    checklist: [
      { id: "w1-c1", label: "Prepare agenda", done: true },
      { id: "w1-c2", label: "Collect screenshots", done: false },
      { id: "w1-c3", label: "Rehearse talking points", done: false }
    ]
  },
  {
    id: "w2",
    workspace_id: userId,
    name: "Submit database schema notes",
    priority: "medium",
    type: "deadline",
    status: "pending",
    details: "Align Supabase tables with dashboard widgets.",
    due_date: formatISO(addDays(now, 1), { representation: "date" }),
    created_at: now.toISOString(),
    subject: "Data Algo",
    subject_id: "s2",
    start_date: today,
    notes: "Map relations for subjects, work items and notifications.",
    tags: ["schema", "supabase"],
    checklist: [
      { id: "w2-c1", label: "Add subject relation", done: true },
      { id: "w2-c2", label: "Review RLS rules", done: false }
    ]
  },
  {
    id: "w3",
    workspace_id: userId,
    name: "Close weekly admin tasks",
    priority: "low",
    type: "task",
    status: "completed",
    details: "Archive invoices and update docs.",
    due_date: today,
    created_at: now.toISOString(),
    subject: "Intern",
    subject_id: "s4",
    start_date: today,
    notes: "Wrap up operations backlog before the weekly sync.",
    tags: ["ops", "admin"],
    checklist: [
      { id: "w3-c1", label: "Archive invoices", done: true },
      { id: "w3-c2", label: "Update internal docs", done: true }
    ]
  },
  {
    id: "w4",
    workspace_id: userId,
    name: "Weekly coding assignment",
    priority: "high",
    type: "task",
    status: "pending",
    details: "Finish recursion practice and push the repository link.",
    due_date: formatISO(addDays(now, 4), { representation: "date" }),
    created_at: now.toISOString(),
    subject: "Com Prog",
    subject_id: "s1",
    start_date: today,
    notes: "Need a cleaner README and a short demo clip.",
    tags: ["homework", "code"],
    checklist: [
      { id: "w4-c1", label: "Solve test cases", done: false },
      { id: "w4-c2", label: "Record demo", done: false }
    ]
  }
];

export const demoHabits: Habit[] = [
  { id: "h1", workspace_id: userId, name: "Wake up before 07:30", category: "health", created_at: now.toISOString(), frequency: "daily" },
  { id: "h2", workspace_id: userId, name: "Skincare", category: "care", created_at: now.toISOString(), frequency: "daily" },
  { id: "h3", workspace_id: userId, name: "Workout", category: "fitness", created_at: now.toISOString(), frequency: "daily" },
  { id: "h4", workspace_id: userId, name: "Drink 2L water", category: "health", created_at: now.toISOString(), frequency: "daily" },
  { id: "h5", workspace_id: userId, name: "Talk to partner", category: "relationship", created_at: now.toISOString(), frequency: "daily" }
];

export const demoHabitLogs: HabitLog[] = demoHabits.map((habit, index) => ({
  id: `l${index + 1}`,
  habit_id: habit.id,
  date: today,
  completed: index !== 3,
  notes: null,
  created_at: now.toISOString()
}));

export const demoTransactions: Transaction[] = [
  {
    id: "t1",
    workspace_id: userId,
    amount: 32000,
    type: "income",
    category: "Salary",
    description: "Monthly salary",
    date: today,
    created_at: now.toISOString()
  },
  {
    id: "t2",
    workspace_id: userId,
    amount: 2890,
    type: "expense",
    category: "Food",
    description: "Cafe and lunch",
    date: formatISO(addDays(now, -1), { representation: "date" }),
    created_at: now.toISOString()
  },
  {
    id: "t3",
    workspace_id: userId,
    amount: 5200,
    type: "expense",
    category: "Transport",
    description: "Flight deposit",
    date: formatISO(addDays(now, -4), { representation: "date" }),
    created_at: now.toISOString()
  }
];

export const demoNotifications: NotificationItem[] = [
  {
    id: "n1",
    user_id: userId,
    type: "task_deadline",
    title: "Deadline tomorrow",
    message: "Prepare product design review is due tomorrow.",
    read: false,
    created_at: now.toISOString()
  },
  {
    id: "n2",
    user_id: userId,
    type: "habit_reminder",
    title: "Hydration check",
    message: "You still have one health habit left today.",
    read: false,
    created_at: now.toISOString()
  }
];

export const demoCalendarEvents: CalendarEvent[] = [
  {
    id: "c1",
    title: "Design review",
    description: "Sync with team",
    starts_at: set(now, { hours: 14, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString(),
    ends_at: set(now, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString(),
    source: "internal",
    color: "sky"
  },
  {
    id: "c2",
    title: "Gym",
    description: "Leg day",
    starts_at: set(addDays(now, 1), { hours: 18, minutes: 30, seconds: 0, milliseconds: 0 }).toISOString(),
    ends_at: set(addDays(now, 1), { hours: 19, minutes: 30, seconds: 0, milliseconds: 0 }).toISOString(),
    source: "internal",
    color: "emerald"
  }
];
