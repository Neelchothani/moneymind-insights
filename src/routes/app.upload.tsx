import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { GlassCard, Progress, SectionTitle } from "@/components/mm/primitives";
import {
  detectRows,
  extractPdfText,
  generateSamplePdfFile,
  rowsToTransactions,
  SAMPLE_STATEMENT_TEXT,
  type ParsedRow,
} from "@/lib/mm/pdf";
import { useMoneymind } from "@/lib/mm/store";
import { inr } from "@/lib/mm/types";

export const Route = createFileRoute("/app/upload")({
  head: () => ({
    meta: [
      { title: "Upload Statement — Moneymind" },
      {
        name: "description",
        content: "Upload bank statement PDFs and extract transaction data with automated in-browser ML categorisation.",
      },
    ],
  }),
  component: UploadStatementPage,
});

type Step = "idle" | "uploading" | "extracting" | "analysing" | "categorising" | "complete";

const PIPELINE_STEPS: Array<{ key: Step; label: string; pct: number }> = [
  { key: "uploading", label: "Uploading statement", pct: 20 },
  { key: "extracting", label: "Extracting readable text via PDF.js", pct: 45 },
  { key: "analysing", label: "Detecting rows, dates & amounts", pct: 70 },
  { key: "categorising", label: "Classifying merchants with in-browser ML", pct: 90 },
  { key: "complete", label: "Ready to import", pct: 100 },
];

export function UploadStatementPage() {
  const { replaceTransactions, addTransactions, clearTransactions, hasData } = useMoneymind();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [activeTab, setActiveTab] = useState<"pdf" | "paste">("pdf");
  const [pastedText, setPastedText] = useState("");

  const processFile = useCallback(async (file: File) => {
    try {
      setError(null);
      setParsedRows([]);

      // Step 1: Uploading
      setStep("uploading");
      await new Promise((r) => setTimeout(r, 450));

      // Step 2: Extracting text from PDF
      setStep("extracting");
      const text = await extractPdfText(file);

      if (!text || text.trim().length < 20) {
        throw new Error(
          "Could not extract readable text from this PDF. Please ensure it is not a scanned image, or use the Paste Statement Text tab.",
        );
      }

      // Step 3: Analysing rows
      setStep("analysing");
      await new Promise((r) => setTimeout(r, 550));
      const detected = detectRows(text);

      if (detected.length === 0) {
        throw new Error(
          "No transaction rows could be identified in the statement. Please check the format or paste the text directly.",
        );
      }

      // Step 4: ML Categorisation
      setStep("categorising");
      await new Promise((r) => setTimeout(r, 600));

      setParsedRows(detected);
      setStep("complete");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process PDF statement.";
      setError(message);
      setStep("idle");
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Please drop a valid .PDF document.");
        return;
      }
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setError(null);
    setStep("analysing");

    setTimeout(() => {
      const detected = detectRows(pastedText);
      if (detected.length === 0) {
        setError("No transactions could be detected from the pasted text. Verify the dates and amounts.");
        setStep("idle");
        return;
      }
      setStep("categorising");
      setTimeout(() => {
        setParsedRows(detected);
        setStep("complete");
      }, 500);
    }, 400);
  };

  const handleCommitImport = () => {
    const newTx = rowsToTransactions(parsedRows);
    if (importMode === "replace") {
      replaceTransactions(newTx);
    } else {
      addTransactions(newTx);
    }
    navigate({ to: "/app" });
  };

  // Turnkey demo feature: load sample statement file immediately
  const handleTrySampleStatement = () => {
    const sampleFile = generateSamplePdfFile();
    processFile(sampleFile);
  };

  const currentStepObj = PIPELINE_STEPS.find((s) => s.key === step);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Upload Financial Statement"
        subtitle="Import your monthly bank statement PDF. Text and transactions are parsed securely right inside your browser."
      />

      {/* Privacy Notice Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/8 p-4 text-xs text-muted-foreground">
        <Lock className="size-4 text-primary shrink-0" />
        <div>
          <strong className="text-foreground">Private & Local Processing:</strong> Your statement is parsed client-side
          using Web Workers and in-browser ML. Moneymind does not connect to your bank or upload sensitive documents to external servers.
        </div>
      </div>

      {/* Tabs: PDF Upload vs Paste Statement Text */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            setActiveTab("pdf");
            setError(null);
          }}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === "pdf"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="inline size-4 mr-2" />
          PDF Statement Upload
        </button>
        <button
          onClick={() => {
            setActiveTab("paste");
            setError(null);
          }}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === "paste"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="inline size-4 mr-2" />
          Paste Statement Text
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box / Input View */}
      {step === "idle" && (
        <>
          {activeTab === "pdf" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
                dragOver
                  ? "border-primary bg-primary/10 glow-cyan scale-[1.01]"
                  : "border-border bg-card/50 hover:border-primary/50 hover:bg-card/80"
              }`}
            >
              <div className="grid size-16 place-items-center rounded-2xl bg-primary/12 text-primary">
                <Upload className="size-8" />
              </div>

              <h3 className="mt-4 text-lg font-semibold sm:text-xl">
                Drop your financial statement here
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">PDF up to 10MB</p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <label className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110">
                  Select PDF File
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleTrySampleStatement}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
                >
                  <Sparkles className="size-4 text-primary" /> Try Sample Statement PDF
                </button>

                <a
                  href="/sample_bank_statement.pdf"
                  download="Arjun_Mehta_Bank_Statement.pdf"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  title="Download the generated PDF to your computer to test drag & drop"
                >
                  <Download className="size-4" /> Download PDF File
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                  ✨ Replaces demo data & recalibrates all charts, insights and health score
                </span>
                {hasData && (
                  <button
                    onClick={() => {
                      if (window.confirm("Do you want to clear current demo transactions right now?")) {
                        clearTransactions();
                      }
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive underline"
                  >
                    Clear current data first
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Works with HDFC, ICICI, SBI, Axis, Kotak, Paytm, and standard Indian bank statements.
              </p>
            </div>
          ) : (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-base font-semibold">Paste Raw Statement Text</h3>
                <button
                  onClick={() => setPastedText(SAMPLE_STATEMENT_TEXT)}
                  className="text-xs text-primary hover:underline"
                >
                  Fill with Sample Bank Text
                </button>
              </div>
              <textarea
                rows={10}
                placeholder="Paste lines from your bank statement or CSV here (e.g. Date, Narration, Amount)..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full rounded-2xl border border-input bg-secondary/40 p-4 font-mono text-xs outline-none focus:border-primary/60"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim()}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan hover:brightness-110 disabled:opacity-40"
                >
                  Parse Text
                </button>
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* Animated Pipeline Processing View */}
      {step !== "idle" && step !== "complete" && (
        <GlassCard className="p-8 text-center max-w-xl mx-auto py-12">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary mx-auto">
            <Loader2 className="size-7 animate-spin" />
          </div>

          <h3 className="mt-5 text-xl font-bold">{currentStepObj?.label}…</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Pipeline: Upload → Extract → Analyse → Categorise
          </p>

          <div className="mt-6">
            <Progress value={currentStepObj?.pct || 30} />
          </div>

          <div className="mt-8 grid grid-cols-4 gap-2 text-center text-xs">
            {PIPELINE_STEPS.slice(0, 4).map((s, idx) => {
              const activeIndex = PIPELINE_STEPS.findIndex((x) => x.key === step);
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div
                  key={s.key}
                  className={`rounded-xl p-2 border ${
                    isCurrent
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : isPast
                        ? "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
                        : "border-border text-muted-foreground opacity-50"
                  }`}
                >
                  {isPast ? "✓" : idx + 1}. {s.key.toUpperCase()}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Complete State: Review Extracted Transactions before Committing */}
      {step === "complete" && (
        <div className="space-y-6">
          <GlassCard className="p-6 border-[var(--success)]/30 bg-[var(--success)]/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-[var(--success)]/20 text-[var(--success)]">
                  <CheckCircle2 className="size-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {parsedRows.length} transactions imported successfully!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    All merchants classified with in-browser Multinomial Naive Bayes model.
                  </p>
                </div>
              </div>

              {/* Replace vs Append Choice */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1 text-xs">
                  <button
                    onClick={() => setImportMode("replace")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      importMode === "replace"
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Replace Current Data
                  </button>
                  <button
                    onClick={() => setImportMode("append")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      importMode === "append"
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Append to Data
                  </button>
                </div>

                <button
                  onClick={handleCommitImport}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan hover:brightness-110"
                >
                  Apply to Dashboard <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Extracted Preview Table */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h4 className="text-base font-semibold">Extracted Transactions Preview</h4>
              <button
                onClick={() => {
                  setStep("idle");
                  setParsedRows([]);
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RefreshCw className="size-3" /> Upload Another
              </button>
            </div>

            <div className="mt-4 max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface-2 uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Cleaned Merchant</th>
                    <th className="px-4 py-2.5">ML Category</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-secondary/30">
                      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-2 font-medium">
                        <span className="truncate block max-w-xs">{r.merchant}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Sparkles className="size-2.5" />
                          {r.category}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-semibold whitespace-nowrap ${
                          r.type === "income" ? "text-[var(--success)]" : "text-foreground"
                        }`}
                      >
                        {r.type === "income" ? "+" : "−"}
                        {inr(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
