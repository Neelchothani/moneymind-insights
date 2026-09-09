import type { Analysis } from "./analysis";
import { categoryDelta } from "./analysis";
import { inr, type Profile } from "./types";

export type Priority = "High Impact" | "Medium Impact" | "Positive" | "Watch";

export type Insight = {
  id: string;
  title: string;
  what: string;
  why: string;
  action: string;
  impact: number; // potential monthly saving in rupees
  priority: Priority;
  evidence: string[];
};

export function generateInsights(a: Analysis, p: Profile): Insight[] {
  const out: Insight[] = [];
  const cur = a.current;

  // 1. Food delivery trend
  const food = categoryDelta(a, "Food");
  if (food && food.pct >= 10) {
    const perOrder = a.frequency ? cur.byCategory.Food / Math.max(1, countFood(a)) : 0;
    const saving = Math.round(Math.min(cur.byCategory.Food * 0.3, perOrder * 8));
    out.push({
      id: "food-trend",
      title: "Food delivery is trending upward",
      what: `Your food spending increased by ${Math.round(food.pct)}% this month (${inr(cur.byCategory.Food)} vs ${inr(a.previous!.byCategory.Food)}).`,
      why: `You placed ${countFood(a)} food orders this month compared with ${countFoodPrev(a)} last month, at an average of ${inr(perOrder)} per order.`,
      action: `Cutting 2 delivery orders per week could save roughly ${inr(saving)} per month without touching your groceries.`,
      impact: saving,
      priority: "High Impact",
      evidence: [
        `Current month Food total: ${inr(cur.byCategory.Food)}`,
        `Previous month Food total: ${inr(a.previous!.byCategory.Food)}`,
        `Average order value: ${inr(perOrder)}`,
      ],
    });
  }

  // 2. Subscriptions
  const subs = a.recurring.filter((r) => r.amount <= 1200);
  if (cur.byCategory.Subscriptions > 0) {
    const saving = Math.round(cur.byCategory.Subscriptions * 0.4);
    out.push({
      id: "subs",
      title: "Recurring subscriptions are stacking up",
      what: `You have ${subs.length} recurring payments costing about ${inr(a.recurringTotal)} every month.`,
      why: `Subscriptions alone add up to ${inr(cur.byCategory.Subscriptions)} this month — ${Math.round((cur.byCategory.Subscriptions / a.income) * 100)}% of your income, charged automatically.`,
      action: `Reviewing one or two you rarely use could free about ${inr(saving)} per month.`,
      impact: saving,
      priority: "Medium Impact",
      evidence: subs.slice(0, 5).map((s) => `${s.merchant} — ${inr(s.amount)} × ${s.count} months`),
    });
  }

  // 3. Weekend behaviour
  if (a.weekendShare > 28) {
    const saving = Math.round(a.weekend * 0.2);
    out.push({
      id: "weekend",
      title: "Weekends carry most of your discretionary spend",
      what: `${Math.round(a.weekendShare)}% of this month's spending happened on weekends (${inr(a.weekend)}).`,
      why: `Weekend days are only ~29% of the month, so your spending is concentrated on Saturday and Sunday.`,
      action: `Setting a weekend budget of ${inr(a.weekend * 0.8)} could save around ${inr(saving)} a month.`,
      impact: saving,
      priority: "Watch",
      evidence: [`Weekend spend: ${inr(a.weekend)}`, `Weekday spend: ${inr(a.weekday)}`],
    });
  }

  // 4. Discretionary share
  if (a.discretionaryShare > 45) {
    const saving = Math.round(a.discretionary * 0.15);
    out.push({
      id: "disc",
      title: "Discretionary spending is above half your outflow",
      what: `${Math.round(a.discretionaryShare)}% of your spending is discretionary (${inr(a.discretionary)}).`,
      why: `Food, Shopping, Entertainment and Subscriptions together outweigh your essential spending this month.`,
      action: `Trimming discretionary categories by 15% would add about ${inr(saving)} to your savings each month.`,
      impact: saving,
      priority: "High Impact",
      evidence: a.categoryShare.slice(0, 4).map((c) => `${c.category}: ${inr(c.amount)} (${Math.round(c.pctOfSpend)}% of spend)`),
    });
  }

  // 5. Shopping spike
  const shop = categoryDelta(a, "Shopping");
  if (shop && shop.pct >= 25) {
    out.push({
      id: "shopping",
      title: "Shopping spiked this month",
      what: `Shopping rose ${Math.round(shop.pct)}% (${inr(shop.delta)} more than last month).`,
      why: `A few larger one-off purchases pushed this category above its usual level.`,
      action: `If these were one-off buys, keeping next month flat protects ${inr(shop.delta)} of savings.`,
      impact: Math.round(shop.delta),
      priority: "Medium Impact",
      evidence: [`This month: ${inr(cur.byCategory.Shopping)}`, `Last month: ${inr(a.previous!.byCategory.Shopping)}`],
    });
  }

  // 6. Goal status
  const gap = p.savingsTarget - a.savings;
  if (gap <= 0) {
    out.push({
      id: "goal-ok",
      title: "You're on track with your savings goal",
      what: `You saved ${inr(a.savings)} this month against a target of ${inr(p.savingsTarget)}.`,
      why: `Your spending stayed at ${Math.round((cur.spending / a.income) * 100)}% of income, leaving a healthy buffer.`,
      action: `Keep the same pattern next month, or move the surplus of ${inr(-gap)} into your emergency fund.`,
      impact: 0,
      priority: "Positive",
      evidence: [`Income: ${inr(a.income)}`, `Spending: ${inr(cur.spending)}`, `Savings rate: ${Math.round(a.savingsRate)}%`],
    });
  } else {
    out.push({
      id: "goal-gap",
      title: `You're ${inr(gap)} short of your monthly savings goal`,
      what: `You saved ${inr(a.savings)} this month against a target of ${inr(p.savingsTarget)}.`,
      why: `Spending reached ${inr(cur.spending)} across ${a.frequency} transactions, averaging ${inr(a.avgTransaction)} each.`,
      action: `Closing the gap needs about ${inr(gap / 30)} less per day — roughly one delivery order every two days.`,
      impact: Math.round(gap),
      priority: "High Impact",
      evidence: [
        `Target: ${inr(p.savingsTarget)}`,
        `Actual savings: ${inr(a.savings)}`,
        `Top category: ${a.topCategories[0]?.category ?? "-"}`,
      ],
    });
  }

  // 7. Stable essentials — positive
  const groc = categoryDelta(a, "Groceries");
  if (groc && Math.abs(groc.pct) < 12) {
    out.push({
      id: "groceries-stable",
      title: "Your essentials are well controlled",
      what: `Groceries stayed steady at ${inr(cur.byCategory.Groceries)} (${groc.pct >= 0 ? "+" : ""}${Math.round(groc.pct)}%).`,
      why: `Consistent essential spending is a strong signal of budgeting discipline.`,
      action: `No change needed here — focus your effort on discretionary categories instead.`,
      impact: 0,
      priority: "Positive",
      evidence: [`This month: ${inr(cur.byCategory.Groceries)}`, `Last month: ${inr(a.previous!.byCategory.Groceries)}`],
    });
  }

  const order: Priority[] = ["High Impact", "Medium Impact", "Watch", "Positive"];
  return out.sort((x, y) => order.indexOf(x.priority) - order.indexOf(y.priority) || y.impact - x.impact);
}

function countFood(a: Analysis) {
  return Math.max(1, Math.round(a.current.byCategory.Food / 330));
}
function countFoodPrev(a: Analysis) {
  return Math.max(1, Math.round((a.previous?.byCategory.Food ?? 0) / 330));
}

export function healthScore(a: Analysis, p: Profile) {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const spendingDiscipline = clamp(100 - ((a.current.spending / a.income) * 100 - 55) * 2);
  const savingsBehaviour = clamp((a.savingsRate / 30) * 100);
  const recurringControl = clamp(100 - ((a.recurringTotal / a.income) * 100 - 8) * 4);
  const discretionaryControl = clamp(100 - (a.discretionaryShare - 35) * 2);
  const goalProgress = clamp(p.savingsTarget ? (a.savings / p.savingsTarget) * 100 : 100);

  const breakdown = [
    { label: "Spending discipline", value: spendingDiscipline, weight: 0.22 },
    { label: "Savings behaviour", value: savingsBehaviour, weight: 0.25 },
    { label: "Recurring expenses", value: recurringControl, weight: 0.15 },
    { label: "Discretionary spending", value: discretionaryControl, weight: 0.18 },
    { label: "Goal progress", value: goalProgress, weight: 0.2 },
  ];

  const score = clamp(breakdown.reduce((s, b) => s + b.value * b.weight, 0));
  const weakest = [...breakdown].sort((x, y) => x.value - y.value)[0];

  return { score, breakdown, weakest };
}
