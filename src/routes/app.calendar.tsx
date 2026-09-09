import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { EmptyState, GlassCard, SectionTitle, StatusPill } from "@/components/mm/primitives";
import { useMoneymind } from "@/lib/mm/store";
import { buildCalendarMonth, getMonthSummary } from "@/lib/mm/calendar";
import type { RecurringBill } from "@/lib/mm/calendar";
import { CATEGORY_COLORS, inr } from "@/lib/mm/types";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({
    meta: [
      { title: "Bill Calendar — Moneymind" },
      {
        name: "description",
        content: "Visual calendar of all your recurring bills, subscriptions, and EMIs mapped to their due dates.",
      },
    ],
  }),
  component: BillCalendarPage,
});

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  bimonthly: "Every 2 mo.",
  quarterly: "Quarterly",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  due_today: { label: "Due Today", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  due_soon: { label: "Due Soon", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  overdue: { label: "Overdue", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  upcoming: { label: "Upcoming", cls: "bg-secondary text-muted-foreground border-border" },
};

// ─── Page ────────────────────────────────────────────────────────────────────

function BillCalendarPage() {
  const { recurringBills, hasData, loadDemo } = useMoneymind();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calendarMonth = useMemo(
    () => buildCalendarMonth(recurringBills, viewYear, viewMonth),
    [recurringBills, viewYear, viewMonth],
  );

  const summary = useMemo(
    () => getMonthSummary(recurringBills, viewYear, viewMonth),
    [recurringBills, viewYear, viewMonth],
  );

  // ── Navigation helpers
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(null);
  }

  // ── Month label
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ── Selected day's bills
  const selectedDayBills = useMemo(() => {
    if (!selectedDate) return [];
    for (const week of calendarMonth.weeks) {
      for (const cell of week) {
        if (cell.date === selectedDate) return cell.bills;
      }
    }
    return [];
  }, [selectedDate, calendarMonth]);

  // ── Empty state
  if (!hasData || recurringBills.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState
          icon={<CalendarDays className="size-6" />}
          title={!hasData ? "No transactions yet" : "No recurring bills detected"}
          message={
            !hasData
              ? "Load the demo dataset or upload a PDF statement. Moneymind needs at least 2 months of data to detect recurring bills."
              : "Moneymind couldn't find any expense that repeats across 2+ months with a consistent amount. Upload more months of data to see your bill calendar."
          }
          action={
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button
                onClick={loadDemo}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
              >
                Load Demo Data
              </button>
              <Link
                to="/app/upload"
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary"
              >
                Upload Statement
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <SectionTitle
        title="Recurring Bill Calendar"
        subtitle="Your committed monthly outflows mapped to their due dates."
      />

      {/* ── Summary strip ──────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Receipt className="size-4" />}
          label="Committed this month"
          value={inr(summary.totalCommitted)}
          sub={`${summary.billCount} recurring items`}
          tone="text-foreground"
        />
        <SummaryCard
          icon={<CalendarDays className="size-4" />}
          label="Biggest single bill"
          value={summary.biggestBill ? inr(summary.biggestBill.amount) : "—"}
          sub={summary.biggestBill?.merchant ?? "None detected"}
          tone="text-[var(--warn)]"
        />
        <SummaryCard
          icon={<Clock className="size-4" />}
          label="Due within 3 days"
          value={String(summary.upcomingIn3Days.length)}
          sub={summary.upcomingIn3Days.length === 0 ? "All clear this week" : summary.upcomingIn3Days.map((b) => b.merchant).join(", ")}
          tone={summary.upcomingIn3Days.length > 0 ? "text-amber-400" : "text-[var(--success)]"}
        />
        <SummaryCard
          icon={<AlertTriangle className="size-4" />}
          label="Possibly overdue"
          value={String(summary.overdueItems.length)}
          sub={summary.overdueItems.length === 0 ? "Nothing overdue" : summary.overdueItems.map((b) => b.merchant).join(", ")}
          tone={summary.overdueItems.length > 0 ? "text-destructive" : "text-[var(--success)]"}
        />
      </div>

      {/* ── Alert banners ──────────────────────────────────────────────── */}
      {summary.upcomingIn3Days.length > 0 && (
        <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p className="font-semibold text-amber-300">
              {summary.upcomingIn3Days.length} bill{summary.upcomingIn3Days.length > 1 ? "s" : ""} due in the next 3 days
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {summary.upcomingIn3Days.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: CATEGORY_COLORS[b.category] }}
                  />
                  {b.merchant} · {inr(b.amount)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {summary.overdueItems.length > 0 && (
        <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/8 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="font-semibold text-destructive">
              {summary.overdueItems.length} possibly overdue bill{summary.overdueItems.length > 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Expected in the past 7 days but no matching transaction found.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {summary.overdueItems.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive"
                >
                  {b.merchant} · {inr(b.amount)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar grid + day detail ────────────────────────────────── */}
      <GlassCard>
        {/* Month nav */}
        <div className="mb-5 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="grid size-8 place-items-center rounded-lg border border-border bg-secondary/50 transition hover:bg-secondary"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={goToday}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium transition hover:bg-secondary"
            >
              <RotateCcw className="size-3" /> Today
            </button>
            <button
              onClick={nextMonth}
              className="grid size-8 place-items-center rounded-lg border border-border bg-secondary/50 transition hover:bg-secondary"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="space-y-1">
          {calendarMonth.weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((cell) => {
                const isSelected = selectedDate === cell.date;
                const hasBills = cell.bills.length > 0;
                return (
                  <button
                    key={cell.date}
                    onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                    disabled={!hasBills && !cell.isToday}
                    className={[
                      "relative flex min-h-[72px] flex-col rounded-xl border p-1.5 text-left transition",
                      cell.isCurrentMonth ? "" : "opacity-30",
                      cell.isToday && !isSelected
                        ? "border-primary/60 bg-primary/8 ring-1 ring-primary/30"
                        : isSelected
                          ? "border-primary/80 bg-primary/15 ring-2 ring-primary/40"
                          : hasBills
                            ? "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/60 cursor-pointer"
                            : "border-border/40 bg-transparent cursor-default",
                      cell.isWeekend && !isSelected ? "bg-secondary/10" : "",
                    ].join(" ")}
                    aria-label={cell.date}
                  >
                    {/* Day number */}
                    <span
                      className={[
                        "inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold",
                        cell.isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      ].join(" ")}
                    >
                      {cell.day}
                    </span>

                    {/* Bill chips */}
                    {hasBills && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        {cell.bills.slice(0, 2).map((b) => (
                          <span
                            key={b.id}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium leading-tight"
                            style={{
                              background: `${CATEGORY_COLORS[b.category]}22`,
                              color: CATEGORY_COLORS[b.category],
                              border: `1px solid ${CATEGORY_COLORS[b.category]}44`,
                            }}
                          >
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ background: CATEGORY_COLORS[b.category] }}
                            />
                            <span className="truncate">{b.merchant.split(" ")[0]}</span>
                          </span>
                        ))}
                        {cell.bills.length > 2 && (
                          <span className="px-1 text-[10px] text-muted-foreground">
                            +{cell.bills.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Total amount badge */}
                    {hasBills && (
                      <span className="mt-auto text-[10px] font-semibold text-muted-foreground">
                        {inr(cell.totalDue)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Day detail panel */}
        {selectedDate && selectedDayBills.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                — {selectedDayBills.length} bill{selectedDayBills.length > 1 ? "s" : ""} · {inr(selectedDayBills.reduce((s, b) => s + b.amount, 0))} total
              </span>
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedDayBills.map((b) => (
                <BillDetailCard key={b.id} bill={b} />
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── Full bill list ──────────────────────────────────────────────── */}
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">All Recurring Bills</h3>
            <p className="text-xs text-muted-foreground">
              Detected from your transaction history · sorted by day of month
            </p>
          </div>
          <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
            {recurringBills.length} items · {inr(recurringBills.reduce((s, b) => s + b.amount, 0))}/mo
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {recurringBills.map((bill) => (
            <BillListRow key={bill.id} bill={bill} onDateClick={setSelectedDate} viewYear={viewYear} viewMonth={viewMonth} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
          <p className="text-sm text-muted-foreground">Total committed recurring spend</p>
          <p className="text-base font-bold text-foreground">
            {inr(recurringBills.reduce((s, b) => s + b.amount, 0))} / month
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className="glass rise rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function BillDetailCard({ bill }: { bill: RecurringBill }) {
  const sm = STATUS_META[bill.status] ?? STATUS_META.upcoming;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{bill.merchant}</p>
          <p className="text-xs text-muted-foreground">{bill.category} · {FREQ_LABELS[bill.frequency]}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sm.cls}`}
        >
          {sm.label}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xl font-bold">{inr(bill.amount)}</span>
        {bill.amountVariance > 0 ? (
          <span className="text-[10px] text-muted-foreground">~Variable ±{inr(bill.amountVariance)}</span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-[var(--success)]">
            <CheckCircle2 className="size-3" /> Fixed
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Day {bill.dayOfMonth} each month</span>
        <span>Next: {bill.nextDue}</span>
      </div>

      <Link
        to="/app/transactions"
        className="mt-1 text-center text-[11px] font-medium text-primary hover:underline"
      >
        View in Transactions →
      </Link>
    </div>
  );
}

function BillListRow({
  bill,
  onDateClick,
  viewYear,
  viewMonth,
}: {
  bill: RecurringBill;
  onDateClick: (date: string) => void;
  viewYear: number;
  viewMonth: number;
}) {
  const sm = STATUS_META[bill.status] ?? STATUS_META.upcoming;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const projectedDay = Math.min(bill.dayOfMonth, daysInMonth);
  const displayMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const projectedISO = `${displayMonth}-${String(projectedDay).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Day badge */}
      <div
        className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl border text-center"
        style={{
          borderColor: `${CATEGORY_COLORS[bill.category]}55`,
          background: `${CATEGORY_COLORS[bill.category]}12`,
        }}
      >
        <span className="text-xs font-bold" style={{ color: CATEGORY_COLORS[bill.category] }}>
          {projectedDay}
        </span>
        <span className="text-[9px] text-muted-foreground">
          {new Date(viewYear, viewMonth, 1).toLocaleString("en-US", { month: "short" })}
        </span>
      </div>

      {/* Merchant info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: CATEGORY_COLORS[bill.category] }}
          />
          <p className="truncate text-sm font-medium">{bill.merchant}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {bill.category} · {FREQ_LABELS[bill.frequency]} · {bill.occurrences} occurrences seen
        </p>
      </div>

      {/* Amount + status */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-bold">{inr(bill.amount)}</span>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sm.cls}`}
        >
          {sm.label}
        </span>
      </div>

      {/* Jump to date on calendar */}
      <button
        onClick={() => onDateClick(projectedISO)}
        className="ml-1 shrink-0 text-[10px] font-medium text-primary/70 hover:text-primary"
        title="Jump to this date on the calendar"
      >
        ↑ Jump
      </button>
    </div>
  );
}
