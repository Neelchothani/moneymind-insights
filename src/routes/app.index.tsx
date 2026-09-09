import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Database, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import { Counter, EmptyState, GlassCard, Progress, SectionTitle, StatusPill } from "@/components/mm/primitives";
import { useEffectiveProfile, useMoneymind } from "@/lib/mm/store";
import { CATEGORY_COLORS, inr, monthLabel } from "@/lib/mm/types";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Overview — Moneymind" },
      { name: "description", content: "Your monthly income, spending, savings and behavioural snapshot at a glance." },
      { property: "og:title", content: "Overview — Moneymind" },
      { property: "og:description", content: "KPIs, spending mix, monthly trend and goal progress in one dashboard." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { hasData, analysis, transactions, loadDemo, ready, risk, recurringBills } = useMoneymind();
  const profile = useEffectiveProfile();

  if (!ready) return <div className="py-24 text-center text-sm text-muted-foreground">Loading your data…</div>;

  if (!hasData) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState
          icon={<Database className="size-6" />}
          title="No transactions yet"
          message="Load the demo dataset to see Moneymind analyse three months of realistic spending, or upload a statement of your own."
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

  const a = analysis;
  const goalPct = profile.savingsTarget ? Math.min(100, (a.savings / profile.savingsTarget) * 100) : 0;

  const pieData = a.categoryShare.map((c) => ({ name: c.category, value: Math.round(c.amount) }));
  const trend = a.months.map((m) => ({
    name: monthLabel(m.key),
    Income: Math.round(m.income),
    Spending: Math.round(m.spending),
    Savings: Math.round(m.savings),
  }));

  const spendPct = Math.round((a.current.spending / a.income) * 100);
  const snapshot = [
    { label: "Spending", value: inr(a.current.spending), status: spendPct > 85 ? "High" : spendPct > 70 ? "Watch" : "Healthy" },
    { label: "Savings", value: inr(a.savings), status: a.savings >= profile.savingsTarget ? "Healthy" : "On Track" },
    { label: "Recurring expenses", value: inr(a.recurringTotal), status: a.recurringTotal / a.income > 0.15 ? "Watch" : "Healthy" },
    {
      label: "Discretionary spending",
      value: inr(a.discretionary),
      status: a.discretionaryShare > 50 ? "High" : a.discretionaryShare > 40 ? "Watch" : "Healthy",
    },
  ];

  const recent = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title={`${greeting()}, ${profile.name}.`}
          subtitle="Here's what your money is telling you this month."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/app/risk"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
          >
            <ShieldAlert className="size-3.5" />
            Risk: {risk.riskScore}/100 ({risk.riskTier})
          </Link>
          <Link
            to="/app/what-if"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
          >
            Simulate What-If →
          </Link>
          <Link
            to="/app/health"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
          >
            Health Score
          </Link>
          <Link
            to="/app/upload"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
          >
            Upload PDF
          </Link>
          <span className="rise rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
            {monthLabel(a.current.key)} · {a.frequency} transactions
          </span>
        </div>
      </div>

      {risk.riskScore >= 50 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-300">
                Spending Risk Alert · {risk.nextWatchOut.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {risk.nextWatchOut.description}
              </p>
            </div>
          </div>
          <Link
            to="/app/risk"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30"
          >
            View Spending Risk Forecast →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Monthly income" value={a.income} delay={0} tone="text-foreground" />
        <Kpi
          label="Total spending"
          value={a.current.spending}
          delay={60}
          tone="text-[var(--warn)]"
          sub={
            a.previous
              ? `${a.current.spending >= a.previous.spending ? "+" : ""}${Math.round(
                  ((a.current.spending - a.previous.spending) / Math.max(1, a.previous.spending)) * 100,
                )}% vs last month`
              : undefined
          }
          up={a.previous ? a.current.spending > a.previous.spending : undefined}
        />
        <Kpi label="Current savings" value={a.savings} delay={120} tone="text-[var(--success)]" sub={`${Math.round(a.savingsRate)}% savings rate`} />
        <Kpi label="Savings goal" value={profile.savingsTarget} delay={180} tone="text-primary" sub={`${Math.round(goalPct)}% reached`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1.3fr]">
        <GlassCard delay={80}>
          <h3 className="text-base font-semibold">Spending overview</h3>
          <p className="text-xs text-muted-foreground">Where this month's money went</p>
          <div className="mt-2 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={95}
                  paddingAngle={3}
                  stroke="none"
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={CATEGORY_COLORS[d.name as keyof typeof CATEGORY_COLORS]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [inr(v), n]}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "var(--foreground)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard delay={140}>
          <h3 className="text-base font-semibold">Monthly trend</h3>
          <p className="text-xs text-muted-foreground">Income vs spending vs savings</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Spending" stroke="var(--chart-4)" fill="url(#gSpend)" strokeWidth={2} />
                <Line type="monotone" dataKey="Income" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Savings" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <GlassCard delay={200}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Goal progress</h3>
            <StatusPill status={goalPct >= 100 ? "Healthy" : goalPct >= 60 ? "On Track" : "Watch"} />
          </div>
          <p className="mt-4 text-3xl font-semibold">
            <Counter value={Math.max(0, a.savings)} prefix="₹" />
            <span className="text-base font-normal text-muted-foreground"> / {inr(profile.savingsTarget)}</span>
          </p>
          <Progress value={goalPct} className="mt-4" />
          <p className="mt-3 text-sm text-muted-foreground">
            {goalPct >= 100
              ? `You've cleared your monthly target with ${inr(a.savings - profile.savingsTarget)} to spare.`
              : `${inr(profile.savingsTarget - a.savings)} away from this month's target.`}
          </p>

          <div className="mt-6 space-y-3">
            {snapshot.map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-semibold">{s.value}</p>
                </div>
                <StatusPill status={s.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={260}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Recent transactions</h3>
            <Link to="/app/transactions" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.date} · {t.category}
                    {t.ml && <span className="ml-2 text-primary/80">ML Categorised</span>}
                  </p>
                </div>
                <span className={t.type === "income" ? "text-sm font-semibold text-[var(--success)]" : "text-sm font-semibold"}>
                  {t.type === "income" ? "+" : "−"}
                  {inr(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Upcoming Bills Teaser ─────────────────────────────────────── */}
      {recurringBills.length > 0 && (() => {
        const today = new Date();
        const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const upcoming7 = recurringBills
          .filter((b) => {
            const diff = Math.round((new Date(b.nextDue + "T00:00:00").getTime() - new Date(todayISO + "T00:00:00").getTime()) / 86_400_000);
            return diff >= 0 && diff <= 7;
          })
          .slice(0, 4);
        if (upcoming7.length === 0) return null;
        return (
          <GlassCard delay={320}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <h3 className="text-base font-semibold">Upcoming Bills (Next 7 Days)</h3>
              </div>
              <Link to="/app/calendar" className="text-xs font-medium text-primary hover:underline">
                View Calendar →
              </Link>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {upcoming7.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/20 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: CATEGORY_COLORS[b.category] }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.merchant}</p>
                      <p className="text-[11px] text-muted-foreground">Due {b.nextDue}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{inr(b.amount)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        );
      })()}
    </div>
  );
}

export const tooltipStyle = {
  background: "oklch(0.21 0.03 250)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--foreground)",
};

function Kpi({
  label,
  value,
  tone,
  sub,
  delay,
  up,
}: {
  label: string;
  value: number;
  tone: string;
  sub?: string;
  delay: number;
  up?: boolean;
}) {
  return (
    <GlassCard delay={delay} className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold sm:text-3xl ${tone}`}>
        <Counter value={value} prefix="₹" />
      </p>
      {sub && (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          {up === true && <TrendingUp className="size-3.5 text-[var(--warn)]" />}
          {up === false && <TrendingDown className="size-3.5 text-[var(--success)]" />}
          {sub}
        </p>
      )}
    </GlassCard>
  );
}
