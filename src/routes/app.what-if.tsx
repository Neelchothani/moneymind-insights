import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Clock,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";
import { Counter, EmptyState, GlassCard, Progress, SectionTitle } from "@/components/mm/primitives";
import { useEffectiveProfile, useMoneymind } from "@/lib/mm/store";
import { CATEGORY_COLORS, inr, type Category } from "@/lib/mm/types";

export const Route = createFileRoute("/app/what-if")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — Moneymind" },
      {
        name: "description",
        content: "Simulate how changing your discretionary spending today impacts your future savings goals.",
      },
    ],
  }),
  component: WhatIfPage,
});

export function WhatIfPage() {
  const { analysis, hasData, loadDemo } = useMoneymind();
  const profile = useEffectiveProfile();

  // Categories eligible for simulation (prioritizing top spending discretionary categories)
  const currentSpendingByCategory = useMemo(() => {
    return analysis.current.byCategory;
  }, [analysis]);

  // Adjustments map: category -> new proposed monthly spend
  const [adjustedSpend, setAdjustedSpend] = useState<Record<string, number>>({});

  const baselineCategories = useMemo(() => {
    // Categories that have spending > 0, ordered by spending desc
    return Object.entries(currentSpendingByCategory)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [currentSpendingByCategory]);

  const getSpend = (cat: string, original: number) => {
    return adjustedSpend[cat] !== undefined ? adjustedSpend[cat] : original;
  };

  const handleSliderChange = (cat: string, val: number) => {
    setAdjustedSpend((prev) => ({ ...prev, [cat]: val }));
  };

  const resetAll = () => {
    setAdjustedSpend({});
  };

  // Calculations
  const currentMonthlySpend = analysis.current.spending;
  const currentMonthlySavings = Math.max(0, analysis.income - currentMonthlySpend);

  const simulatedMonthlySpend = useMemo(() => {
    let sum = 0;
    for (const [cat, orig] of Object.entries(currentSpendingByCategory)) {
      sum += adjustedSpend[cat] !== undefined ? adjustedSpend[cat] : orig;
    }
    return sum;
  }, [currentSpendingByCategory, adjustedSpend]);

  const simulatedMonthlySavings = Math.max(0, analysis.income - simulatedMonthlySpend);
  const monthlySavingsDelta = simulatedMonthlySavings - currentMonthlySavings;
  const annualSavingsDelta = monthlySavingsDelta * 12;

  // Target goal duration calculations
  const targetGoalAmount = profile.targetAmount || profile.savingsTarget * 12 || 60000;

  const currentMonthsToGoal = currentMonthlySavings > 0
    ? Math.ceil(targetGoalAmount / currentMonthlySavings)
    : 99;

  const simulatedMonthsToGoal = simulatedMonthlySavings > 0
    ? Math.ceil(targetGoalAmount / simulatedMonthlySavings)
    : 99;

  const monthsSaved = Math.max(0, currentMonthsToGoal - simulatedMonthsToGoal);

  // 12-Month Projection Chart Data
  const projectionData = useMemo(() => {
    const data = [];
    const months = ["Now", "M+1", "M+2", "M+3", "M+4", "M+5", "M+6", "M+7", "M+8", "M+9", "M+10", "M+11", "M+12"];
    let currAccum = 0;
    let simAccum = 0;

    for (let i = 0; i < months.length; i++) {
      if (i > 0) {
        currAccum += currentMonthlySavings;
        simAccum += simulatedMonthlySavings;
      }
      data.push({
        month: months[i],
        "Current Trajectory": Math.round(currAccum),
        "Simulated Trajectory": Math.round(simAccum),
      });
    }
    return data;
  }, [currentMonthlySavings, simulatedMonthlySavings]);

  if (!hasData) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState
          icon={<Wand2 className="size-6" />}
          title="What-If Simulator needs data"
          message="Load the realistic demo dataset or upload a statement to simulate behavioural shifts and goal acceleration."
          action={
            <button
              onClick={loadDemo}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
            >
              Load Demo Data
            </button>
          }
        />
      </div>
    );
  }

  // Quick preset handlers
  const applyPreset = (type: "food" | "subs" | "aggressive") => {
    if (type === "food" && currentSpendingByCategory.Food) {
      setAdjustedSpend((prev) => ({
        ...prev,
        Food: Math.round(currentSpendingByCategory.Food * 0.7),
      }));
    } else if (type === "subs" && currentSpendingByCategory.Subscriptions) {
      setAdjustedSpend((prev) => ({
        ...prev,
        Subscriptions: Math.round(currentSpendingByCategory.Subscriptions * 0.5),
      }));
    } else if (type === "aggressive") {
      setAdjustedSpend({
        Food: Math.round((currentSpendingByCategory.Food || 0) * 0.75),
        Shopping: Math.round((currentSpendingByCategory.Shopping || 0) * 0.7),
        Entertainment: Math.round((currentSpendingByCategory.Entertainment || 0) * 0.6),
        Subscriptions: Math.round((currentSpendingByCategory.Subscriptions || 0) * 0.6),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          title="What-If Simulator"
          subtitle="See how a small change today could affect your financial goal."
        />
        {Object.keys(adjustedSpend).length > 0 && (
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3.5 py-2 text-xs font-semibold hover:bg-secondary"
          >
            <RotateCcw className="size-3.5" /> Reset Sliders
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mr-1">
          Quick Simulations:
        </span>
        <button
          onClick={() => applyPreset("food")}
          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition"
        >
          🍔 Cut Food Delivery 30%
        </button>
        <button
          onClick={() => applyPreset("subs")}
          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition"
        >
          📺 Cancel 2 Subscriptions
        </button>
        <button
          onClick={() => applyPreset("aggressive")}
          className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium hover:bg-secondary transition"
        >
          ⚡ Balanced Discretionary Trim
        </button>
      </div>

      {/* Impact Scoreboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Monthly Savings</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl text-foreground">
            <Counter value={currentMonthlySavings} prefix="₹" />
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Baseline from recent statements</p>
        </GlassCard>

        <GlassCard className="p-5 border-primary/30 bg-primary/5 glow-cyan">
          <p className="text-xs uppercase tracking-wide text-primary font-semibold">Simulated Monthly Savings</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl text-[var(--success)]">
            <Counter value={simulatedMonthlySavings} prefix="₹" />
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-[var(--success)] font-medium">
            <TrendingUp className="size-3.5" />
            {monthlySavingsDelta >= 0 ? "+" : ""}
            {inr(monthlySavingsDelta)}/month difference
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Annual Extra Savings</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl text-[var(--success)]">
            <Counter value={Math.max(0, annualSavingsDelta)} prefix="₹" />
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Compounded over 12 months</p>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Goal Timeline Acceleration</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl text-primary flex items-baseline gap-1.5">
            {monthsSaved > 0 ? (
              <>
                <Counter value={monthsSaved} />
                <span className="text-base font-normal text-muted-foreground">months earlier</span>
              </>
            ) : (
              <span className="text-xl">On current pace</span>
            )}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {simulatedMonthsToGoal < 99 ? `${simulatedMonthsToGoal} mo vs ${currentMonthsToGoal} mo` : "Keep saving"}
          </p>
        </GlassCard>
      </div>

      {/* Main Interactive Grid: Sliders on Left, Visual Projection on Right */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1.7fr]">
        {/* Sliders Card */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-semibold">Adjust Category Spending</h3>
              <p className="text-xs text-muted-foreground">Drag sliders to test habit adjustments</p>
            </div>
            <Sparkles className="size-4 text-primary" />
          </div>

          <div className="mt-6 space-y-6">
            {baselineCategories.map(([cat, originalAmount]) => {
              const currentVal = getSpend(cat, originalAmount);
              const maxRange = Math.max(Math.round(originalAmount * 1.5), 1000);
              const diff = currentVal - originalAmount;
              const pctChange = Math.round((diff / originalAmount) * 100);

              return (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat as Category] || "var(--primary)" }}
                      />
                      <span className="font-medium text-foreground">{cat}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{inr(currentVal)}</span>
                      {diff !== 0 && (
                        <span
                          className={`ml-2 text-xs font-semibold ${
                            diff < 0 ? "text-[var(--success)]" : "text-[var(--warn)]"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {pctChange}% ({inr(diff)})
                        </span>
                      )}
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={maxRange}
                    step={50}
                    value={currentVal}
                    onChange={(e) => handleSliderChange(cat, Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />

                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>₹0</span>
                    <span className="text-primary/70">Original: {inr(originalAmount)}</span>
                    <span>{inr(maxRange)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 12-Month Cumulative Wealth Projection Chart */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="text-base font-semibold">12-Month Savings Trajectory</h3>
                <p className="text-xs text-muted-foreground">
                  Current Habits vs Simulated Habits Projection
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/15 border border-[var(--success)]/30 px-2.5 py-0.5 text-xs font-semibold text-[var(--success)]">
                  +{inr(annualSavingsDelta)} in 1 Year
                </span>
              </div>
            </div>

            <div className="h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="simColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="currColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(v: number) => inr(v)}
                    contentStyle={{
                      background: "oklch(0.21 0.03 250)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="Simulated Trajectory"
                    stroke="var(--chart-2)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#simColor)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Current Trajectory"
                    stroke="var(--chart-1)"
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#currColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Goal Insight Summary Card */}
          <GlassCard className="p-6 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary shrink-0">
                <Zap className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold">Goal Impact Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {monthlySavingsDelta > 0 ? (
                    <>
                      By moderating these categories, your monthly savings increase from{" "}
                      <strong className="text-foreground">{inr(currentMonthlySavings)}</strong> to{" "}
                      <strong className="text-[var(--success)]">{inr(simulatedMonthlySavings)}</strong>.{" "}
                      {monthsSaved > 0
                        ? `You reach your ${profile.goal.toLowerCase()} milestone ${monthsSaved} months sooner!`
                        : `You build a surplus cushion of ${inr(annualSavingsDelta)} every year.`}
                    </>
                  ) : (
                    "Adjust sliders on the left to see how small daily habits compound into massive financial freedom."
                  )}
                </p>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Monthly Goal Target: {inr(profile.savingsTarget)}</span>
                    <span className="font-semibold text-foreground">
                      {Math.round((simulatedMonthlySavings / profile.savingsTarget) * 100)}% Funded
                    </span>
                  </div>
                  <Progress value={(simulatedMonthlySavings / profile.savingsTarget) * 100} />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
