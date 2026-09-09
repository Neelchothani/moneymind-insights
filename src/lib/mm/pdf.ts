import { classify } from "./classifier";
import type { Category, Transaction } from "./types";

export type ParsedRow = {
  date: string;
  merchant: string;
  amount: number;
  type: "expense" | "income";
  category?: Category;
  confidence?: number;
  raw?: string;
};

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

export function normaliseDate(raw: string): string | null {
  // ISO: 2026-08-15
  const iso = raw.match(/\b(20\d\d)[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) {
    const y = iso[1];
    const m = String(Number(iso[2])).padStart(2, "0");
    const d = String(Number(iso[3])).padStart(2, "0");
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = raw.match(/\b(\d{1,2})[/\-.]([01]?\d)[/\-.](20\d\d|\d{2})\b/);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    const y = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // DD Mon YYYY or DD-Mon-YYYY (e.g. 15 Aug 2026 or 15-Aug-2026 or 15-Aug-26)
  const dMon = raw.match(/\b(\d{1,2})[\s\-.]([A-Za-z]{3,9})[\s\-.](20\d\d|\d{2})\b/);
  if (dMon) {
    const d = Number(dMon[1]);
    const key = dMon[2].toLowerCase();
    const m = MONTHS[key] || MONTHS[key.slice(0, 3)];
    if (m && d >= 1 && d <= 31) {
      const y = dMon[3].length === 2 ? 2000 + Number(dMon[3]) : Number(dMon[3]);
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // Mon DD, YYYY (e.g. Aug 15, 2026)
  const monD = raw.match(/\b([A-Za-z]{3,9})[\s\-.]+(\d{1,2}),?[\s\-.]+(20\d\d|\d{2})\b/);
  if (monD) {
    const key = monD[1].toLowerCase();
    const m = MONTHS[key] || MONTHS[key.slice(0, 3)];
    const d = Number(monD[2]);
    if (m && d >= 1 && d <= 31) {
      const y = monD[3].length === 2 ? 2000 + Number(monD[3]) : Number(monD[3]);
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  return null;
}

const BRAND_PATTERNS: Array<{ regex: RegExp; name: string }> = [
  { regex: /\bswiggy\b/i, name: "Swiggy" },
  { regex: /\bzomato\b/i, name: "Zomato" },
  { regex: /\bdomino'?s\b/i, name: "Dominos Pizza" },
  { regex: /\bmcdonald'?s\b/i, name: "McDonald's" },
  { regex: /\bkfc\b/i, name: "KFC" },
  { regex: /\bstarbucks\b/i, name: "Starbucks" },
  { regex: /\bchai\s*point\b/i, name: "Chai Point" },
  { regex: /\bcafe\s*coffee\s*day\b/i, name: "Cafe Coffee Day" },
  { regex: /\buber\b/i, name: "Uber" },
  { regex: /\bola\b/i, name: "Ola" },
  { regex: /\brapido\b/i, name: "Rapido" },
  { regex: /\bmetro\s*(?:rail|card|recharge)?\b/i, name: "Metro Card Recharge" },
  { regex: /\bindian\s*oil|fuel|petrol|hpcl|bpcl\b/i, name: "Indian Oil Petrol" },
  { regex: /\birctc\b/i, name: "IRCTC Train Ticket" },
  { regex: /\bamazon\b/i, name: "Amazon" },
  { regex: /\bflipkart\b/i, name: "Flipkart" },
  { regex: /\bmyntra\b/i, name: "Myntra" },
  { regex: /\bajio\b/i, name: "Ajio" },
  { regex: /\bdecathlon\b/i, name: "Decathlon" },
  { regex: /\bnykaa\b/i, name: "Nykaa" },
  { regex: /\breliance\s*fresh\b/i, name: "Reliance Fresh" },
  { regex: /\bbig\s*basket\b/i, name: "BigBasket" },
  { regex: /\bd\s*mart\b/i, name: "DMart" },
  { regex: /\bblinkit\b/i, name: "Blinkit" },
  { regex: /\bzepto\b/i, name: "Zepto" },
  { regex: /\bnetflix\b/i, name: "Netflix" },
  { regex: /\bspotify\b/i, name: "Spotify" },
  { regex: /\byoutube\s*premium\b/i, name: "YouTube Premium" },
  { regex: /\bbookmyshow|pvr|inox\b/i, name: "BookMyShow" },
  { regex: /\bairtel\b/i, name: "Airtel Postpaid" },
  { regex: /\bjio\s*(?:fiber|broadband|telecom)?\b/i, name: "Jio Fiber Broadband" },
  { regex: /\belectricity|power|mseb|bescom\b/i, name: "Electricity Board Bill" },
  { regex: /\bapollo\s*pharmacy\b/i, name: "Apollo Pharmacy" },
  { regex: /\b1mg|pharmeasy\b/i, name: "1mg Medicines" },
  { regex: /\bcoursera\b/i, name: "Coursera" },
  { regex: /\budemy\b/i, name: "Udemy" },
  { regex: /\bsalary(?:\s*credit)?\b/i, name: "Monthly Salary Credit" },
  { regex: /\bgym\s*(?:fitness|membership)?\b/i, name: "Gym Membership" },
  { regex: /\batm\s*(?:cash|wdl|withdrawal)?\b/i, name: "ATM Cash Withdrawal" },
];

export function cleanMerchant(line: string): string {
  // Check known brands first for maximum clarity
  for (const b of BRAND_PATTERNS) {
    if (b.regex.test(line)) {
      return b.name;
    }
  }

  // General narration cleanup
  let cleaned = line
    .replace(/\b(20\d\d)[-/.](\d{1,2})[-/.](\d{1,2})\b/g, " ")
    .replace(/\b(\d{1,2})[/\-.]([01]?\d)[/\-.](20\d\d|\d{2})\b/g, " ")
    .replace(/\b(\d{1,2})[\s\-.]([A-Za-z]{3,9})[\s\-.](20\d\d|\d{2})\b/g, " ")
    .replace(/(?:₹|rs\.?|inr)?\s*\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?\s*(?:dr\.?|cr\.?|\b)/gi, " ")
    .replace(/\b(?:upi|neft|imps|rtgs|ach|pos|chq|ref|txn|dr|cr|debit|credit|bal|balance|w-dl|wdl|transfer|to|from)\b/gi, " ")
    .replace(/\b\w+@\w+\b/g, " ")
    .replace(/\b\d{6,}\b/g, " ")
    .replace(/[/\\_#:@-]/g, " ")
    .replace(/[^A-Za-z0-9\s.&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned.replace(/^\d+\s*/, "").trim();

  if (cleaned.length < 3) {
    return "Miscellaneous Transaction";
  }

  return cleaned
    .split(" ")
    .slice(0, 5)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/** Detects transaction-like rows in raw statement text. */
export function detectRows(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lines = text
    .split(/\r?\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const headerIgnoreRegex =
    /^(?:account\s*statement|statement\s*of|statement\s*period|opening\s*balance|closing\s*balance|page\s*\d+|date\s+particulars|transaction\s*date|narration\s+chq)/i;

  for (const line of lines) {
    if (headerIgnoreRegex.test(line)) continue;
    if (/\b(?:statement\s*period|to\s+\d{1,2}[-/\s][A-Za-z0-9]+)\b/i.test(line)) continue;
    if (/total\s+(?:debit|credit)|closing\s*balance/i.test(line)) continue;

    const date = normaliseDate(line);
    if (!date) continue;

    const amountMatches = [...line.matchAll(/(?:₹|rs\.?|inr)?\s*(-?\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)\s*(dr\.?|cr\.?)?\b/gi)];
    if (!amountMatches.length) continue;

    const candidates = amountMatches
      .map((m) => {
        const rawNum = m[1].replace(/,/g, "");
        const val = Math.abs(parseFloat(rawNum));
        const indicator = (m[2] || "").toLowerCase();
        return { val, indicator, raw: m[0] };
      })
      .filter((c) => !isNaN(c.val) && c.val >= 5 && c.val <= 50_000_000);

    if (!candidates.length) continue;

    let chosen = candidates.find((c) => c.indicator.startsWith("dr") || c.indicator.startsWith("cr"));

    if (!chosen) {
      if (candidates.length >= 2) {
        chosen = candidates[0];
      } else {
        chosen = candidates[0];
      }
    }

    const isCredit =
      chosen.indicator.startsWith("cr") ||
      (/\b(?:cr|credit|deposit|salary|refund|interest|reversal|cashback)\b/i.test(line) &&
        !/\b(?:credit\s*card\s*bill|debit)\b/i.test(line));

    const type: "expense" | "income" = isCredit ? "income" : "expense";
    const merchant = cleanMerchant(line);
    const prediction = classify(merchant);

    rows.push({
      date,
      merchant,
      amount: Math.round(chosen.val),
      type,
      category: isCredit ? "Other" : (prediction.category as Category),
      confidence: prediction.confidence,
      raw: line,
    });
  }

  return rows;
}

/** Extracts readable text from a PDF file using pdfjs-dist with fallback worker */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  try {
    const workerModule = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    if (workerModule && workerModule.default) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
    }
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "4.10.38"}/build/pdf.worker.min.mjs`;
  }

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    type TextItem = { str: string; x: number; y: number };
    const items: TextItem[] = [];

    for (const rawItem of content.items as Array<{ str?: string; transform?: number[] }>) {
      if ("str" in rawItem && rawItem.str) {
        const x = rawItem.transform ? rawItem.transform[4] : 0;
        const y = rawItem.transform ? rawItem.transform[5] : 0;
        items.push({ str: rawItem.str, x, y });
      }
    }

    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 3.5) {
        return b.y - a.y;
      }
      return a.x - b.x;
    });

    let currentY: number | null = null;
    const pageLines: string[] = [];
    let currentLine = "";

    for (const it of items) {
      if (currentY === null || Math.abs(it.y - currentY) > 3.5) {
        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }
        currentLine = it.str + " ";
        currentY = it.y;
      } else {
        currentLine += it.str + " ";
      }
    }
    if (currentLine.trim()) {
      pageLines.push(currentLine.trim());
    }

    fullText += pageLines.join("\n") + "\n";
  }

  return fullText;
}

export function rowsToTransactions(rows: ParsedRow[]): Transaction[] {
  return rows.map((r) => {
    const pred = classify(r.merchant);
    return {
      id: "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3),
      date: r.date,
      merchant: r.merchant,
      amount: r.amount,
      category: r.type === "income" ? "Other" : (r.category ?? pred.category),
      type: r.type,
      ml: true,
      source: "pdf" as const,
    };
  });
}

export const SAMPLE_STATEMENT_TEXT = `
BANK STATEMENT OF ACCOUNT
Account Number: 50100492819284  |  Customer Name: Arjun Mehta
Statement Period: 01-Jun-2026 to 31-Aug-2026  |  Currency: INR

Date        Narration / Description                        Chq/Ref No.      Withdrawal (Dr)    Deposit (Cr)    Balance
01-06-2026  ACH CR - TECHSOLUTIONS PVT LTD SALARY          CMS928104820                        20,000.00       24,850.00
02-06-2026  UPI/415289/Netflix/netflix@paytm/Subscription  UPI0192849         199.00                           24,651.00
03-06-2026  BBPS/MSEB Electricity Board Power Bill         BBPS829104         810.00                           23,841.00
04-06-2026  UPI/415982/Spotify/spotify@icici/Music         UPI0192850         119.00                           23,722.00
05-06-2026  ACH DR - JIO FIBER BROADBAND BILL              ACH0291024         599.00                           23,123.00
06-06-2026  POS 491029 RELIANCE FRESH MUMBAI GROCERY       POS991204        1,280.00                           21,843.00
07-06-2026  UPI/416102/Swiggy/swiggy@axis/Dinner Delivery  UPI0192862         340.00                           21,503.00
10-06-2026  UPI/416492/Uber/uber@axis/Cab Trip             UPI0192875         220.00                           21,283.00
12-06-2026  ACH DR - GYM MEMBERSHIP MONTHLY               ACH0291039         550.00                           20,733.00
14-06-2026  UPI/416901/Zomato/zomato@hdfc/Lunch Order      UPI0192888         290.00                           20,443.00
17-06-2026  POS 892019 INDIAN OIL PETROL FUEL             POS991240          350.00                           20,093.00
19-06-2026  POS 491030 DMART SUPERMARKET PROVISIONS        POS991255        1,100.00                           18,993.00
21-06-2026  UPI/417204/BookMyShow/bms@icici/Movie Ticket   UPI0192899         450.00                           18,543.00
24-06-2026  ATM CASH WDL - KOTAK ATM ANDHERI               ATM029100          800.00                           17,743.00
28-06-2026  UPI/417902/Amazon/amazon@apl/Shopping Order    UPI0192910         750.00                           16,993.00
01-07-2026  ACH CR - TECHSOLUTIONS PVT LTD SALARY          CMS928104821                        20,000.00       36,993.00
02-07-2026  UPI/418289/Netflix/netflix@paytm/Subscription  UPI0193849         199.00                           36,794.00
03-07-2026  BBPS/MSEB Electricity Board Power Bill         BBPS829105         790.00                           36,004.00
04-07-2026  UPI/418982/Spotify/spotify@icici/Music         UPI0193850         119.00                           35,885.00
05-07-2026  ACH DR - JIO FIBER BROADBAND BILL              ACH0292024         599.00                           35,286.00
06-07-2026  POS 491040 BIGBASKET GROCERY ORDER             POS991280        1,350.00                           33,936.00
08-07-2026  UPI/419012/Swiggy/swiggy@axis/Food Delivery    UPI0193866         380.00                           33,556.00
11-07-2026  UPI/419201/Ola/ola@icici/Cab Travel            UPI0193878         240.00                           33,316.00
14-07-2026  UPI/419400/Zomato/zomato@hdfc/Food Order       UPI0193890         420.00                           32,896.00
16-07-2026  POS 892022 INDIAN OIL PETROL FUEL             POS991299          400.00                           32,496.00
18-07-2026  UPI/419610/Flipkart/flipkart@axis/Shopping     UPI0193902       1,200.00                           31,296.00
21-07-2026  POS 491045 BLINKIT GROCERY DELIVERY           POS991310          950.00                           30,346.00
24-07-2026  UPI/419800/Swiggy/swiggy@axis/Dinner Delivery  UPI0193915         460.00                           29,886.00
27-07-2026  POS 892040 PVR CINEMAS ENTERTAINMENT          POS991325          500.00                           29,386.00
30-07-2026  UPI/419950/Apollo Pharmacy/apollo@icici        UPI0193930         430.00                           28,956.00
01-08-2026  ACH CR - TECHSOLUTIONS PVT LTD SALARY          CMS928104822                        20,000.00       48,956.00
02-08-2026  UPI/420289/Netflix/netflix@paytm/Subscription  UPI0194849         199.00                           48,757.00
03-08-2026  BBPS/MSEB Electricity Board Power Bill         BBPS829106         820.00                           47,937.00
04-08-2026  UPI/420982/Spotify/spotify@icici/Music         UPI0194850         119.00                           47,818.00
05-08-2026  ACH DR - JIO FIBER BROADBAND BILL              ACH0293024         599.00                           47,219.00
06-08-2026  POS 491055 RELIANCE FRESH GROCERY              POS991350        1,420.00                           45,799.00
07-08-2026  UPI/421102/Swiggy/swiggy@axis/Late Night Food  UPI0194862         480.00                           45,319.00
09-08-2026  UPI/421290/Zomato/zomato@hdfc/Weekend Lunch    UPI0194875         540.00                           44,779.00
11-08-2026  UPI/421450/Uber/uber@axis/Cab Trip             UPI0194888         280.00                           44,499.00
13-08-2026  UPI/421600/Swiggy/swiggy@axis/Dinner Delivery  UPI0194901         460.00                           44,039.00
15-08-2026  UPI/421750/Myntra/myntra@kotak/Fashion Order   UPI0194914       1,890.00                           42,149.00
17-08-2026  POS 892055 INDIAN OIL PETROL FUEL             POS991370          450.00                           41,699.00
19-08-2026  POS 491060 ZEPTO GROCERY VEGETABLES            POS991385          880.00                           40,819.00
21-08-2026  UPI/422100/Dominos Pizza/dominos@icici         UPI0194930         620.00                           40,199.00
23-08-2026  UPI/422300/Swiggy/swiggy@axis/Late Dinner      UPI0194942         510.00                           39,689.00
25-08-2026  UPI/422500/Coursera/coursera@citi/Course Fee   UPI0194955       1,499.00                           38,190.00
27-08-2026  UPI/422700/Zomato/zomato@hdfc/Snack Order      UPI0194968         390.00                           37,800.00
29-08-2026  UPI/422900/Amazon/amazon@apl/Home Shopping     UPI0194980       1,350.00                           36,450.00
`.trim();

export function generateSamplePdfFile(): File {
  const lines = SAMPLE_STATEMENT_TEXT.split("\n");
  
  let streamContent = "BT\n/F1 8 Tf\n30 780 Td\n12 TL\n";
  for (const line of lines) {
    const escaped = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    streamContent += `(${escaped}) '\n`;
  }
  streamContent += "ET\n";

  const streamLength = new TextEncoder().encode(streamContent).length;

  const pdfParts = [
    "%PDF-1.4\n",
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n",
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}endstream\nendobj\n`,
  ];

  let offset = 0;
  const xref: number[] = [0];
  let body = "";
  for (const part of pdfParts) {
    xref.push(offset);
    body += part;
    offset += new TextEncoder().encode(part).length;
  }

  const startxref = offset;
  const trailer = `xref\n0 6\n0000000000 65535 f \n${xref.slice(1).map((x) => String(x).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const completePdf = body + trailer;
  const blob = new Blob([completePdf], { type: "application/pdf" });
  return new File([blob], "Arjun_Mehta_Bank_Statement_Aug2026.pdf", { type: "application/pdf" });
}
