# SecureFlow — Real-Time Fraud Detection at the Point of Transaction

A full-stack simulation platform that demonstrates **real-time fraud detection** inline within the transaction processing pipeline, inspired by IBM's Telum AI chip in the IBM z16 mainframe.

## Quick start

### Prerequisites

- **Backend:** Python 3.10+
- **Frontend:** Node.js 18+

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard: http://localhost:5173

Use **Start stream** to send synthetic transactions to the API. The dashboard shows a live stream, latency meter, risk score, and a side panel for flagged transactions (with explanation and recommendation).

## Project structure

```
├── docs/           # PRD, tech stack, execution plan
├── backend/        # FastAPI inference engine + scoring + explainability + audit
├── frontend/       # React dashboard (Vite, Tailwind, TanStack Virtual)
├── .env.example
└── README.md
```

## Features

- **Inference engine:** `POST /api/v1/transactions/evaluate` returns fraud risk score (0–100), flagged (≥75), latency, and (when flagged) plain-English explanation and recommendation.
- **Five signals:** Amount vs average, geographic anomaly, transaction velocity, merchant category deviation, time-of-day anomaly.
- **Audit:** Every decision is logged as a JSON line to stdout.
- **Dashboard:** Live transaction stream (virtualized), latency meter (last + P95), risk gauge, side panel for flagged transactions.

## Configuration

- **Threshold:** Set `SECUREFLOW_THRESHOLD` (default 35) in the backend environment.
- **Stream speed:** Use the "Interval (ms)" control on the dashboard (e.g. 800 ms ≈ 1.25 TPS).
- **AI explanations (optional):** Create `backend/.env` with `GROQ_API_KEY=your_key` (or set the env var when starting the server) to use Groq for natural-language explanations on flagged transactions. If unset, template-based explanations are used. Get a key at [console.groq.com](https://console.groq.com). (`.env` is in `.gitignore`.)

## Troubleshooting

- **400 Bad Request:** The backend was fixed for a bug in the velocity signal (invalid datetime). Ensure you have the latest `backend/app/scoring.py`. If you still see 400, check the backend terminal for the exception message.
- **Proxy / network errors:** The frontend proxies `/api` to the backend only when you run `npm run dev`. Start the **backend first** on port 8000, then start the frontend. If the dashboard can’t reach the API, confirm the backend is running at http://localhost:8000 and try http://127.0.0.1:8000 in the proxy (see `frontend/vite.config.ts`).
- **422 Unprocessable Entity:** The request body didn’t match the API (e.g. wrong field names or types). The dashboard sends `amount`, `currency`, `merchant_id`, `merchant_category`, `country`, `timestamp` (ISO string), and optional `user_id`, `device_id`. Check the browser Network tab for the response `detail` array.

## References

- [Product Requirements Document](docs/SecureFlow_PRD.md)
- [Technology Stack](docs/SecureFlow_Tech_Stack.md)
- [Execution Plan](docs/EXECUTION_PLAN.md)
