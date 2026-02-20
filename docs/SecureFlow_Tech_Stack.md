# SecureFlow — Technology Stack

**Version:** 1.0  
**Last Updated:** February 18, 2025  
**References:** [SecureFlow PRD](./SecureFlow_PRD.md)  

This document defines the technology stack used to build SecureFlow. Choices are aligned with PRD goals: **&lt;100ms latency**, **100+ TPS**, **explainability**, and **auditability**.

---

## 1. Stack Overview

| Layer | Responsibility | Primary technologies |
|-------|----------------|----------------------|
| **Frontend** | Transaction Simulator dashboard, live stream, latency meter, risk viz, side panel | React, TypeScript, Vite, TanStack Query, Recharts |
| **Backend** | Inference Engine API, scoring, threshold, audit write | Node.js (Fastify) or Python (FastAPI) |
| **Explainability** | Plain-English reasoning, signals, recommendations | In-process (templates + rule mapping) |
| **Audit & data** | Decision log, optional export | Structured JSON logs + SQLite or PostgreSQL |
| **Synthetic data** | Transaction payload generation | Backend or small generator service (same runtime) |
| **Deployment** | Demo / dev environment | Docker, Docker Compose |

---

## 2. Frontend (Transaction Simulator)

### 2.1 Core

| Choice | Rationale |
|--------|-----------|
| **React 18+** | Component model fits live stream + side panel; large ecosystem. |
| **TypeScript** | Type safety for transaction payloads and API responses; fewer runtime errors. |
| **Vite** | Fast dev server and builds; minimal config. |
| **React Router** | Single dashboard view for MVP; room for settings/audit views later. |

### 2.2 Real-time and data

| Choice | Rationale |
|--------|-----------|
| **Fetch + polling or SSE** | MVP: frontend drives flow (generates/sends tx to API); optional SSE for server-push if we add it later. |
| **TanStack Query (React Query)** | Request state, caching, and background refetch for API responses and latency display. |
| **Web Workers (optional)** | Offload synthetic transaction generation or list virtualization at high TPS to keep UI responsive. |

### 2.3 UI and visualization

| Choice | Rationale |
|--------|-----------|
| **Tailwind CSS** | Utility-first styling; quick layout for dashboard, side panel, and latency meter. |
| **Recharts** | Risk score gauge/bar and (post-MVP) latency/throughput-over-time charts. |
| **Virtualized list** | React Virtualized or TanStack Virtual for transaction stream to avoid DOM overload at 100+ TPS. |
| **No heavy UI framework** | Keep bundle small for fast load; add a component library (e.g. Radix, shadcn/ui) only if needed. |

### 2.4 Frontend requirements mapping

- **F7, F8, F9, F10:** React components for live stream, latency meter, risk score viz, and flagged-transaction side panel.
- **NFR latency:** Client measures round-trip time (response timestamp − request timestamp) and displays it per transaction.
- **Dashboard overload (risk):** Throttle updates (e.g. sample every Nth transaction for display) and virtualize the list.

---

## 3. Backend (Inference Engine)

### 3.1 Runtime and framework

| Option | Pros | Cons |
|--------|------|------|
| **Node.js + Fastify** | Very low latency, same language as many frontends, easy JSON handling. | CPU-bound scoring must stay small or be offloaded. |
| **Python + FastAPI** | Great for data/signal logic and future ML; async support. | Slightly higher baseline latency than Fastify; ensure async I/O for audit writes. |

**Recommendation:** Either is acceptable. Use **FastAPI** if the team prefers Python for signal math and explainability templates; use **Fastify** if the team prefers a single language and minimal latency tuning.

### 3.2 API design

- **Single endpoint (MVP):** `POST /score` or `POST /api/v1/transactions/evaluate`.
- **Request body:** Transaction payload (amount, currency, merchant_id, merchant_category, lat/lon or country/region, timestamp, optional user_id, device_id).
- **Response:** `{ transaction_id, score, flagged, latency_ms, signals?, explanation?, recommendation? }`.
- **Idempotency:** Accept optional `idempotency_key` or use `transaction_id` to avoid duplicate audit entries.
- **Validation:** Use schema validation (e.g. Pydantic for FastAPI, JSON Schema for Fastify); return 400 with clear errors for malformed payloads.

### 3.3 Scoring and explainability (in-process)

- **Scoring:** Pure functions per signal (amount vs average, geo anomaly, velocity, merchant category deviation, time-of-day). Aggregate into 0–100 (e.g. weighted sum or rule-based buckets). No external HTTP calls in hot path.
- **Explainability:** Same process:
  - Map which signals contributed and by how much.
  - Use **templates** (e.g. “High amount vs 30-day average”, “Transaction from new country”, “Unusual time of day”) to build plain-English explanation.
  - Recommendation: rule-based (e.g. score 75–84 → “Verify”; 85+ → “Hold”).
- **Threshold:** Configurable (default 75); env var or config file for MVP.

### 3.4 Backend requirements mapping

- **F1–F4, F11:** Implemented in the single API service; audit write synchronous or fire-and-forget with retry.
- **NFR &lt;100ms:** No blocking I/O in hot path; audit can be async/buffered; keep signal logic and templates cheap.

---

## 4. Audit and persistence

### 4.1 Audit log

| Choice | Rationale |
|--------|-----------|
| **Structured JSON logs (stdout)** | Simple, append-only; works with Docker and any log aggregator. Each line = one decision. |
| **Optional DB table** | If export (F13) or query by time/score is needed: one row per decision (transaction_id, score, threshold, flagged, signals JSON, timestamp, explanation_hash). |

**Fields per audit record (align with PRD):** `transaction_id`, `score`, `threshold`, `flagged`, `signals`, `timestamp_utc`, optional `explanation_hash` or full explanation for demo.

### 4.2 Database (optional for MVP)

| Choice | Use case |
|--------|----------|
| **SQLite** | Single instance, file-based; good for local/demo and export. |
| **PostgreSQL** | If deploying multi-instance or need concurrent write/read for audit queries. |

**Recommendation:** MVP can use **file-based JSON lines** or **SQLite**; introduce PostgreSQL when scaling or audit export becomes a requirement.

---

## 5. Synthetic data generation

- **Owner:** Backend or a small module called by the frontend (e.g. frontend generates payloads and sends to API).
- **Alternative:** Backend exposes `GET /api/v1/transactions/sample` that returns one random synthetic transaction; frontend polls and then POSTs to `/score`.
- **Content:** Realistic but fake amounts, merchants, categories, geo (e.g. from a list of countries/regions), timestamps, and optional user/device IDs. Inject a few “fraud” patterns (e.g. high amount, new country, high velocity) for demo.
- **Tech:** Deterministic or seeded random (e.g. Faker.js, Python Faker, or hand-written lists) so demos are reproducible if needed.

---

## 6. Security and operations

| Area | Choice |
|------|--------|
| **Transport** | TLS in production (e.g. reverse proxy or load balancer). |
| **Auth (MVP)** | Optional API key or no auth for local/demo; add API key or OAuth for shared demo. |
| **Input** | Validate and sanitize all inputs; reject unknown fields or oversized payloads. |
| **Secrets** | Env vars or secret manager; no secrets in repo. |

---

## 7. Deployment and local development

### 7.1 Containers

- **Docker:** One Dockerfile for backend (Node or Python); one for frontend (e.g. Node for build, then nginx for static).
- **Docker Compose:** 
  - Service `api` (Inference Engine + Explainability).
  - Service `dashboard` (frontend static files).
  - Optional: service `audit-db` (PostgreSQL or SQLite volume) when DB is used.

### 7.2 Local dev (without Docker)

- **Frontend:** `npm run dev` (Vite); proxy `/api` to backend.
- **Backend:** `npm run dev` / `uvicorn` or `fastify dev` with hot reload.
- **Env:** `.env` for API URL, threshold, and optional DB URL.

---

## 8. Development and quality

| Area | Suggestion |
|------|------------|
| **Monorepo** | Single repo with folders e.g. `frontend/`, `backend/`, `docs/`. |
| **API contract** | OpenAPI (Swagger) for `/score`; generate types for frontend (e.g. openapi-typescript). |
| **Testing** | Backend: unit tests for signal functions and threshold; one integration test for `/score`. Frontend: component tests for side panel and latency display. |
| **Linting/format** | ESLint + Prettier (frontend); Ruff/Black (Python) or ESLint (Node) for backend. |

---

## 9. Summary: what to implement with this stack

| PRD layer | Implement with |
|-----------|-----------------|
| **Transaction Simulator** | React + TypeScript + Vite, Tailwind, Recharts, virtualized list, TanStack Query; calls backend `POST /score` and displays result + latency. |
| **Inference Engine** | FastAPI or Fastify; `/score` handler; in-process signal functions + threshold; returns score, flagged, latency_ms, and (when flagged) explanation + recommendation. |
| **Explainability** | In-process templates + signal-to-text mapping; no separate service for MVP. |
| **Audit** | Structured JSON log per request and/or SQLite/Postgres table; 100% of decisions logged. |
| **Synthetic data** | Backend or frontend module; Faker or static lists; optional `/sample` endpoint. |
| **Deploy** | Docker + Docker Compose; TLS and API key for shared demo. |

This stack is sufficient to build the PRD’s MVP and to demonstrate real-time fraud detection at the point of transaction with &lt;100ms latency, explainability, and auditability.

---

## 10. Document history

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 18, 2025 | Initial tech stack aligned to PRD. |
