# Aion Dashboard — v6

A multi-page macro investment platform: Macroeconomics → Economic Cycle →
Sector Scoring → ETF Ideas, with a full explainability layer, an
automatically-generated Update Log, an admin-approved subscriber
notification system, and a historical backtesting tool.

**The core macro engine (Investment Clock, regime classification, indicator
calculations, factor weights, scoring model) is unchanged since v3.** Every
addition since then — including everything in this version — is a display,
storage, or communication layer built on top of it. The backtest feature in
particular calls the exact same `runMacroEngine` function the live dashboard
uses, just fed historical data truncated to a chosen date — nothing about
the calculation itself is different or duplicated.

## What's new in v6

| Feature | Where |
|---|---|
| Fix: (?) explanations were hidden behind cards. Tooltips now render through a portal at the page root, escaping the `backdrop-blur` stacking context that trapped them | every page |
| "Top 3 sectors" is now concise: name, score, a short score explanation, the 3 ETFs. Tactical Readiness is still there, behind a toggle | `/invest` |
| Overweight / Neutral / Underweight lines now expand to show the 3 most prominent investable assets | `/invest` |
| "Active since" date per Top 3 sector, persisted in KV (the real start of the current streak, not today's date) | `/invest` |
| FX: policy rate + 10Y yield for EUR, USD, GBP, JPY, CAD, NZD, CHF, AUD, a currency strength ranking and a ranked FX pair list | `/signals` |
| Automated Market Narrative: pick an asset, 3 scenarios generated from live data, logged, re-evaluated daily, with a full history | `/narrative` |

Kept exactly as before: All Sectors Ranked, Data Status, Holding Horizon, the manual narrative worksheet, and all existing engines.

### How the automated narrative works
1. You pick a risk asset (S&P 500, Gold, Oil, Dollar Index, EUR/USD, Technology, Energy, Long-Duration Bonds).
2. The platform reads that asset's key signal from the existing engines and generates Bullish / Base / Bearish scenarios with reasoning and confirm/negate conditions.
3. The set is saved to KV with a timestamp. Nothing is ever overwritten.
4. A daily cron (`/api/cron/narrative-check`, added to `vercel.json`) and the "Check against new data" button re-read the same signal and mark the narrative Confirmed, Negated or Still unresolved, logging the evidence each time.

Honest limits: the scenarios are rule-based on live platform data, not AI-written text (no language model is connected). "New data" is checked daily, not streamed in real time.

### FX data notes
Bond yields use FRED's OECD series (`IRLTLT01{country}M156N`, verified for the countries involved). Short rates use the standard reference rate where FRED has one (Fed Funds, ECB Deposit Facility Rate, 3M interbank/CD/deposit rates for GBP, JPY, CHF, and OECD interbank series for CAD, NZD, AUD). Each series is fetched independently: if one is missing or renamed, only that cell shows N/A. Several of these are OECD monthly series, so they update monthly and can lag.
The strength score and pair divergence are a transparent carry-style heuristic (rate level vs the 8-currency average plus rate/yield trend), not a forecast.

## What's new in v5

| Feature | Where |
|---|---|
| (?) info icons explaining Macro Score and Overweight/Neutral/Underweight | `/`, `/invest` |
| Tactical Readiness now hides silently instead of showing "unavailable" errors | `/invest` |
| Permanent "Get Notified" button + modal, always visible in the sidebar | every page |
| Automatic confirmation email on subscribe | `/api/subscribe` |
| Notifications management section (subscriber count, regime history, send history, failed deliveries, a regime-confidence advisory) | `/admin` |
| **Backtest Strategy** — pick any date, see the historical regime and real subsequent ETF performance | `/backtest` |

## The Backtest feature, in more detail

- You pick a date (or a preset like "Jan 2008, pre-crisis").
- The app fetches the same FRED series the live engine uses, but with a much
  longer history, then truncates every series to that date and runs it
  through **the unmodified `runMacroEngine`** — so "what regime was active"
  uses identical logic to today's dashboard, just on older data.
- It then looks up real subsequent price performance (3/6/9/12/24 months
  later) for six ETF proxies — SPY (S&P 500), TLT (bonds), GLD (gold), and
  XLE/XLK/XLF (Energy/Tech/Financials) — via Stooq, the same free price
  source the live Tactical Readiness feature already uses.

**Honest limits, shown in the UI rather than hidden:**
- Full coverage starts around 1999 (when the sector SPDR ETFs launched).
- TLT (bonds) has data from mid-2002; GLD (gold) from late-2004. Earlier
  dates show those specific rows as unavailable — never a guessed number.
- If a horizon date falls in the future (e.g. backtesting a date from last
  month and asking for 24-month performance), it's shown as "in the future,"
  not an error.

This is a genuine historical read, not a fabricated one — but it's also not
a rigorous quant backtest (no transaction costs, slippage, or position
sizing) — it's built to do exactly what the spec asked: build confidence by
showing how the existing model would have called past regimes, using real
data throughout.

## Getting it live

Same setup as v4 — nothing new to configure for this version specifically.
If you're starting fresh, see the full steps below; if you already have v4
running, just redeploy with these files and everything continues to work
with your existing environment variables.

### 1. FRED API key
https://fred.stlouisfed.org/docs/api/api_key.html

### 2. Upload this folder to GitHub
https://github.com/new → "uploading an existing file" → drag in everything here → commit.

### 3. Import into Vercel
https://vercel.com/new → import the repo. Add environment variables before deploying (step 4-6), or add them after and hit Redeploy.

### 4. Add Vercel KV (subscribers + regime history + notification log)
Project → **Storage** tab → **Create Database** → **KV** (or, if you don't
see "KV" directly, **Marketplace** → search **Redis** → **Upstash**, same
thing). Connect it to this project — `KV_REST_API_URL` and
`KV_REST_API_TOKEN` are added automatically.

### 5. Add Resend (sending confirmation + campaign emails)
Sign up free at resend.com, create an API key, verify your sending domain
under **Domains**, then set:
```
RESEND_API_KEY=your_key
RESEND_FROM_EMAIL=updates@yourdomain.com
```
(Use `onboarding@resend.dev` temporarily if you don't have a verified domain
yet — it only delivers to your own Resend account email until you verify one.)

### 6. Admin environment variables
```
ADMIN_PASSWORD=choose_your_own_password
ADMIN_SESSION_SECRET=any_long_random_string
CRON_SECRET=optional_random_string
```
Set these directly in Vercel — never in a file.

### 7. Deploy
Vercel Cron calls `/api/cron/regime-check` daily (see `vercel.json`) to log
regime changes automatically, ready for you to review and send from `/admin`.

## Architecture notes — what's new this version

- `lib/explanations.ts` — the Macro Score and allocation-tilt explanation
  text, shown via the extended `components/Tooltip.tsx` (now accepts either
  a dictionary lookup or direct text, for longer explanations).
- `components/GetNotifiedModal.tsx` — reuses `SubscribeForm` and
  `/api/subscribe` exactly as the footer signup does. No duplicate
  subscription system, per the spec's explicit requirement.
- `lib/email.ts` — added `sendConfirmationEmail`, alongside the existing
  campaign sender; the confirmation is sent automatically from
  `/api/subscribe`, best-effort (a signup still succeeds even if the email
  has a transient issue).
- `lib/campaignLog.ts` + `app/api/admin/notifications/route.ts` — the new
  admin notifications management data: subscriber count, regime history,
  send history, failed-delivery counts, and a confidence-based "is the
  regime looking stable" advisory (explicitly not a prediction).
- `lib/backtest.ts` — the backtest engine. Reuses `runMacroEngine` and
  `fetchSeries` from the existing files unmodified; reuses
  `fetchStooqDaily` from `lib/tacticalReadiness.ts` (now exported) for
  price history. Only new code: date-truncation and subsequent-performance
  lookup.
- `app/api/backtest/route.ts` / `app/backtest/page.tsx` — the new page and
  its API route.

## Still not built (unchanged focus areas)

- **COT Report page** — CFTC's free weekly report; its own data pipeline.
- The AI/NLP layer reading FOMC/CPI releases directly.
- Company-level fundamentals and portfolio construction.
- Non-US central banks (ECB, BoE, BoJ).
- Unsubscribe / email-compliance handling (still worth adding before
  emailing any real-sized list — see the compliance note below).

## A note on compliance

Once you're sending real emails to real subscribers, standard email rules
apply (CAN-SPAM in the US, GDPR if you have EU subscribers) — at minimum
that means an unsubscribe mechanism, which isn't built yet. Worth adding
before this goes out to a real list of any size.
