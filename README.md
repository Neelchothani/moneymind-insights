# Moneymind Insights

Build a complete, polished, hackathon-ready web application called **MONEYMIND** with the tagline:

**“Don’t just track your money. Understand it.”**

Moneymind is a personalised financial behaviour intelligence platform. It should go beyond being a basic expense tracker. The application must analyse a user's financial data, identify spending behaviour and patterns, explain those patterns in simple language, provide personalised and actionable recommendations, and allow the user to simulate how changing their behaviour could affect their financial goals.

## 1. CORE OBJECTIVE

The application must answer four questions:

1. Where is my money going?
2. What does my spending behaviour tell me?
3. What should I change?
4. If I change it, how will it affect my financial goal?

The project is for a **6-hour hackathon**, so prioritise a highly polished working prototype, strong visual presentation, functional interactions, and a convincing end-to-end user flow over unnecessary enterprise features.

Do NOT build a generic expense tracker, banking application, investment platform, payment application, or generic AI chatbot.

---

# 2. DESIGN DIRECTION

Create a **premium futuristic fintech interface** inspired by modern financial intelligence dashboards.

Visual language:

* Dark premium background
* Near-black / deep navy surfaces
* Cyan/teal as the primary accent
* Green for positive financial progress
* Purple/orange accents used sparingly
* Soft gradients
* Glassmorphism-style cards
* Large rounded corners
* Subtle borders
* Soft glow effects
* Clean modern typography
* High information density without feeling cluttered
* Strong visual hierarchy
* Smooth animations
* Premium SaaS/fintech aesthetic
* Responsive on desktop, tablet and mobile

The overall feeling should be:

**“Apple-level simplicity + futuristic fintech intelligence.”**

Avoid:

* Generic Bootstrap-looking interfaces
* Excessive gradients
* Excessive neon
* Cluttered dashboards
* Stock-photo-heavy layouts
* Cartoonish graphics
* Generic AI-chat interfaces

Use subtle visual effects and animations to make the product feel intelligent and premium.

---

# 3. APPLICATION STRUCTURE

Build the following complete flow:

**Landing Page → Onboarding → Dashboard → Transactions → Financial Analysis → Personalised Insights → What-If Simulator → Financial Health**

The navigation should allow users to move naturally between these sections.

---

# 4. LANDING PAGE

Create a premium landing page.

Hero section:

Headline:

**“Your money has patterns. Moneymind helps you see them.”**

Supporting text:

“Understand your spending behaviour, discover where your money is really going, and make smarter decisions based on your personal financial goals.”

Primary CTA:

**“Understand My Money”**

Secondary CTA:

**“Explore Demo”**

Include a futuristic financial-intelligence visual on the hero section, such as an abstract glowing financial brain/person surrounded by spending lines, charts, financial nodes and goal indicators.

Include a dashboard preview beneath or beside the hero.

Add three concise value propositions:

* **Understand** — Discover hidden spending patterns.
* **Personalise** — Get recommendations based on your behaviour.
* **Simulate** — See what happens before you change your habits.

---

# 5. ONBOARDING

Create a clean multi-step onboarding experience.

Collect:

* Name
* Monthly income
* Current financial situation

  * Student
  * Young Professional
  * Family
  * Other
* Primary financial goal

  * Save more
  * Control spending
  * Build emergency fund
  * Reach a specific target
* Monthly savings target
* Optional target amount

Example demo profile:

Name: Arjun
Monthly income: ₹20,000
Goal: Save ₹5,000/month

Make onboarding visually polished with a progress indicator.

At completion, generate the user's personalised financial dashboard.

---

# 6. DATA INPUT SYSTEM

The application must support multiple ways to provide financial data.

### A. Demo Data

Provide a prominent:

**“Load Demo Data”**

button.

This should immediately populate the application with realistic sample transactions.

Create at least **40–60 realistic transactions** covering multiple months.

Example categories:

* Food
* Groceries
* Transport
* Shopping
* Entertainment
* Bills
* Education
* Healthcare
* Subscriptions
* Other

Create intentional behavioural patterns in the dataset so the analysis engine can identify meaningful insights.

For example:

* Food delivery increasing month-over-month
* Higher weekend spending
* Recurring subscriptions
* Shopping spikes
* Stable income
* Regular bills
* Increasing discretionary spending

### B. Manual Transaction Entry

Allow users to add:

* Merchant
* Amount
* Category
* Date

### C. PDF Statement Upload

Create a visually prominent section:

**“Upload Financial Statement”**

Support PDF uploads.

The application should:

1. Accept a PDF.
2. Extract readable text from the PDF.
3. Detect transaction-like rows.
4. Extract:

   * Merchant
   * Amount
   * Date when available
5. Categorise transactions automatically.
6. Add the extracted transactions to the dashboard.
7. Recalculate financial insights.

Display processing states:

**Uploading → Extracting → Analysing → Categorising → Complete**

Show a clear success state after processing.

Do not require real banking integration.

---

# 7. ML COMPONENT — REQUIRED

The application MUST contain a genuine lightweight machine-learning component.

Do not simply hard-code:

“If merchant contains Swiggy → Food.”

Implement a simple **in-browser text classification model**, preferably a lightweight **Multinomial Naive Bayes classifier**, trained on merchant/category examples.

Example training data:

* Swiggy → Food
* Zomato → Food
* Uber → Transport
* Ola → Transport
* Amazon → Shopping
* Netflix → Entertainment
* Spotify → Entertainment
* Reliance Fresh → Groceries
* BigBasket → Groceries
* Electricity Board → Bills
* Coursera → Education

The model should receive merchant/transaction text and predict a category.

Display an optional small indicator such as:

**“ML Categorised”**

for transactions classified automatically.

The ML system should work locally in the browser and should not depend entirely on an external AI API.

---

# 8. MAIN DASHBOARD

Create the primary Moneymind dashboard.

Top section:

**“Good morning, Arjun.”**

Supporting message:

**“Here’s what your money is telling you this month.”**

Show KPI cards:

* Monthly Income
* Total Spending
* Current Savings
* Savings Goal

Use animated number counters.

Include:

### Spending Overview

Interactive chart showing spending by category.

### Monthly Trend

Show income vs spending vs savings across months.

### Goal Progress

Example:

**₹3,800 / ₹5,000 saved**

with an animated progress indicator.

### Recent Transactions

Show merchant, category, amount and date.

### Financial Snapshot

Show:

* Spending
* Savings
* Recurring expenses
* Discretionary spending

with simple status indicators such as:

**Healthy / On Track / Watch / High**

---

# 9. BEHAVIOUR ANALYSIS ENGINE

Create a rule-based financial behaviour analysis engine operating on the transaction dataset.

It should calculate:

* Total spending
* Spending by category
* Category percentage of income
* Month-over-month changes
* Average transaction value
* Transaction frequency
* Weekend vs weekday spending
* Recurring expenses
* Discretionary spending
* Savings rate
* Largest spending categories
* Largest increases
* Potential savings opportunities

Do not just display raw numbers.

Convert the calculations into meaningful behavioural observations.

---

# 10. PERSONALISED INSIGHTS

Create a dedicated **Insights** section.

Each insight should contain:

### What happened?

Example:

**“Your food delivery spending increased by 31% this month.”**

### Why?

**“You made 8 delivery orders this month compared with 5 last month.”**

### What can you do?

**“Reducing your delivery orders by 2 per week could save approximately ₹1,200 per month.”**

### Impact

Show:

**Potential monthly saving: ₹1,200**

Each insight should have a visual priority level:

* High Impact
* Medium Impact
* Positive
* Watch

Generate multiple insights from the actual transaction data.

Include a small:

**“Why am I seeing this?”**

interaction explaining which transaction patterns produced the insight.

---

# 11. PERSONAL FINANCIAL HEALTH

Create a Financial Health section.

Show a visual financial health score, for example:

**78 / 100**

Break it down into:

* Spending discipline
* Savings behaviour
* Recurring expenses
* Discretionary spending
* Goal progress

Do not present the score as a professional financial diagnosis or guaranteed financial advice.

Present it clearly as an **informational behavioural indicator** based on the user's supplied data.

Include:

**“Your biggest opportunity”**

Example:

“Reducing discretionary food spending could help you reach your savings target faster.”

---

# 12. KILLER FEATURE — WHAT-IF SIMULATOR

This should be one of the strongest features of the application.

Create a page/card called:

**“What If?”**

Description:

**“See how a small change today could affect your financial goal.”**

Allow the user to adjust category spending using sliders.

Example:

Food spending:
₹4,200 → slider → ₹3,000

As the user changes the slider, dynamically update:

* Monthly savings
* Annual savings
* Goal progress
* Estimated time to reach goal
* Potential money saved

Example:

Current:

**₹3,800/month savings**

After change:

**₹5,000/month savings**

Show:

**“You could reach your goal 3 months earlier.”**

Make this highly visual and animated.

Use smooth number transitions.

---

# 13. TRANSACTION PAGE

Create a searchable/filterable transaction table.

Columns:

* Date
* Merchant
* Amount
* Category
* Type
* ML Status

Features:

* Search
* Category filter
* Date filter
* Sort by amount
* Add transaction
* Delete transaction

Use badges for categories.

---

# 14. PDF UPLOAD EXPERIENCE

Make the PDF upload visually impressive.

Create a drag-and-drop area with:

**“Drop your financial statement here”**

and:

**“PDF up to 10MB”**

When uploaded, display an animated processing pipeline:

**PDF → Text Extraction → Transaction Detection → ML Categorisation → Behaviour Analysis**

Then show:

**“47 transactions imported successfully.”**

and automatically update the dashboard.

Include a privacy message:

**“Your uploaded statement is processed for this prototype and is not connected to your bank.”**

Do not implement real bank login or banking credentials.

---

# 15. NAVIGATION

Create a polished sidebar/top navigation containing:

* Overview
* Transactions
* Insights
* Financial Health
* What If?
* Upload Statement

Include the Moneymind logo.

On mobile, convert the navigation into a clean responsive mobile navigation.

---

# 16. ANIMATIONS

Use **GSAP** or an equivalent animation library.

Implement subtle, professional animations:

* Page transitions
* Number counters
* Chart entrance animations
* Progress bar animation
* Insight card reveal
* Hover effects
* Slider transitions
* Upload processing animation
* Goal completion animation

Animations should improve the experience without becoming distracting.

---

# 17. VISUALISATIONS

Use a professional charting library such as **Recharts** or **Chart.js**.

Include:

* Donut chart for category spending
* Line chart for monthly spending
* Income vs spending chart
* Goal progress
* Category comparison
* What-If projection

Charts must be responsive and interactive.

---

# 18. RESPONSIVE DESIGN

The entire application must work on:

* Desktop
* Laptop
* Tablet
* Mobile

Do not simply shrink the desktop UI.

Create proper mobile layouts.

---

# 19. TECH STACK

Prefer:

* React
* Vite
* Tailwind CSS or clean modular CSS
* GSAP
* Recharts or Chart.js
* PDF.js for PDF text extraction
* Lightweight in-browser ML implementation
* LocalStorage for persistence

Avoid unnecessary backend complexity.

The application must run locally without requiring a database.

If an external AI API is used, it must be optional. The core application must still work without it.

---

# 20. DATA ARCHITECTURE

Separate the application into clear modules:

* Components
* Pages
* Data
* ML/classification engine
* Behaviour analysis engine
* Recommendation engine
* PDF processing
* Utilities

Keep the code clean and maintainable.

Use reusable components instead of duplicating UI.

---

# 21. PERSONALISATION ENGINE

Recommendations must be generated from the user's actual financial behaviour.

For example:

If food spending increases significantly:

**“Food spending is trending upward. Reducing two delivery orders per week could save approximately ₹1,200/month.”**

If subscriptions are high:

**“You have 5 recurring subscriptions costing ₹1,097/month. Reviewing one or two could improve your monthly savings.”**

If savings are on target:

**“You're currently on track to reach your ₹5,000 monthly savings goal.”**

Recommendations should be specific, measurable and actionable.

Avoid generic statements such as:

“Spend less money.”

---

# 22. SAMPLE DEMO EXPERIENCE

The application should be preconfigured so that the hackathon demo works immediately.

Demo user:

**Arjun**

Income:

**₹20,000/month**

Goal:

**Save ₹5,000/month**

The sample data should intentionally produce a compelling story:

1. Arjun loads demo data.
2. Moneymind analyses his transactions.
3. The dashboard shows his financial overview.
4. Moneymind detects increasing food-delivery spending.
5. It explains the behaviour.
6. It recommends reducing delivery spending.
7. Arjun opens What If?
8. He reduces food spending using the slider.
9. The projected savings increase.
10. The application shows that his financial goal can be reached faster.

This complete story should be demonstrable in approximately **2–3 minutes**.

---

# 23. ERROR AND EMPTY STATES

Create polished states for:

* No transactions
* No insights
* Invalid PDF
* Empty PDF
* PDF processing failure
* Invalid transaction
* Loading
* Uploading
* Processing
* Success

Never leave blank screens.

---

# 24. TRUST AND SAFETY

Clearly communicate that Moneymind provides informational financial-behaviour insights based on supplied data.

Do not claim:

* Professional financial advice
* Guaranteed savings
* Guaranteed investment returns
* Bank-level financial security
* Medical/financial professional certification

Do not request banking passwords, OTPs, card numbers or sensitive credentials.

---

# 25. FINAL UI QUALITY

The final application should look like a **real startup product**, not a college CRUD project.

Prioritise:

* Strong typography
* Excellent spacing
* Consistent cards
* Consistent icons
* Smooth animations
* Beautiful charts
* Clear hierarchy
* Professional empty/loading states
* High-quality responsive design
* Cohesive visual identity

Use realistic data throughout the demo.

---

# 26. REQUIRED FINAL OUTPUT

Build the entire working application in one flow.

Do not stop after creating the landing page.

Implement:

**Landing → Onboarding → Data Input/PDF Upload → ML Categorisation → Dashboard → Behaviour Analysis → Personalised Insights → Financial Health → What-If Simulator → Transactions**

Make all major buttons and interactions functional.

Seed the application with demo data so it can be tested immediately.

After implementation:

1. Run the application.
2. Check for build/runtime errors.
3. Fix all errors.
4. Verify navigation.
5. Verify demo data.
6. Verify PDF upload and extraction.
7. Verify ML categorisation.
8. Verify charts.
9. Verify What-If calculations.
10. Verify responsive layout.
11. Ensure the application starts successfully with the provided run command.

Also create a concise **README.md** explaining:

* What Moneymind is
* Problem statement
* Solution
* Key features
* ML implementation
* Tech stack
* How to run the project
* Hackathon demo flow
* Limitations

The final result should be a **fully functional, visually polished, hackathon-ready Moneymind prototype**, with the visual identity and product experience centred around intelligent financial behaviour analysis rather than simple expense tracking.

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
