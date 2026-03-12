export type Priority = "low" | "medium" | "high";
export type WorkStatus = "pending" | "in-progress" | "completed";
export type WorkType = "project" | "task" | "deadline";
export type TransactionType = "income" | "expense";

export type WorkChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type Subject = {
  id: string;
  workspace_id: string;
  name: string;
  code: string;
  focus: "major" | "support" | "life";
  color: string;
  notes_count: number;
  homework_total: number;
  homework_completed: number;
  description: string | null;
  created_at: string;
};

export type WorkItem = {
  id: string;
  workspace_id: string;
  name: string;
  priority: Priority;
  type: WorkType;
  status: WorkStatus;
  details: string | null;
  due_date: string | null;
  created_at: string;
  subject?: string | null;
  subject_id?: string | null;
  link?: string | null;
  start_date?: string | null;
  notes?: string | null;
  tags?: string[];
  checklist?: WorkChecklistItem[];
};

export type Habit = {
  id: string;
  workspace_id: string;
  name: string;
  category: string;
  created_at: string;
  frequency?: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  workspace_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  user_id: string;
  type: "task_deadline" | "habit_reminder" | "system_alert" | "share";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  timezone: string;
  bio: string | null;
};

export type CalendarEvent = {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
  source: "internal" | "google";
  google_event_id?: string | null;
  color?: string | null;
};
