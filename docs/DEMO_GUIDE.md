# SecureFlow — Demo Guide

How the app works and what to show in a demo.

---

## How it works (in 30 seconds)

1. **You start the stream** — The dashboard sends **synthetic transactions** (fake but realistic) to the backend, one every few hundred milliseconds.
2. **Each transaction is scored in real time** — The backend runs five fraud signals (amount vs average, geography, velocity, merchant category, time of day), adds them up into a **risk score 0–100**, and compares it to a **threshold (75)**. If score ≥ 75, the transaction is **flagged**.
3. **You see results live** — The top of the screen shows **latency** (how fast the API responded) and **risk score**. The list below is a **live stream**: each row is one transaction with its score, latency, and whether it was approved or **Flagged**.
4. **Flagged = explainable** — When you **click a flagged row**, a side panel opens with a **plain-English explanation** (which signals fired), a **recommendation** (Hold / Verify / Approve with warning), and the full signal breakdown. Every decision is also **logged** for audit (backend stdout).

So: **fraud detection happens before “approval”** — inline in the transaction path — and every flagged decision is explained.

---

## What to show (step-by-step)

### Before you start

- Backend running: `cd backend && .venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload --port 8000`
- Frontend running: `cd frontend && npm run dev`
- Open **http://localhost:5173** in the browser.

---

### 1. Set the scene (30 sec)

**Say something like:**  
*“Most fraud systems today run after the transaction is already done — so the money is gone before we can act. SecureFlow shows how we can score fraud **at the point of transaction**, in under 100 milliseconds, and block or hold before approval.”*

**Show:** The dashboard before starting (empty stream, latency “—”, risk “—”).

---

### 2. Start the stream and show “real time”

**Do:** Click **“Start stream”**.

**Say:**  
*“The dashboard is now sending synthetic transactions to our inference engine. Each one is scored in real time — you see approval vs flagged, the risk score, and how long the API took.”*

**Show:**

- Rows appearing in the **live stream** (amount, merchant, score, latency, OK vs **Flagged**).
- **Latency** (last and P95) — ideally staying **under 100 ms** (green).
- **Risk score** bar updating with the latest score.

---

### 3. Highlight a flagged transaction and explainability

**Do:** Wait until at least one row shows **“Flagged”** (the simulator occasionally injects high-amount or new-country patterns). **Click that row.**

**Say:**  
*“When we flag something, we don’t just show a number — we show **why**. Here you see the explanation in plain English, which signals contributed, and a recommended action: Hold, Verify, or Approve with warning. That’s what compliance and fraud analysts need.”*

**Show:**

- **Side panel** with:
  - Transaction ID, amount, merchant.
  - **Risk score.**
  - **Recommendation** (e.g. “Hold” or “Verify”).
  - **Explanation** (e.g. “Amount significantly above 30-day average…”).
  - **Signals** list (each signal and its description/contribution).

---

### 4. Latency and “before approval”

**Do:** Keep the stream running; point at the **Latency** box.

**Say:**  
*“We’re targeting under 100 milliseconds end-to-end. That’s fast enough to sit **inside** the authorization path — like IBM Telum on the z16, which does AI inference on-chip during transaction processing. We’re simulating that idea in software.”*

---

### 5. (Optional) Audit trail

**Do:** Switch to the terminal where the backend is running.

**Say:**  
*“Every decision is logged for audit. No black box — we have a full trail: transaction ID, score, threshold, which signals fired, and timestamp.”*

**Show:** A few lines of JSON in the backend console (each line = one decision).

---

### 6. Wrap up

**Say:**  
*“So in one place you get: real-time scoring, sub-100ms latency, clear explanations for every flag, and a full audit trail — the kind of thing banks and compliance teams need when they evaluate real-time fraud infrastructure.”*

Then click **“Stop stream”** when you’re done.

---

## Quick reference: what’s on the screen

| Area | What it is |
|------|------------|
| **Header** | “SecureFlow”, tagline, **Interval (ms)** (speed of stream), **Start / Stop stream** |
| **Latency** | Last response time and P95; green = under 100 ms, amber = over |
| **Risk score** | Bar 0–100 and latest score; “Flagged” if ≥ threshold (75) |
| **Live stream** | Scrollable list: #, amount, merchant, score, latency, OK / Flagged. **Click a Flagged row** → side panel |
| **Side panel** | Opens when you click a flagged row: explanation, signals, recommendation. **X** to close |

---

## Tips

- **Stable demo:** Use a moderate interval (e.g. 800 ms). Too fast (e.g. 200 ms) can make the UI very busy.
- **Get a flag quickly:** The sim injects “fraud” patterns randomly (~8% of transactions). If nothing flags for a while, **Stop** and **Start** again to get a fresh run, or lower the backend threshold (e.g. `set SECUREFLOW_THRESHOLD=60` and restart) so more transactions flag.
- **If the API is slow:** Run backend and frontend on the same machine; avoid VPN or remote API for the demo so latency stays low.
- **One-liner:** *“SecureFlow is a simulation of real-time fraud detection at the point of transaction — score in under 100 ms, explain every flag, and log everything for audit.”*
