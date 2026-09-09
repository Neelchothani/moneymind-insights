/**
 * reminders.ts — Balance & Bill Reminder Engine
 *
 * Computes actionable financial reminders from transaction data,
 * recurring bills, and the user profile. Pure TypeScript — no React.
 */

import type { Profile, Transaction } from "./types";
import type { RecurringBill } from "./calendar";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReminderSeverity = "critical" | "warning" | "info";

export type Reminder = {
  id: string;
  severity: ReminderSeverity;
  title: string;
  message: string;
  /** Short label shown on the persistent banner chip */
  chip: string;
  /** ISO date this reminder was generated */
  generatedAt: string;
  /** Optional link destination inside the app */
  linkTo?: string;
  linkLabel?: string;
};

export type ReminderReport = {
  reminders: Reminder[];
  hasAny: boolean;
  hasCritical: boolean;
  hasWarning: boolean;
  /** Current month remaining balance (income - spending so far) */
  remainingBalance: number;
  /** Total due for rest of this month from recurring bills */
  upcomingBillsThisMonth: number;
  /** Effective minimum balance threshold */
  minBalance: number;
  /** Headroom = remainingBalance - upcomingBillsThisMonth - minBalance */
  headroom: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function thisMonthPrefix(): string {
  return todayISO().slice(0, 7);
}

function inr(n: number): string {
  return "Rs." + Math.round(Math.abs(n)).toLocaleString("en-IN");
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

/**
 * computeReminders
 *
 * Evaluates three categories of reminders:
 * 1. Minimum balance not maintained
 * 2. Balance insufficient to cover upcoming bills this month
 * 3. Individual bills due within 3 days
 */
export function computeReminders(
  transactions: Transaction[],
  recurringBills: RecurringBill[],
  profile: Profile | null,
): ReminderReport {
  const today = todayISO();
  const monthPrefix = thisMonthPrefix();

  // Effective minimum balance: from profile, or default Rs.1000
  const minBalance = profile?.minBalance ?? 1000;

  // Current month income and spending
  const monthTxns = transactions.filter((t) => t.date.startsWith(monthPrefix));
  const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const spending = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const remainingBalance = Math.max(0, income - spending);

  // Upcoming bills that are still due for the rest of this month
  const upcomingBillsThisMonth = recurringBills
    .filter((b) => b.nextDue >= today && b.nextDue.startsWith(monthPrefix))
    .reduce((s, b) => s + b.amount, 0);

  // Bills due within the next 3 days
  const billsDueIn3Days = recurringBills.filter((b) => {
    const diff = Math.round(
      (new Date(b.nextDue + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86_400_000,
    );
    return diff >= 0 && diff <= 3;
  });

  // Overdue bills
  const overdueBills = recurringBills.filter((b) => b.status === "overdue");

  // Headroom after covering bills + keeping min balance
  const headroom = remainingBalance - upcomingBillsThisMonth - minBalance;

  const reminders: Reminder[] = [];

  // ── 1. CRITICAL: Balance below minimum threshold ──────────────────────────
  if (remainingBalance < minBalance) {
    reminders.push({
      id: "min_balance_breach",
      severity: "critical",
      chip: "Min Balance",
      title: "Minimum Balance Not Maintained",
      message: `Your current monthly balance is ${inr(remainingBalance)}, which is below your minimum threshold of ${inr(minBalance)}. This may affect your ability to cover essential expenses and recurring dues.`,
      generatedAt: today,
      linkTo: "/app/health",
      linkLabel: "View Financial Health",
    });
  }

  // ── 2. CRITICAL: Balance cannot cover remaining bills this month ──────────
  if (upcomingBillsThisMonth > 0 && remainingBalance < upcomingBillsThisMonth) {
    const shortfall = upcomingBillsThisMonth - remainingBalance;
    reminders.push({
      id: "bills_shortfall",
      severity: "critical",
      chip: "Bills Shortfall",
      title: "Insufficient Balance for Monthly Bills",
      message: `You have ${inr(upcomingBillsThisMonth)} in bills due this month but only ${inr(remainingBalance)} remaining. You are short by ${inr(shortfall)}. Review your calendar and plan accordingly.`,
      generatedAt: today,
      linkTo: "/app/calendar",
      linkLabel: "Open Bill Calendar",
    });
  }

  // ── 3. WARNING: Low headroom (can cover bills, but nothing left after) ────
  if (headroom >= 0 && headroom < minBalance && upcomingBillsThisMonth > 0) {
    reminders.push({
      id: "low_headroom",
      severity: "warning",
      chip: "Low Headroom",
      title: "Very Little Left After Bills",
      message: `After paying your upcoming bills (${inr(upcomingBillsThisMonth)}) and maintaining your minimum balance (${inr(minBalance)}), only ${inr(headroom)} remains. Avoid non-essential spending this month.`,
      generatedAt: today,
      linkTo: "/app/what-if",
      linkLabel: "Simulate Savings",
    });
  }

  // ── 4. WARNING: Overdue bills detected ───────────────────────────────────
  if (overdueBills.length > 0) {
    const names = overdueBills.map((b) => b.merchant).join(", ");
    const total = overdueBills.reduce((s, b) => s + b.amount, 0);
    reminders.push({
      id: "overdue_bills",
      severity: "warning",
      chip: "Overdue",
      title: `${overdueBills.length} Bill${overdueBills.length > 1 ? "s" : ""} Possibly Overdue`,
      message: `${names} (total ${inr(total)}) were expected in the past 7 days but no matching payment was found. Check your account to confirm they were settled.`,
      generatedAt: today,
      linkTo: "/app/calendar",
      linkLabel: "View Calendar",
    });
  }

  // ── 5. INFO: Bills due in next 3 days ─────────────────────────────────────
  for (const bill of billsDueIn3Days) {
    const diff = Math.round(
      (new Date(bill.nextDue + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86_400_000,
    );
    const when = diff === 0 ? "today" : diff === 1 ? "tomorrow" : `in ${diff} days`;
    reminders.push({
      id: `due_soon_${bill.id}`,
      severity: "info",
      chip: "Due Soon",
      title: `${bill.merchant} due ${when}`,
      message: `${inr(bill.amount)} auto-pay scheduled for ${bill.nextDue}. Ensure you have sufficient balance before this date.`,
      generatedAt: today,
      linkTo: "/app/calendar",
      linkLabel: "View Calendar",
    });
  }

  // Sort: critical first, then warning, then info
  const ORDER: Record<ReminderSeverity, number> = { critical: 0, warning: 1, info: 2 };
  reminders.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  return {
    reminders,
    hasAny: reminders.length > 0,
    hasCritical: reminders.some((r) => r.severity === "critical"),
    hasWarning: reminders.some((r) => r.severity === "warning"),
    remainingBalance,
    upcomingBillsThisMonth,
    minBalance,
    headroom,
  };
}
