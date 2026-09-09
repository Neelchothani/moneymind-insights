import {
  CATEGORIES,
  DISCRETIONARY,
  monthKey,
  type Category,
  type Profile,
  type Transaction,
} from "./types";

export type MonthStats = {
  key: string;
  income: number;
  spending: number;
  savings: number;
  byCategory: Record<Category, number>;
  count: number;
};

export type Analysis = {
  months: MonthStats[];
  current: MonthStats;
  previous?: MonthStats;
  totalSpending: number;
  categoryShare: Array<{ category: Category; amount: number; pctOfIncome: number; pctOfSpend: number }>;
  avgTransaction: number;
  frequency: number;
  weekend: number;
  weekday: number;
  weekendShare: number;
  recurring: Array<{ merchant: string; amount: number; count: number }>;
  recurringTotal: number;
  discretionary: number;
  discretionaryShare: number;
  savingsRate: number;
  topCategories: Array<{ category: Category; amount: number }>;
  biggestIncrease?: { category: Category; delta: number; pct: number };
  income: number;
  savings: number;
};

const empty = () => {
  const rec = {} as Record<Category, number>;
  for (const c of CATEGORIES) rec[c] = 0;
  return rec;
};

export function analyse(transactions: Transaction[], profile: Profile): Analysis {
  const map = new Map<string, MonthStats>();
  for (const t of transactions) {
    const key = monthKey(t.date);
    if (!map.has(key)) map.set(key, { key, income: 0, spending: 0, savings: 0, byCategory: empty(), count: 0 });
    const m = map.get(key)!;
    if (t.type === "income") m.income += t.amount;
    else {
      m.spending += t.amount;
      m.byCategory[t.category] += t.amount;
      m.count += 1;
    }
  }

  const months = [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
  for (const m of months) {
    if (!m.income) m.income = profile.income;
    m.savings = m.income - m.spending;
  }

  const current = months[months.length - 1] ?? {
    key: new Date().toISOString().slice(0, 7),
    income: profile.income,
    spending: 0,
    savings: profile.income,
    byCategory: empty(),
    count: 0,
  };
  const previous = months[months.length - 2];

  const curTx = transactions.filter((t) => monthKey(t.date) === current.key && t.type === "expense");
  const avgTransaction = curTx.length ? current.spending / curTx.length : 0;

  let weekend = 0;
  let weekday = 0;
  for (const t of curTx) {
    const day = new Date(t.date + "T00:00:00").getDay();
    if (day === 0 || day === 6) weekend += t.amount;
    else weekday += t.amount;
  }

  // Recurring = same merchant appearing in 2+ distinct months with similar amounts
  const byMerchant = new Map<string, Transaction[]>();
  for (const t of transactions.filter((t) => t.type === "expense")) {
    const k = t.merchant.toLowerCase();
    byMerchant.set(k, [...(byMerchant.get(k) ?? []), t]);
  }
  const recurring: Analysis["recurring"] = [];
  for (const [, list] of byMerchant) {
    const monthsSeen = new Set(list.map((t) => monthKey(t.date)));
    if (monthsSeen.size >= 2 && list.length >= 2) {
      const amounts = list.map((t) => t.amount);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const spread = Math.max(...amounts) - Math.min(...amounts);
      if (spread <= Math.max(80, avg * 0.25)) {
        recurring.push({ merchant: list[0].merchant, amount: Math.round(avg), count: monthsSeen.size });
      }
    }
  }
  recurring.sort((a, b) => b.amount - a.amount);
  const recurringTotal = recurring.reduce((a, r) => a + r.amount, 0);

  const income = current.income || profile.income;
  const categoryShare = CATEGORIES.map((c) => ({
    category: c,
    amount: current.byCategory[c],
    pctOfIncome: income ? (current.byCategory[c] / income) * 100 : 0,
    pctOfSpend: current.spending ? (current.byCategory[c] / current.spending) * 100 : 0,
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const discretionary = DISCRETIONARY.reduce((a, c) => a + current.byCategory[c], 0);

  let biggestIncrease: Analysis["biggestIncrease"];
  if (previous) {
    for (const c of CATEGORIES) {
      const delta = current.byCategory[c] - previous.byCategory[c];
      if (previous.byCategory[c] > 0 && delta > 0) {
        const pct = (delta / previous.byCategory[c]) * 100;
        if (!biggestIncrease || delta > biggestIncrease.delta) biggestIncrease = { category: c, delta, pct };
      }
    }
  }

  const savings = income - current.spending;

  return {
    months,
    current,
    previous,
    totalSpending: current.spending,
    categoryShare,
    avgTransaction,
    frequency: curTx.length,
    weekend,
    weekday,
    weekendShare: current.spending ? (weekend / current.spending) * 100 : 0,
    recurring,
    recurringTotal,
    discretionary,
    discretionaryShare: current.spending ? (discretionary / current.spending) * 100 : 0,
    savingsRate: income ? (savings / income) * 100 : 0,
    topCategories: categoryShare.slice(0, 3).map((c) => ({ category: c.category, amount: c.amount })),
    biggestIncrease,
    income,
    savings,
  };
}

export function categoryDelta(a: Analysis, c: Category) {
  if (!a.previous) return null;
  const prev = a.previous.byCategory[c];
  const cur = a.current.byCategory[c];
  if (!prev) return null;
  return { delta: cur - prev, pct: ((cur - prev) / prev) * 100 };
}
