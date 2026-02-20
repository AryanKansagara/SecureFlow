# SecureFlow — Devpost Submission

**Use this as your submission description. Copy sections into Devpost or adapt as needed.**

---

## Tagline

**Catch fraud before it happens — not after.**

SecureFlow is a real-time fraud detection demo that scores every transaction in under 100 milliseconds, explains every decision in plain English, and logs everything for compliance. Built to show what’s possible when you move AI into the transaction path — inspired by IBM’s Telum chip on the z16 mainframe.

---

## The Problem

Most fraud systems today run **after** the transaction is done. By the time a bank or card network flags something, the money has often already moved. That means:

- **More loss** — Fraud completes before anyone can block it.
- **More friction** — Customers get blocked or called only after the fact.
- **More risk** — Regulators and auditors want to know *why* a decision was made, and post-hoc systems are often a black box.

We wanted to show that it doesn’t have to be that way.

---

## What SecureFlow Does

SecureFlow is a **full-stack simulation** of real-time fraud detection at the point of transaction:

1. **Live transaction stream** — A dashboard sends synthetic transactions to our API. You see each one scored in real time: approved or flagged, with a risk score (0–100) and how long the decision took.
2. **Sub-100ms decisions** — Every transaction is evaluated in milliseconds. We track latency so you can see we’re fast enough to sit **inside** the authorization path — before approval.
3. **Explainable flags** — When we flag a transaction, we don’t just show a number. We show *why*: which signals fired (e.g. “amount way above normal,” “transaction from a new country”), a short plain-English explanation (powered by Groq when you add an API key), and a clear recommendation: **Hold**, **Verify**, or **Approve with warning**.
4. **Audit-ready** — Every decision is logged (transaction ID, score, threshold, signals, timestamp) so compliance and operations can trace exactly what happened.

So in one place you get: **speed**, **transparency**, and **auditability** — what banks and fintechs need when they think about putting AI in the transaction pipeline.

---

## Inspiration: IBM Telum

SecureFlow is inspired by **IBM’s Telum processor** in the IBM z16 mainframe. Telum does AI inference **on-chip** during transaction execution — no round-trip to a separate server, no extra latency. Fraud scoring happens in the same place and at the same time as the transaction itself.

We don’t run on Telum hardware; we **simulate the idea** in software. Our API acts like “inference in the request path”: the same process that receives the transaction also scores it and returns the decision. For a hackathon, that lets us show stakeholders and judges exactly what “real-time fraud detection at the point of transaction” looks like — and why it matters for security, compliance, and trust.

---

## How We Built It

- **Backend (Python / FastAPI):** One endpoint that accepts a transaction (amount, merchant, country, time, user/device) and returns a risk score, a flag (above a configurable threshold), and — when flagged — an explanation and recommendation. Scoring uses five signals: amount vs user average, geographic anomaly, transaction velocity, merchant category, and time-of-day. We kept the hot path under 100ms and log every decision to stdout for audit.
- **Explainability:** For flagged transactions we either use **Groq** (with your API key) to generate a short, human-readable explanation from the signals, or fall back to template-based text. Recommendations (Hold / Verify / Approve with warning) are rule-based from the score.
- **Frontend (React / TypeScript / Vite):** A single dashboard: start/stop a live stream of synthetic transactions, see each one in a virtualized list with score and latency, and click any **Flagged** row to open a side panel with the full explanation and signals. We added a “Demo mode” that injects more fraud-like patterns so you see flags quickly during a demo.
- **Run locally or with Docker:** Backend and frontend run with a few commands; optional Docker Compose for a one-command stack.

---

## Challenges We Ran Into

- **Making flags visible in the demo:** With a high threshold (e.g. 75), our synthetic data rarely reached it. We tuned the scoring (e.g. stronger weight for “amount way above average” and “new country”), lowered the default threshold for the demo, and added Demo mode so the stream regularly produces flagged transactions.
- **Keeping latency low with explainability:** Calling an external API (Groq) for every flagged transaction can add delay. We only call it when a transaction is already flagged, and we fall back to template text if the key isn’t set or the call fails, so the core score-and-flag path stays fast.
- **Datetime bug in velocity:** We initially computed “60 minutes ago” incorrectly and hit validation errors. We fixed it by using a proper time delta instead of manipulating minute values.

---

## What We're Proud Of

- **End-to-end story:** From “why this matters” (post-transaction fraud is too late) to a working demo you can run and click through in minutes.
- **Real-time + explainable:** Sub-100ms scoring *and* plain-English reasons for every flag, plus a clear recommendation — the kind of thing operations and compliance teams ask for.
- **Telum-inspired design:** Inference in the same path as the transaction, with a clear link to how IBM Telum does on-chip AI in the z16.
- **Demo-friendly:** Demo mode, latency meter, risk gauge, and one-click side panel for flagged transactions so judges and viewers can see the value without reading code.

---

## What We Learned

- Moving fraud detection “into the transaction path” isn’t just a slogan — it changes when you can act (before approval) and how you can explain it (inline, with full context).
- Explainability and auditability are as important as accuracy for adoption in regulated environments; we designed for both from the start.
- Small bugs (like the velocity time window) can break the whole pipeline; testing the full flow early saved us.

---

## What's Next for SecureFlow

- **Configurable threshold and weights** in the UI so analysts can tune sensitivity.
- **Audit log export** (CSV/JSON) for compliance and post-demo analysis.
- **More signals and optional ML** while keeping explanations and audit trail.
- **Integration hooks** (e.g. webhooks or event stream) so SecureFlow can plug into real authorization pipelines or run alongside IBM z16/Telum in enterprise pilots.

---

## Try It Out

1. **Clone the repo** and open the project.
2. **Backend:**  
   `cd backend` → create a virtualenv, `pip install -r requirements.txt`, set `GROQ_API_KEY` in `.env` (optional, for AI explanations), then run  
   `uvicorn app.main:app --reload --port 8000`
3. **Frontend:**  
   `cd frontend` → `npm install` → `npm run dev`
4. Open **http://localhost:5173**, check **Demo mode**, click **Start stream**, and click any **Flagged** row to see the explanation and recommendation.

Docs in the repo: [PRD](docs/SecureFlow_PRD.md), [Tech Stack](docs/SecureFlow_Tech_Stack.md).

---

## Built With

- **Backend:** Python, FastAPI, Pydantic, Groq (optional, for explanations), python-dotenv
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, TanStack Virtual
- **Deployment:** Docker, Docker Compose (optional)
- **Inspiration:** IBM Telum processor (IBM z16) — real-time AI inference in the transaction path

---

## UN Sustainable Development Goals (SDGs) targeted

- **SDG 8 (Decent work and economic growth):** Reducing fraud supports financial stability and sustainable economic activity; fewer losses and disputes strengthen trust.
- **SDG 9 (Industry, innovation and infrastructure):** Real-time AI in financial infrastructure (inspired by Telum); resilient and efficient payment systems.
- **SDG 16 (Peace, justice and strong institutions):** Explainability and auditability support transparent, accountable institutions; fraud detection supports integrity of financial systems.

---

## Team
Built by Aryan.
---

*SecureFlow — Real-time fraud detection at the point of transaction. Inspired by IBM Telum. Built for the IBM Z Mini Hackathon.*
