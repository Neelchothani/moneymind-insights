import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { analyse, type Analysis } from "./analysis";
import { buildDemoTransactions, DEMO_PROFILE } from "./demoData";
import { generateInsights, healthScore, type Insight } from "./insights";
import { calculateSpendingRisk, type SpendingRiskForecast } from "./risk";
import type { Profile, Transaction } from "./types";

const KEY = "moneymind.v1";

type State = { profile: Profile | null; transactions: Transaction[] };

type Ctx = {
  ready: boolean;
  profile: Profile | null;
  transactions: Transaction[];
  analysis: Analysis;
  insights: Insight[];
  health: ReturnType<typeof healthScore>;
  risk: SpendingRiskForecast;
  hasData: boolean;
  setProfile: (p: Profile) => void;
  addTransactions: (t: Transaction[]) => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  replaceTransactions: (t: Transaction[]) => void;
  clearTransactions: () => void;
  loadDemo: () => void;
  reset: () => void;
};

const FALLBACK_PROFILE: Profile = {
  name: "Friend",
  income: 20000,
  situation: "Other",
  goal: "Save more",
  savingsTarget: 5000,
};

const MoneymindContext = createContext<Ctx | null>(null);

export function MoneymindProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ profile: null, transactions: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw) as State);
    } catch {
      /* ignore corrupted storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state, ready]);

  const setProfile = useCallback((p: Profile) => setState((s) => ({ ...s, profile: p })), []);

  const addTransactions = useCallback(
    (t: Transaction[]) =>
      setState((s) => ({
        ...s,
        transactions: [...t, ...s.transactions].sort((a, b) => (a.date < b.date ? 1 : -1)),
      })),
    [],
  );

  const addTransaction = useCallback(
    (t: Transaction) =>
      setState((s) => ({
        ...s,
        transactions: [t, ...s.transactions].sort((a, b) => (a.date < b.date ? 1 : -1)),
      })),
    [],
  );

  const updateTransaction = useCallback(
    (id: string, patch: Partial<Transaction>) =>
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
    [],
  );

  const removeTransaction = useCallback(
    (id: string) => setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })),
    [],
  );

  const replaceTransactions = useCallback(
    (t: Transaction[]) =>
      setState((s) => ({
        ...s,
        transactions: [...t].sort((a, b) => (a.date < b.date ? 1 : -1)),
      })),
    [],
  );

  const clearTransactions = useCallback(() => setState((s) => ({ ...s, transactions: [] })), []);

  const loadDemo = useCallback(
    () =>
      setState((s) => ({
        profile: s.profile ?? DEMO_PROFILE,
        transactions: buildDemoTransactions(),
      })),
    [],
  );

  const reset = useCallback(() => setState({ profile: null, transactions: [] }), []);

  const profile = state.profile;
  const effProfile = profile ?? FALLBACK_PROFILE;

  const analysis = useMemo(() => analyse(state.transactions, effProfile), [state.transactions, effProfile]);
  const insights = useMemo(
    () => (state.transactions.length ? generateInsights(analysis, effProfile) : []),
    [analysis, effProfile, state.transactions.length],
  );
  const health = useMemo(() => healthScore(analysis, effProfile), [analysis, effProfile]);
  const risk = useMemo(
    () => calculateSpendingRisk(state.transactions, analysis, effProfile),
    [state.transactions, analysis, effProfile],
  );

  const value: Ctx = {
    ready,
    profile,
    transactions: state.transactions,
    analysis,
    insights,
    health,
    risk,
    hasData: state.transactions.length > 0,
    setProfile,
    addTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    replaceTransactions,
    clearTransactions,
    loadDemo,
    reset,
  };

  return <MoneymindContext.Provider value={value}>{children}</MoneymindContext.Provider>;
}

export function useMoneymind() {
  const ctx = useContext(MoneymindContext);
  if (!ctx) throw new Error("useMoneymind must be used inside MoneymindProvider");
  return ctx;
}

export function useEffectiveProfile() {
  const { profile } = useMoneymind();
  return profile ?? FALLBACK_PROFILE;
}
