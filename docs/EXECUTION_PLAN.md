# SecureFlow — Execution Plan

**Purpose:** Order of implementation to build the MVP in one shot.  
**References:** [PRD](./SecureFlow_PRD.md), [Tech Stack](./SecureFlow_Tech_Stack.md)

---

## 1. Target outcome

- **Backend:** FastAPI app with `POST /api/v1/transactions/evaluate` that returns score, flagged, latency_ms, and (when flagged) explanation + recommendation. Audit log (JSON lines) for every decision.
- **Frontend:** Single-page dashboard with live transaction stream (virtualized), per-tx latency and risk score, side panel for flagged transactions. Synthetic transaction generator that POSTs to the API at configurable rate.
- **Run:** Backend and frontend runnable locally; optional Docker Compose.

---

## 2. Repo structure (after build)

```
IBM Z Mini Hackathon TTW/
├── docs/
│   ├── SecureFlow_PRD.md
│   ├── SecureFlow_Tech_Stack.md
│   └── EXECUTION_PLAN.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app, CORS, routes
│   │   ├── models.py        # Pydantic request/response
│   │   ├── scoring.py       # Signal functions, aggregate score 0-100
│   │   ├── explainability.py # Templates, recommendation
│   │   └── audit.py         # Structured JSON log write
│   ├── requirements.txt
│   └── README.md (optional)
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── client.ts    # fetch evaluate, types
│   │   ├── lib/
│   │   │   └── synthetic.ts # Generate synthetic transaction
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TransactionStream.tsx
│   │   │   ├── LatencyMeter.tsx
│   │   │   ├── RiskGauge.tsx
│   │   │   └── FlaggedSidePanel.tsx
│   │   └── types.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── .env.example
├── README.md                # How to run backend + frontend
└── docker-compose.yml      # Optional
```

---

## 3. Execution order

### Phase A: Backend (Inference + Explainability + Audit)

1. **Scaffold backend**
   - `backend/` folder, `requirements.txt` (fastapi, uvicorn, pydantic).
   - `app/main.py`: FastAPI app, CORS, health check `GET /health`.

2. **Models**
   - `app/models.py`: Request body (amount, currency, merchant_id, merchant_category, country/region, timestamp, user_id?, device_id?), transaction_id optional (or server-generated). Response (transaction_id, score, flagged, latency_ms, signals?, explanation?, recommendation?).

3. **Scoring**
   - `app/scoring.py`: Five signal functions returning 0–20 or 0–100 sub-scores:
     - Amount vs historical average (use in-memory “average” or fixed baseline for demo).
     - Geographic anomaly (e.g. new country vs “home”).
     - Transaction velocity (count in last N minutes — use in-memory dict keyed by user_id).
     - Merchant category deviation (e.g. unusual category for “user”).
     - Time-of-day anomaly (e.g. night vs typical hours).
   - Aggregate to 0–100 (e.g. weighted sum), compare to threshold (default 75).

4. **Explainability**
   - `app/explainability.py`: Input = score, signals (name + contribution). Output = list of plain-English sentences + recommendation (“hold” / “verify” / “approve with warning”) by score band.

5. **Audit**
   - `app/audit.py`: One function `log_decision(transaction_id, score, threshold, flagged, signals, timestamp_utc, explanation?)`. Write one JSON line to stdout (or to a file in demo). No DB for MVP.

6. **Wire route**
   - `POST /api/v1/transactions/evaluate`: validate body → record start time → run scoring → build explanation if flagged → write audit log → return response with latency_ms.

### Phase B: Frontend (Simulator dashboard)

7. **Scaffold frontend**
   - Vite + React + TypeScript, Tailwind, Recharts. Proxy `/api` to backend in dev.

8. **API client and types**
   - `src/types.ts`: Transaction payload and EvaluateResponse types (match backend).
   - `src/api/client.ts`: `evaluateTransaction(payload)` → POST to `/api/v1/transactions/evaluate`, return response; measure client-side latency if needed (backend already returns latency_ms).

9. **Synthetic data**
   - `src/lib/synthetic.ts`: Generate random transaction (amount, currency, merchant, category, country, timestamp, user_id, device_id). Optional: inject occasional “fraud” pattern (high amount, new country, high velocity) for demo.

10. **Dashboard layout**
    - `Dashboard.tsx`: Header “SecureFlow”, controls (start/stop stream, TPS slider or fixed interval), main area = transaction stream + latency meter + risk gauge, right side = side panel for selected flagged tx.

11. **Transaction stream**
    - `TransactionStream.tsx`: Virtualized list (e.g. TanStack Virtual or react-window). Each row: tx id, amount, merchant, score, flagged badge, latency_ms. New results pushed to state (throttle to last N items, e.g. 500). Click flagged row → open side panel.

12. **Latency meter and risk gauge**
    - `LatencyMeter.tsx`: Show last or P95 latency (from responses). Color-code vs 100ms target.
    - `RiskGauge.tsx`: Recharts gauge or bar for latest or average risk score.

13. **Flagged side panel**
    - `FlaggedSidePanel.tsx`: Shows explanation, list of signals that contributed, recommendation. Close button. Receives selected transaction result as prop.

14. **Run loop**
    - Dashboard: on “Start”, start interval (e.g. every 500ms or 1s for moderate TPS). Each tick: generate one synthetic tx, call `evaluateTransaction`, add result to stream state and update latency/risk. “Stop” clears interval.

### Phase C: Polish and run

15. **Env and README**
    - `.env.example`: `API_BASE_URL=http://localhost:8000`, `THRESHOLD=75`.
    - Root `README.md`: how to install and run backend (uvicorn) and frontend (npm run dev), and optional Docker Compose.

16. **Docker (optional)**
    - `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` with api + dashboard services; frontend build uses env for API URL.

---

## 4. One-shot implementation order (what to build in sequence)

| Step | What | Notes |
|------|------|--------|
| 1 | Backend scaffold + models + scoring + explainability + audit + route | Single evaluate endpoint, no DB |
| 2 | Frontend scaffold + Tailwind + Recharts + types + API client | |
| 3 | Synthetic generator (frontend) | |
| 4 | Dashboard + stream + latency + gauge + side panel + run loop | |
| 5 | README + .env.example + (optional) Docker | |

---

## 5. Out of scope for this one-shot

- Auth (API key)
- Database (SQLite/Postgres) for audit
- Export audit log (CSV/JSON) endpoint
- Configurable threshold in UI
- Stress test / configurable TPS UI (fixed or simple slider is enough)

---

*Execute according to this plan; adjust only if a blocking issue appears.*
