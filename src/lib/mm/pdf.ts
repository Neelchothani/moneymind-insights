import { classify } from "./classifier";
import type { Transaction } from "./types";

export type ParsedRow = { date: string; merchant: string; amount: number };

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function normaliseDate(raw: string): string | null {
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = raw.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (dmy) {
    const y = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    return `${y}-${String(Number(dmy[2])).padStart(2, "0")}-${String(Number(dmy[1])).padStart(2, "0")}`;
  }

  const dMon = raw.match(/\b(\d{1,2})[\s-]([A-Za-z]{3,})[\s-](\d{2,4})\b/);
  if (dMon) {
    const m = MONTHS[dMon[2].slice(0, 3).toLowerCase()];
    if (m) {
      const y = dMon[3].length === 2 ? 2000 + Number(dMon[3]) : Number(dMon[3]);
      return `${y}-${String(m).padStart(2, "0")}-${String(Number(dMon[1])).padStart(2, "0")}`;
    }
  }
  return null;
}

/** Detects transaction-like rows in raw statement text. */
export function detectRows(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/opening balance|closing balance|statement of|page \d+/i.test(line)) continue;
    const date = normaliseDate(line);
    if (!date) continue;

    const amounts = [...line.matchAll(/(?:₹|rs\.?|inr)?\s?(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)\b/gi)]
      .map((m) => Number(m[1].replace(/,/g, "")))
      .filter((n) => n >= 10 && n <= 5_000_000);
    if (!amounts.length) continue;
    const amount = amounts[amounts.length - 1];

    let merchant = line
      .replace(/(\d{4})-(\d{2})-(\d{2})/g, " ")
      .replace(/\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g, " ")
      .replace(/\b\d{1,2}[\s-][A-Za-z]{3,}[\s-]\d{2,4}\b/g, " ")
      .replace(/(?:₹|rs\.?|inr)?\s?\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?/gi, " ")
      .replace(/\b(dr|cr|debit|credit|upi|neft|imps|ref|txn)\b/gi, " ")
      .replace(/[^A-Za-z0-9&.\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (merchant.length < 3) merchant = "Unknown Merchant";
    rows.push({ date, merchant: merchant.slice(0, 48), amount });
  }
  return rows;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      const y = item.transform?.[5];
      if (lastY !== null && Math.abs(y - lastY) > 3) text += "\n";
      text += item.str + " ";
      lastY = y;
    }
    text += "\n";
  }
  return text;
}

export function rowsToTransactions(rows: ParsedRow[]): Transaction[] {
  return rows.map((r) => {
    const pred = classify(r.merchant);
    return {
      id: "p" + Math.random().toString(36).slice(2, 10),
      date: r.date,
      merchant: r.merchant,
      amount: r.amount,
      category: pred.category,
      type: /salary|credit|refund|interest/i.test(r.merchant) ? ("income" as const) : ("expense" as const),
      ml: true,
      source: "pdf" as const,
    };
  });
}
