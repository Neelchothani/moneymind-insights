import { CATEGORIES, type Category } from "./types";

/**
 * Lightweight Multinomial Naive Bayes text classifier, trained in the browser
 * on merchant/description examples. No external API involved.
 */

const TRAINING: Array<[string, Category]> = [
  ["swiggy food delivery order", "Food"],
  ["zomato online order dinner", "Food"],
  ["dominos pizza", "Food"],
  ["mcdonalds burger meal", "Food"],
  ["cafe coffee day latte", "Food"],
  ["starbucks coffee", "Food"],
  ["kfc chicken bucket", "Food"],
  ["restaurant dinner bill", "Food"],
  ["food delivery late night snack", "Food"],
  ["chai point tea snacks", "Food"],

  ["reliance fresh grocery", "Groceries"],
  ["bigbasket grocery order", "Groceries"],
  ["dmart supermarket monthly grocery", "Groceries"],
  ["blinkit instant grocery", "Groceries"],
  ["zepto grocery vegetables", "Groceries"],
  ["more supermarket rice dal", "Groceries"],
  ["local kirana store provisions", "Groceries"],

  ["uber ride cab", "Transport"],
  ["ola cab trip", "Transport"],
  ["rapido bike taxi", "Transport"],
  ["metro card recharge travel", "Transport"],
  ["indian oil petrol fuel", "Transport"],
  ["irctc train ticket", "Transport"],
  ["bus pass travel", "Transport"],

  ["amazon shopping order", "Shopping"],
  ["flipkart purchase electronics", "Shopping"],
  ["myntra clothing fashion", "Shopping"],
  ["ajio apparel", "Shopping"],
  ["decathlon sports gear", "Shopping"],
  ["nykaa cosmetics beauty", "Shopping"],
  ["ikea furniture home", "Shopping"],

  ["netflix streaming", "Entertainment"],
  ["bookmyshow movie ticket", "Entertainment"],
  ["pvr cinemas movie", "Entertainment"],
  ["steam game purchase", "Entertainment"],
  ["concert event pass", "Entertainment"],
  ["gaming arcade fun zone", "Entertainment"],

  ["electricity board bill payment", "Bills"],
  ["mseb power bill", "Bills"],
  ["airtel postpaid mobile bill", "Bills"],
  ["jio fiber broadband bill", "Bills"],
  ["water utility bill", "Bills"],
  ["gas cylinder booking bill", "Bills"],
  ["house rent monthly payment", "Bills"],

  ["coursera course fee", "Education"],
  ["udemy online class", "Education"],
  ["college tuition fee", "Education"],
  ["textbook study material", "Education"],
  ["byjus learning subscription", "Education"],

  ["apollo pharmacy medicine", "Healthcare"],
  ["hospital consultation doctor", "Healthcare"],
  ["diagnostic lab blood test", "Healthcare"],
  ["1mg medicines order", "Healthcare"],
  ["dental clinic checkup", "Healthcare"],

  ["spotify premium subscription", "Subscriptions"],
  ["youtube premium monthly subscription", "Subscriptions"],
  ["netflix monthly subscription plan", "Subscriptions"],
  ["icloud storage subscription", "Subscriptions"],
  ["gym membership monthly", "Subscriptions"],
  ["prime membership renewal subscription", "Subscriptions"],
  ["notion workspace subscription", "Subscriptions"],

  ["atm cash withdrawal", "Other"],
  ["upi transfer to friend", "Other"],
  ["miscellaneous payment", "Other"],
  ["donation charity", "Other"],
  ["gift purchase misc", "Other"],
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !/^\d+$/.test(t));
}

type Model = {
  priors: Record<string, number>;
  counts: Record<string, Record<string, number>>;
  totals: Record<string, number>;
  vocab: number;
};

function train(): Model {
  const counts: Record<string, Record<string, number>> = {};
  const totals: Record<string, number> = {};
  const docs: Record<string, number> = {};
  const vocabSet = new Set<string>();

  for (const c of CATEGORIES) {
    counts[c] = {};
    totals[c] = 0;
    docs[c] = 0;
  }

  for (const [text, cat] of TRAINING) {
    docs[cat] += 1;
    for (const tok of tokenize(text)) {
      vocabSet.add(tok);
      counts[cat][tok] = (counts[cat][tok] ?? 0) + 1;
      totals[cat] += 1;
    }
  }

  const totalDocs = TRAINING.length;
  const priors: Record<string, number> = {};
  for (const c of CATEGORIES) priors[c] = Math.log((docs[c] + 1) / (totalDocs + CATEGORIES.length));

  return { priors, counts, totals, vocab: vocabSet.size };
}

const MODEL = train();

export type Prediction = { category: Category; confidence: number };

export function classify(text: string): Prediction {
  const tokens = tokenize(text);
  const scores: Array<[Category, number]> = [];

  for (const c of CATEGORIES) {
    let score = MODEL.priors[c];
    for (const tok of tokens) {
      const tf = MODEL.counts[c][tok] ?? 0;
      score += Math.log((tf + 1) / (MODEL.totals[c] + MODEL.vocab));
    }
    scores.push([c, score]);
  }

  scores.sort((a, b) => b[1] - a[1]);
  // Softmax over top scores for a readable confidence value.
  const max = scores[0][1];
  const exps = scores.map(([, s]) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return { category: scores[0][0], confidence: exps[0] / sum };
}

export const modelInfo = {
  algorithm: "Multinomial Naive Bayes",
  examples: TRAINING.length,
  vocabulary: MODEL.vocab,
  classes: CATEGORIES.length,
};
