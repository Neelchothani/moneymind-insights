export const CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Education",
  "Healthcare",
  "Subscriptions",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Transaction = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  amount: number; // positive number
  category: Category;
  type: "expense" | "income";
  ml: boolean; // categorised by the in-browser model
  source: "demo" | "manual" | "pdf";
};

export type Profile = {
  name: string;
  income: number;
  situation: "Student" | "Young Professional" | "Family" | "Other";
  goal: "Save more" | "Control spending" | "Build emergency fund" | "Reach a specific target";
  savingsTarget: number;
  targetAmount?: number;
  /** Minimum balance threshold the user wants to maintain (default: 1000) */
  minBalance?: number;
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "var(--chart-1)",
  Groceries: "var(--chart-2)",
  Transport: "var(--chart-5)",
  Shopping: "var(--chart-3)",
  Entertainment: "var(--chart-6)",
  Bills: "var(--chart-4)",
  Education: "var(--chart-7)",
  Healthcare: "var(--chart-2)",
  Subscriptions: "var(--chart-3)",
  Other: "var(--muted-foreground)",
};

export const DISCRETIONARY: Category[] = ["Food", "Shopping", "Entertainment", "Subscriptions"];

export function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "2-digit" });
}
