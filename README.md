# MONEYMIND

> **“Don’t just track your money. Understand it.”**

Moneymind is a personalised financial behaviour intelligence platform designed to move beyond basic expense tracking. It analyses bank statements and transaction patterns, explains financial behaviours in plain language, delivers actionable recommendations, and empowers users to simulate how changing small daily habits accelerates their financial goals.

---

## 1. Problem Statement
Traditional fintech and expense apps act as passive digital ledger books—they show numbers and bar charts, but fail to answer fundamental human questions:
- *“Where is my money actually leaking?”*
- *“What does my spending pattern reveal about my habits?”*
- *“What specific, measurable change should I make?”*
- *“If I cut back on weekend food delivery by ₹1,200/month, how many months sooner do I reach my emergency fund?”*

## 2. Solution: Moneymind
Moneymind transforms raw statement data into behavioural intelligence:
1. **Understands Behaviour**: Detects month-over-month category spikes, recurring subscription creep, weekend spending concentrations, and discretionary vs. essential ratios.
2. **Explains in Plain Language**: Provides clear insights structured around *What happened?*, *Why?*, *What can you do?*, and *Financial Impact*.
3. **Simulates Habit Changes (What-If Simulator)**: Dynamic spending sliders with real-time recalculation of monthly savings, annual wealth compounding, and 12-month trajectory curves.
4. **Evaluates Financial Health**: An algorithmic 0–100 health score broken down into discipline, savings rate, recurring overhead, discretionary control, and goal milestones.

---

## 3. Key Features

- **Futuristic Fintech Interface**: Near-black/navy surface palettes, glassmorphism cards, glowing cyan accents (`glow-cyan`), smooth animated number counters, and responsive desktop/tablet/mobile layouts.
- **Automated PDF Statement Parsing**:
  - Drag-and-drop PDF statement ingestion (up to 10MB).
  - Coordinates-based text extraction using `pdfjs-dist` Web Worker.
  - Multi-format date detection (`DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MMM-YYYY`, `DD Mon YYYY`, etc.).
  - Transaction row identification with Debit (`Dr`) and Credit (`Cr`) classification.
  - Intelligent merchant noise cleaning (stripping UPI handles, POS codes, and reference tags).
  - Option to **Replace Current Data** or **Append to Data**.
  - Built-in **Sample Bank Statement Generator** and **Direct Text Paste** for turnkey demo testing.
- **In-Browser Machine Learning Categorisation**:
  - Genuine local **Multinomial Naive Bayes classifier** with Laplace smoothing.
  - Classifies merchant narration into categories (Food, Groceries, Transport, Shopping, Entertainment, Bills, Education, Healthcare, Subscriptions, Other).
  - Emits real-time category predictions with `ML Categorised` badges and confidence scores.
  - Works 100% client-side without external API calls or latency.
- **Interactive What-If Simulator**:
  - Category spending sliders with immediate feedback.
  - Live recalculation of monthly savings, annual savings difference, and goal duration acceleration.
  - 12-Month Area projection comparing *Current Trajectory* vs *Simulated Trajectory*.
  - Quick simulation presets (e.g. *Cut Food Delivery 30%*, *Cancel 2 Subscriptions*).
- **Personal Financial Health Dashboard**:
  - 0–100 overall score gauge with grade indicators (*Excellent*, *Good*, *Fair*, *At Risk*).
  - Weighted pillar breakdown: Spending Discipline (22%), Savings Behaviour (25%), Recurring Expenses (15%), Discretionary Outflow (18%), Goal Progress (20%).
  - *"Your Biggest Opportunity"* banner identifying the highest-leverage behavioural fix.
- **Searchable & Filterable Transactions Ledger**:
  - Real-time text search across merchants and categories.
  - Category and transaction type (All, Expense, Income) filters.
  - Sorting by Date and Amount.
  - **Manual Transaction Entry** modal with live Naive Bayes category auto-prediction.
  - Individual transaction deletion and total ledger reset.

---

## 4. Machine Learning Implementation

The ML categorisation engine (`src/lib/mm/classifier.ts`) implements an in-browser **Multinomial Naive Bayes** model:
- **Feature Extraction**: Bag-of-words tokenisation with lowercasing, punctuation stripping, and stopword/numeric filtering.
- **Priors & Likelihoods**:
  $$\log P(c \mid d) \propto \log P(c) + \sum_{w \in d} \log \left( \frac{\text{count}(w, c) + 1}{\sum_{w'} \text{count}(w', c) + |V|} \right)$$
- **Inference**: Computes posterior class probabilities and passes top scores through a softmax function to generate confidence ratings.
- **Privacy & Speed**: Trained on realistic merchant/description vectors directly in JS memory; zero bank data ever leaves the user's browser.

---

## 5. Tech Stack

- **Framework**: React 19 + TypeScript
- **Routing & SSR**: TanStack Router + TanStack Start (Nitro runtime)
- **Styling**: Tailwind CSS v4 + OKLCH glassmorphism design tokens
- **Data Visualisations**: Recharts (Pie charts, Area trends, Dual trajectory comparisons)
- **PDF Extraction**: `pdfjs-dist` (client-side text stream parser with fallback worker)
- **Icons & Primitives**: Lucide React + Radix UI
- **Local Persistence**: Browser `localStorage`

---

## 6. How to Run the Project

### Prerequisites
- Node.js (v18+ recommended)
- npm or bun

### Setup & Launch
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Or build for production preview
npm run build
npm run preview
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. 3-Minute Hackathon Demo Flow

1. **Landing Page**: Start at `/`. View the futuristic glowing brain visual, headline, and value propositions. Click **“Explore Demo”** (or **“Get Started”** for onboarding).
2. **Onboarding**: Step through the 3-step setup (Arjun, ₹20,000 income, Save ₹5,000/month). Click **“Build My Dashboard”**.
3. **Main Dashboard (`/app`)**:
   - Inspect KPIs: ₹20k Income, Total Spend, Current Savings, and Goal Progress.
   - Note the food delivery uptick observation in the snapshot.
4. **Personalised Insights (`/app/insights`)**:
   - See plain-language insight: *"Food delivery is trending upward (+31%)"*.
   - Click *"Why am I seeing this?"* to inspect transaction frequency evidence.
   - Review the recommendation: *"Cutting 2 delivery orders per week saves ~₹1,200/month"*.
5. **What-If Simulator (`/app/what-if`)**:
   - Click *"Test in What-If Simulator"*.
   - Slide Food spending from ₹4,200 down to ₹3,000.
   - Watch the animated counters increase monthly savings from ₹3,800 to ₹5,000 and accelerate the goal milestone by 3 months.
   - Examine the 12-month green trajectory widening over the baseline.
6. **Financial Health (`/app/health`)**:
   - Review the 78/100 composite health score and the *"Your Biggest Opportunity"* card.
7. **Transactions Ledger (`/app/transactions`)**:
   - Filter by category, search for *"Swiggy"*, observe the `ML Categorised` badges.
   - Click **“Add Transaction”**, type *"Zomato"*, and watch the ML model predict `Food` live.
8. **PDF Statement Upload (`/app/upload`)**:
   - Click **“Upload Statement”**.
   - Click **“Try Sample Statement PDF”** (or upload your own PDF / paste text).
   - Watch the animated 5-stage pipeline (**Upload → Extract → Analyse → Categorise → Complete**).
   - Click **“Replace Current Data”** and confirm it automatically updates the entire dashboard!

---

## 8. Limitations & Privacy Disclaimers

- **Informational Insights Only**: Moneymind provides algorithmic financial behaviour observations based strictly on the user-supplied data. It is not licensed financial advisory, credit auditing, or investment advice.
- **Client-Side Data Privacy**: No banking credentials, account numbers, or passwords are ever requested. Parsing occurs strictly inside the user's browser.
- **Scanned Image PDFs**: Statement extraction requires text layers. Scanned bitmap PDFs without OCR text streams should be parsed using the *Paste Statement Text* fallback.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/52a0f8df-3be0-4500-8bee-4fb712c4592c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
