import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { EmptyState, GlassCard, SectionTitle } from "@/components/mm/primitives";
import { classify } from "@/lib/mm/classifier";
import { useMoneymind } from "@/lib/mm/store";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  inr,
  type Category,
  type Transaction,
} from "@/lib/mm/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Moneymind" },
      {
        name: "description",
        content: "Search, filter, categorize and inspect your financial transactions with ML categorization.",
      },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { transactions, addTransaction, removeTransaction, clearTransactions, loadDemo, hasData } =
    useMoneymind();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<"all" | "expense" | "income">("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">(
    "date-desc",
  );
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New transaction form state
  const [newMerchant, setNewMerchant] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Food");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [isCategoryManuallySet, setIsCategoryManuallySet] = useState(false);

  // Real-time ML categorization for manual entry
  const mlPrediction = useMemo(() => {
    if (!newMerchant.trim()) return null;
    return classify(newMerchant);
  }, [newMerchant]);

  const handleMerchantChange = (text: string) => {
    setNewMerchant(text);
    if (!isCategoryManuallySet && text.trim().length > 2) {
      const pred = classify(text);
      setNewCategory(pred.category);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount);
    if (!newMerchant.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const tx: Transaction = {
      id: "m" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
      merchant: newMerchant.trim(),
      amount: Math.round(amountNum),
      category: newType === "income" ? "Other" : newCategory,
      type: newType,
      date: newDate || new Date().toISOString().slice(0, 10),
      ml: !isCategoryManuallySet,
      source: "manual",
    };

    addTransaction(tx);
    setNewMerchant("");
    setNewAmount("");
    setIsCategoryManuallySet(false);
    setIsAddOpen(false);
  };

  // Filtered and sorted transactions
  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (search) {
          const q = search.toLowerCase();
          const matchMerchant = t.merchant.toLowerCase().includes(q);
          const matchCategory = t.category.toLowerCase().includes(q);
          if (!matchMerchant && !matchCategory) return false;
        }
        if (selectedCategory !== "All" && t.category !== selectedCategory) {
          return false;
        }
        if (selectedType !== "all" && t.type !== selectedType) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") return a.date < b.date ? 1 : -1;
        if (sortBy === "date-asc") return a.date > b.date ? 1 : -1;
        if (sortBy === "amount-desc") return b.amount - a.amount;
        if (sortBy === "amount-asc") return a.amount - b.amount;
        return 0;
      });
  }, [transactions, search, selectedCategory, selectedType, sortBy]);

  const totalExpense = useMemo(
    () => filtered.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0),
    [filtered],
  );
  const totalIncome = useMemo(
    () => filtered.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0),
    [filtered],
  );

  return (
    <div className="space-y-6">
      {/* Header with Title and Action buttons */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          title="Transactions"
          subtitle="Explore, filter, categorize, and inspect your financial behaviour ledger."
        />
        <div className="flex flex-wrap items-center gap-2">
          {hasData && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all transactions?")) {
                  clearTransactions();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="size-3.5" /> Clear All
            </button>
          )}
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
          >
            <Plus className="size-4" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      {hasData && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Showing Transactions</p>
            <p className="mt-1 text-2xl font-semibold">{filtered.length} <span className="text-sm font-normal text-muted-foreground">/ {transactions.length}</span></p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Filtered Expenses</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--warn)]">{inr(totalExpense)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Filtered Income</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--success)]">{inr(totalIncome)}</p>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <GlassCard className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search merchant or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-input bg-secondary/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/60"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as "all" | "expense" | "income")}
              className="w-full rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            >
              <option value="all">All Types (Dr & Cr)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-4 text-muted-foreground shrink-0" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "date-desc" | "date-asc" | "amount-desc" | "amount-asc")
              }
              className="w-full rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Transactions Table / List */}
      {!hasData ? (
        <EmptyState
          icon={<Search className="size-6" />}
          title="No transactions yet"
          message="Populate your ledger with realistic sample transactions or upload your bank statement PDF to get started."
          action={
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button
                onClick={loadDemo}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
              >
                Load Demo Data
              </button>
              <button
                onClick={() => setIsAddOpen(true)}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary"
              >
                Add Manual Transaction
              </button>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <GlassCard className="py-12 text-center">
          <p className="text-base font-semibold">No transactions match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try clearing your filters or search keywords.</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              setSelectedType("all");
            }}
            className="mt-4 rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            Reset Filters
          </button>
        </GlassCard>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Merchant / Narration</th>
                  <th className="px-5 py-3.5 font-medium">Category</th>
                  <th className="px-5 py-3.5 font-medium">Classification</th>
                  <th className="px-5 py-3.5 font-medium text-right">Amount</th>
                  <th className="px-4 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr key={t.id} className="group transition hover:bg-secondary/30">
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-muted-foreground">
                      {t.date}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[240px] sm:max-w-xs">{t.merchant}</span>
                        {t.source === "pdf" && (
                          <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            PDF
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          borderColor: `${CATEGORY_COLORS[t.category]}40`,
                          backgroundColor: `${CATEGORY_COLORS[t.category]}15`,
                          color: CATEGORY_COLORS[t.category],
                        }}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {t.ml ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Sparkles className="size-3" /> ML Categorised
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">User defined</span>
                      )}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-5 py-3.5 text-right font-semibold",
                        t.type === "income" ? "text-[var(--success)]" : "text-foreground",
                      )}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {inr(t.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        onClick={() => removeTransaction(t.id)}
                        className="opacity-60 transition hover:opacity-100 hover:text-destructive"
                        title="Delete transaction"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl rise">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">Add New Transaction</h2>
                <p className="text-xs text-muted-foreground">
                  Our in-browser Naive Bayes classifier will auto-predict category as you type.
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                  Merchant / Narration
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Uber, Netflix, Reliance Fresh"
                  value={newMerchant}
                  onChange={(e) => handleMerchantChange(e.target.value)}
                  className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
                />
                {mlPrediction && !isCategoryManuallySet && newType === "expense" && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-primary">
                    <Sparkles className="size-3.5" />
                    Auto-predicted category: <strong>{mlPrediction.category}</strong> (
                    {Math.round(mlPrediction.confidence * 100)}% match)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 450"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                    Transaction Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "expense" | "income")}
                    className="w-full rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
                  >
                    <option value="expense">Expense (Debit)</option>
                    <option value="income">Income (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                    Category
                  </label>
                  <select
                    disabled={newType === "income"}
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value as Category);
                      setIsCategoryManuallySet(true);
                    }}
                    className="w-full rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary/60 disabled:opacity-50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan hover:brightness-110"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
