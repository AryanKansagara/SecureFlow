"""Audit log: one JSON line per decision to stdout."""
import json
from datetime import datetime, timezone


def log_decision(
    transaction_id: str,
    score: float,
    threshold: float,
    flagged: bool,
    signals: list[dict],
    explanation: str | None = None,
) -> None:
    """Append one audit record as a single JSON line to stdout."""
    record = {
        "transaction_id": transaction_id,
        "score": score,
        "threshold": threshold,
        "flagged": flagged,
        "signals": signals,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "explanation": explanation,
    }
    print(json.dumps(record), flush=True)
