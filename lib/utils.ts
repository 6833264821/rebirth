import { type ClassValue, clsx } from "clsx";
import { format, isSameDay, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(value);
}

export function shortDate(value: string) {
  return format(parseISO(value), "dd MMM");
}

export function isTodayDate(value: string) {
  return isSameDay(parseISO(value), new Date());
}
