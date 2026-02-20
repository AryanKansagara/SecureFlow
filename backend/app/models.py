"""Pydantic models for transaction evaluate API."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TransactionRequest(BaseModel):
    """Incoming transaction payload for fraud scoring."""

    amount: float = Field(..., gt=0, description="Transaction amount")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    merchant_id: str = Field(..., min_length=1)
    merchant_category: str = Field(..., min_length=1)
    country: str = Field(..., min_length=2, max_length=2)  # ISO 3166-1 alpha-2
    region: Optional[str] = None
    timestamp: datetime
    user_id: Optional[str] = None
    device_id: Optional[str] = None
    transaction_id: Optional[str] = None  # client can send for idempotency


class SignalContribution(BaseModel):
    """One fraud signal and its contribution to the score."""

    name: str
    description: str
    contribution: float  # 0-100 or sub-score


class EvaluateResponse(BaseModel):
    """Response from the evaluate endpoint."""

    transaction_id: str
    score: float = Field(..., ge=0, le=100)
    flagged: bool
    latency_ms: float
    threshold: float = 35.0
    signals: Optional[list[SignalContribution]] = None
    explanation: Optional[str] = None
    recommendation: Optional[str] = None
