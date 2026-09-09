import type { Category, Transaction } from "./types";

let seed = 20260909;
function rnd() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function id() {
  return "t" + Math.floor(rnd() * 1e9).toString(36) + Date.now().toString(36).slice(-4);
}

const FOOD = ["Swiggy", "Zomato", "Dominos Pizza", "Cafe Coffee Day", "KFC", "Chai Point"];
const GROC = ["Reliance Fresh", "BigBasket", "DMart", "Blinkit", "Zepto"];
const TRANS = ["Uber", "Ola", "Rapido", "Metro Card Recharge", "Indian Oil Petrol"];
const SHOP = ["Amazon", "Flipkart", "Myntra", "Ajio", "Decathlon"];
const ENT = ["BookMyShow", "PVR Cinemas", "Steam Games"];
const HEALTH = ["Apollo Pharmacy", "1mg Medicines"];
const EDU = ["Coursera Course", "Udemy Class"];

function d(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function tx(
  date: string,
  merchant: string,
  amount: number,
  category: Category,
  type: "expense" | "income" = "expense",
  ml = true,
): Transaction {
  return { id: id(), date, merchant, amount: Math.round(amount), category, type, ml, source: "demo" };
}

/** Builds ~55 realistic transactions across the last 3 months with intentional patterns. */
export function buildDemoTransactions(now = new Date()): Transaction[] {
  seed = 20260909;
  const out: Transaction[] = [];
  const months = [2, 1, 0].map((back) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - back, 1);
    return { y: dt.getFullYear(), m: dt.getMonth(), back };
  });

  for (const { y, m, back } of months) {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cap = (day: number) => Math.min(day, daysInMonth);

    // Stable income
    out.push(tx(d(y, m, 1), "Monthly Salary Credit", 20000, "Other", "income", false));

    // Regular bills
    out.push(tx(d(y, m, 3), "Electricity Board Bill", 780 + back * 20, "Bills"));
    out.push(tx(d(y, m, 5), "Jio Fiber Broadband Bill", 599, "Bills"));
    out.push(tx(d(y, m, 5), "Airtel Postpaid Mobile Bill", 349, "Bills"));

    // Recurring subscriptions
    out.push(tx(d(y, m, 2), "Netflix Subscription", 199, "Subscriptions"));
    out.push(tx(d(y, m, 4), "Spotify Premium Subscription", 119, "Subscriptions"));
    out.push(tx(d(y, m, 8), "YouTube Premium Subscription", 129, "Subscriptions"));
    out.push(tx(d(y, m, 12), "Gym Membership Monthly", 550, "Subscriptions"));
    if (back <= 1) out.push(tx(d(y, m, 15), "Prime Membership Renewal", 179, "Subscriptions"));

    // Groceries — stable
    out.push(tx(d(y, m, cap(6)), pick(GROC), 1250 + rnd() * 250, "Groceries"));
    out.push(tx(d(y, m, cap(19)), pick(GROC), 900 + rnd() * 300, "Groceries"));

    // Transport — stable-ish
    const rides = 3 + (back === 0 ? 1 : 0);
    for (let i = 0; i < rides; i++) {
      out.push(tx(d(y, m, cap(4 + i * 6)), pick(TRANS), 120 + rnd() * 180, "Transport"));
    }

    // Food delivery — rising month over month (5 -> 6 -> 8 orders, bigger tickets)
    const orders = back === 2 ? 5 : back === 1 ? 6 : 8;
    for (let i = 0; i < orders; i++) {
      const day = cap(3 + Math.floor((i * 26) / orders) + Math.floor(rnd() * 2));
      const weekendBoost = new Date(y, m, day).getDay() % 6 === 0 ? 1.4 : 1;
      out.push(
        tx(d(y, m, day), pick(FOOD), (230 + rnd() * 180) * weekendBoost * (1 + (2 - back) * 0.08), "Food"),
      );
    }

    // Shopping — spike in the latest month
    const shops = back === 0 ? 3 : 2;
    for (let i = 0; i < shops; i++) {
      out.push(tx(d(y, m, cap(9 + i * 7)), pick(SHOP), (back === 0 ? 900 : 600) + rnd() * 700, "Shopping"));
    }

    // Entertainment — weekend heavy
    out.push(tx(d(y, m, cap(back === 0 ? 21 : 16)), pick(ENT), 320 + rnd() * 260, "Entertainment"));
    if (back === 0) out.push(tx(d(y, m, cap(28)), pick(ENT), 450, "Entertainment"));

    // Occasional health / education
    if (back === 1) out.push(tx(d(y, m, cap(22)), pick(HEALTH), 430, "Healthcare"));
    if (back === 2) out.push(tx(d(y, m, cap(11)), pick(EDU), 1499, "Education"));
    if (back === 0) out.push(tx(d(y, m, cap(24)), "ATM Cash Withdrawal", 800, "Other"));
  }

  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const DEMO_PROFILE = {
  name: "Arjun",
  income: 20000,
  situation: "Young Professional" as const,
  goal: "Save more" as const,
  savingsTarget: 5000,
};
