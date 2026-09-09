/**
 * calendar.ts — Recurring Bill Calendar Engine
 *
 * Pure TypeScript. No React. No side effects.
 * Reads Transaction[] -> produces RecurringBill[] and CalendarMonth grids.
 */

import type { Category, Transaction } from "./types";

// --- Public Types -----------------------------------------------------------

export type RecurringFrequency = "weekly" | "monthly" | "bimonthly" | "quarterly";

export type BillStatus = "due_today" | "due_soon" | "upcoming" | "overdue";

export type RecurringBill = {
  id: string;
  merchant: string;
  category: Category;
  amount: number;
  amountVariance: number;
  dayOfMonth: number;
  frequency: RecurringFrequency;
  lastSeen: string;
  nextDue: string;
  occurrences: number;
  status: BillStatus;
  seenDates: string[];
};

export type CalendarCell = {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  bills: RecurringBill[];
  totalDue: number;
};

export type CalendarMonth = {
  year: number;
  month: number;
  weeks: CalendarCell[][];
  totalCommitted: number;
  billCount: number;
};

export type MonthSummary = {
  totalCommitted: number;
  billCount: number;
  biggestBill: RecurringBill | null;
  upcomingIn3Days: RecurringBill[];
  overdueItems: RecurringBill[];
};

// --- Internal Helpers -------------------------------------------------------

function toISO(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function parseISO(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function daysDiff(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

function modal(arr: number[]): number {
  const freq = new Map<number, number>();
  for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
  let best = arr[0];
  let bestCount = 0;
  for (const [v, c] of freq) {
    if (c > bestCount) {
      bestCount = c;
      best = v;
    }
  }
  return best;
}

function stableId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return "bill_" + Math.abs(h).toString(36);
}

function detectFrequency(sortedDates: string[]): RecurringFrequency {
  if (sortedDates.length < 2) return "monthly";
  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    gaps.push(daysDiff(sortedDates[i - 1], sortedDates[i]));
  }
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avgGap <= 14) return "weekly";
  if (avgGap <= 50) return "monthly";
  if (avgGap <= 80) return "bimonthly";
  return "quarterly";
}

function projectNextDue(lastSeen: string, dayOfMonth: number, frequency: RecurringFrequency): string {
  const last = parseISO(lastSeen);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (frequency === "weekly") {
    const candidate = new Date(last);
    candidate.setDate(candidate.getDate() + 7);
    while (candidate < today) candidate.setDate(candidate.getDate() + 7);
    return toISO(candidate);
  }

  const freqMonths: Record<RecurringFrequency, number> = {
    weekly: 0,
    monthly: 1,
    bimonthly: 2,
    quarterly: 3,
  };

  const step = freqMonths[frequency];
  let candidate = new Date(last.getFullYear(), last.getMonth() + step, 1);
  let dims = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
  candidate.setDate(Math.min(dayOfMonth, dims));

  while (candidate <= today) {
    candidate = new Date(candidate.getFullYear(), candidate.getMonth() + step, 1);
    dims = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    candidate.setDate(Math.min(dayOfMonth, dims));
  }

  return toISO(candidate);
}

function todayISO(): string {
  return toISO(new Date());
}

// --- Public API -------------------------------------------------------------

export function detectRecurringBills(transactions: Transaction[]): RecurringBill[] {
  const today = todayISO();

  const byMerchant = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (!["Bills", "Subscriptions", "Education"].includes(t.category)) continue;
    const key = t.merchant.toLowerCase().trim();
    const existing = byMerchant.get(key) ?? [];
    existing.push(t);
    byMerchant.set(key, existing);
  }

  const bills: RecurringBill[] = [];

  for (const [, list] of byMerchant) {
    const monthsSeen = new Set(list.map((t) => t.date.slice(0, 7)));
    if (monthsSeen.size < 2) continue;

    const amounts = list.map((t) => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxAmt = Math.max(...amounts);
    const minAmt = Math.min(...amounts);
    const variance = maxAmt - minAmt;

    if (variance > Math.max(150, avg * 0.25)) continue;

    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
    const sortedDates = sorted.map((t) => t.date);
    const daysOfMonth = sorted.map((t) => Number(t.date.split("-")[2]));
    const dayOfMonth = modal(daysOfMonth);
    const modalAmount = modal(amounts.map(Math.round));
    const frequency = detectFrequency(sortedDates);
    const lastSeen = sortedDates[sortedDates.length - 1];
    const nextDue = projectNextDue(lastSeen, dayOfMonth, frequency);

    const daysUntilDue = daysDiff(today, nextDue);
    let status: BillStatus;
    if (daysUntilDue === 0) status = "due_today";
    else if (daysUntilDue > 0 && daysUntilDue <= 3) status = "due_soon";
    else if (daysUntilDue < 0 && daysUntilDue >= -7) status = "overdue";
    else status = "upcoming";

    bills.push({
      id: stableId(list[0].merchant.toLowerCase()),
      merchant: list[0].merchant,
      category: list[0].category,
      amount: modalAmount,
      amountVariance: Math.round(variance),
      dayOfMonth,
      frequency,
      lastSeen,
      nextDue,
      occurrences: list.length,
      status,
      seenDates: sortedDates,
    });
  }

  bills.sort((a, b) => a.dayOfMonth - b.dayOfMonth || b.amount - a.amount);
  return bills;
}

export function buildCalendarMonth(bills: RecurringBill[], year: number, month: number): CalendarMonth {
  const today = todayISO();
  const firstOfMonth = new Date(year, month, 1);
  const rawDow = firstOfMonth.getDay();
  const startDow = rawDow === 0 ? 6 : rawDow - 1; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const displayMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

  const cells: CalendarCell[] = [];

  // Previous month overflow
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(year, month - 1, day);
    const iso = toISO(d);
    cells.push({
      date: iso,
      day,
      isCurrentMonth: false,
      isToday: iso === today,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      bills: [],
      totalDue: 0,
    });
  }

  // Current month days — project each bill's occurrence into this month
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const iso = toISO(d);
    const projDay = String(day).padStart(2, "0");

    const dayBills = bills.filter((b) => {
      const projectedDay = Math.min(b.dayOfMonth, daysInMonth);
      const projectedISO = `${displayMonth}-${String(projectedDay).padStart(2, "0")}`;
      return projectedISO === iso;
    });

    void projDay; // suppress unused warning

    const totalDue = dayBills.reduce((sum, b) => sum + b.amount, 0);
    cells.push({
      date: iso,
      day,
      isCurrentMonth: true,
      isToday: iso === today,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      bills: dayBills,
      totalDue,
    });
  }

  // Next month overflow to fill 42 cells
  let nextDay = 1;
  while (cells.length < 42) {
    const d = new Date(year, month + 1, nextDay);
    const iso = toISO(d);
    cells.push({
      date: iso,
      day: nextDay,
      isCurrentMonth: false,
      isToday: iso === today,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      bills: [],
      totalDue: 0,
    });
    nextDay++;
  }

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  return {
    year,
    month,
    weeks,
    totalCommitted: bills.reduce((s, b) => s + b.amount, 0),
    billCount: bills.length,
  };
}

export function getMonthSummary(bills: RecurringBill[], year: number, month: number): MonthSummary {
  const today = todayISO();
  const todayDate = parseISO(today);
  const in3Days = new Date(todayDate);
  in3Days.setDate(in3Days.getDate() + 3);

  const upcomingIn3Days = bills.filter((b) => {
    const d = daysDiff(today, b.nextDue);
    return d >= 0 && d <= 3;
  });

  const overdueItems = bills.filter((b) => b.status === "overdue");

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthBills = bills.filter((b) => {
    const projectedDay = Math.min(b.dayOfMonth, daysInMonth);
    return projectedDay >= 1 && projectedDay <= daysInMonth;
  });

  const biggestBill = monthBills.length
    ? monthBills.reduce((max, b) => (b.amount > max.amount ? b : max), monthBills[0])
    : null;

  return {
    totalCommitted: bills.reduce((s, b) => s + b.amount, 0),
    billCount: bills.length,
    biggestBill,
    upcomingIn3Days,
    overdueItems,
  };
}
