"""SecureFlow Inference Engine: evaluate transaction fraud risk in real time."""
import os
import time
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.audit import log_decision
from app.explainability import get_explanation, get_recommendation
from app.models import EvaluateResponse, SignalContribution, TransactionRequest
from app.scoring import compute_signals

THRESHOLD = float(os.environ.get("SECUREFLOW_THRESHOLD", "35"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # cleanup if any


app = FastAPI(
    title="SecureFlow Inference Engine",
    description="Real-time fraud detection at the point of transaction",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "threshold": THRESHOLD}


@app.post("/api/v1/transactions/evaluate", response_model=EvaluateResponse)
def evaluate(request: TransactionRequest):
    """Score a transaction for fraud risk; return score, flag, and optional explanation."""
    t0 = time.perf_counter()
    transaction_id = request.transaction_id or str(uuid.uuid4())

    try:
        score, signals = compute_signals(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    flagged = score >= THRESHOLD
    explanation = None
    recommendation = None
    if flagged:
        explanation = get_explanation(signals, score)
        recommendation = get_recommendation(score)

    latency_ms = (time.perf_counter() - t0) * 1000

    log_decision(
        transaction_id=transaction_id,
        score=score,
        threshold=THRESHOLD,
        flagged=flagged,
        signals=signals,
        explanation=explanation,
    )

    signal_models = [SignalContribution(**s) for s in signals]
    return EvaluateResponse(
        transaction_id=transaction_id,
        score=round(score, 1),
        flagged=flagged,
        latency_ms=round(latency_ms, 2),
        threshold=THRESHOLD,
        signals=signal_models,
        explanation=explanation,
        recommendation=recommendation,
    )
