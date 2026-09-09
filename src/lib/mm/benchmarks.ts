/**
 * benchmarks.ts — Peer Benchmarking Engine
 *
 * Compares the user's category spending % against
 * anonymised national averages for their income bracket.
 * All data is built-in — nothing sent to a server.
 */

import type { Category } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BracketKey = "entry" | "junior" | "mid" | "senior" | "high";

export type CategoryBenchmark = {
  category: Category;
  peerPct: number;       // peer average as % of total spending
  userPct: number;       // user's actual % of total spending
  userAmount: number;    // user's actual spend in Rs
  delta: number;         // userPct - peerPct (positive = over-spending vs peers)
  verdict: "much_higher" | "higher" | "on_par" | "lower" | "much_lower";
  label: string;         // human-readable verdict
};

export type BenchmarkReport = {
  bracket: BracketKey;
  bracketLabel: string;
  incomeRange: string;
  categories: CategoryBenchmark[];
  overspendingAreas: CategoryBenchmark[];   // delta > 5
  savingAreas: CategoryBenchmark[];         // delta < -5
  totalUserSpend: number;
};

// ─── Income Brackets ─────────────────────────────────────────────────────────

const BRACKETS: Array<{
  key: BracketKey;
  label: string;
  incomeRange: string;
  maxIncome: number;
}> = [
  { key: "entry",  label: "Student / Entry Level",    incomeRange: "Below ₹25,000/mo",        maxIncome: 25_000 },
  { key: "junior", label: "Junior Professional",      incomeRange: "₹25,000 – ₹60,000/mo",    maxIncome: 60_000 },
  { key: "mid",    label: "Mid-Level Professional",   incomeRange: "₹60,000 – ₹1,20,000/mo",  maxIncome: 1_20_000 },
  { key: "senior", label: "Senior Professional",      incomeRange: "₹1,20,000 – ₹3,00,000/mo",maxIncome: 3_00_000 },
  { key: "high",   label: "High Income",              incomeRange: "Above ₹3,00,000/mo",      maxIncome: Infinity },
];

// ─── Benchmark Data ───────────────────────────────────────────────────────────
// Peer average spending % per category per income bracket
// Based on Indian household expenditure patterns (PLFS / RBI data proxies)

type BenchmarkTable = Record<BracketKey, Record<Category, number>>;

const BENCHMARKS: BenchmarkTable = {
  entry: {
    Food:          28,
    Groceries:     22,
    Transport:     10,
    Shopping:       8,
    Entertainment:  5,
    Bills:         14,
    Education:      7,
    Healthcare:     2,
    Subscriptions:  2,
    Other:          2,
  },
  junior: {
    Food:          22,
    Groceries:     18,
    Transport:     12,
    Shopping:      12,
    Entertainment:  7,
    Bills:         12,
    Education:      3,
    Healthcare:     3,
    Subscriptions:  5,
    Other:          6,
  },
  mid: {
    Food:          18,
    Groceries:     15,
    Transport:     10,
    Shopping:      15,
    Entertainment:  8,
    Bills:         12,
    Education:      3,
    Healthcare:     4,
    Subscriptions:  8,
    Other:          7,
  },
  senior: {
    Food:          15,
    Groceries:     12,
    Transport:      8,
    Shopping:      18,
    Entertainment:  8,
    Bills:         10,
    Education:      2,
    Healthcare:     5,
    Subscriptions: 10,
    Other:         12,
  },
  high: {
    Food:          12,
    Groceries:     10,
    Transport:      6,
    Shopping:      20,
    Entertainment:  8,
    Bills:          8,
    Education:      2,
    Healthcare:     6,
    Subscriptions: 12,
    Other:         16,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBracket(monthlyIncome: number): typeof BRACKETS[number] {
  return BRACKETS.find((b) => monthlyIncome <= b.maxIncome) ?? BRACKETS[BRACKETS.length - 1];
}

function getVerdict(delta: number): CategoryBenchmark["verdict"] {
  if (delta >= 10) return "much_higher";
  if (delta >= 5)  return "higher";
  if (delta <= -10) return "much_lower";
  if (delta <= -5)  return "lower";
  return "on_par";
}

function getLabel(verdict: CategoryBenchmark["verdict"]): string {
  switch (verdict) {
    case "much_higher": return "Much higher than peers";
    case "higher":      return "Higher than peers";
    case "on_par":      return "On par with peers";
    case "lower":       return "Lower than peers";
    case "much_lower":  return "Much lower than peers";
  }
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

/**
 * computeBenchmarks
 *
 * @param categorySpend  Record<Category, number> — actual Rs amounts per category
 * @param monthlyIncome  user's declared monthly income
 */
export function computeBenchmarks(
  categorySpend: Partial<Record<Category, number>>,
  monthlyIncome: number,
): BenchmarkReport {
  const bracket = getBracket(monthlyIncome);
  const peers = BENCHMARKS[bracket.key];

  const totalUserSpend = Object.values(categorySpend).reduce((s, v) => s + (v ?? 0), 0);

  const categories: CategoryBenchmark[] = (Object.keys(peers) as Category[]).map((cat) => {
    const userAmount = categorySpend[cat] ?? 0;
    const userPct = totalUserSpend > 0 ? (userAmount / totalUserSpend) * 100 : 0;
    const peerPct = peers[cat];
    const delta = userPct - peerPct;
    const verdict = getVerdict(delta);
    return {
      category: cat,
      peerPct: Math.round(peerPct * 10) / 10,
      userPct: Math.round(userPct * 10) / 10,
      userAmount: Math.round(userAmount),
      delta: Math.round(delta * 10) / 10,
      verdict,
      label: getLabel(verdict),
    };
  });

  // Sort: most over-spending first
  categories.sort((a, b) => b.delta - a.delta);

  return {
    bracket: bracket.key,
    bracketLabel: bracket.label,
    incomeRange: bracket.incomeRange,
    categories,
    overspendingAreas: categories.filter((c) => c.delta >= 5),
    savingAreas: categories.filter((c) => c.delta <= -5),
    totalUserSpend,
  };
}
