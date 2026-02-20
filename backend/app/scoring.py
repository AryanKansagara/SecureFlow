"""Fraud risk scoring: five signals aggregated to 0-100."""
from datetime import datetime, timedelta, timezone
from typing import Any

# In-memory state for demo (velocity + baseline averages). Keyed by user_id.
_user_tx_count: dict[str, list[datetime]] = {}
_user_avg_amount: dict[str, float] = {}
_user_home_country: dict[str, str] = {}
_user_typical_categories: dict[str, set[str]] = {}

# Baseline when user unknown
DEFAULT_AVG_AMOUNT = 85.0
WINDOW_MINUTES = 60
MAX_TX_IN_WINDOW = 5  # above this = velocity risk


def _get_user(user_id: str | None) -> str:
    return user_id or "anonymous"


def _signal_amount_vs_average(amount: float, user_id: str | None) -> tuple[float, str]:
    """Score 0-35. Higher if amount >> user's average (strong band when ratio > 10 for demo)."""
    u = _get_user(user_id)
    avg = _user_avg_amount.get(u, DEFAULT_AVG_AMOUNT)
    ratio = amount / avg if avg else amount / DEFAULT_AVG_AMOUNT
    if ratio <= 1.2:
        score = 0.0
        desc = "Amount within normal range"
    elif ratio <= 2.0:
        score = 8.0
        desc = "Amount moderately above typical average"
    elif ratio <= 5.0:
        score = 15.0
        desc = "Amount significantly above 30-day average"
    elif ratio <= 10.0:
        score = 20.0
        desc = "Amount unusually high vs historical average"
    else:
        score = 35.0
        desc = "Amount extremely high vs historical average — strong fraud indicator"
    # Update running average (simple exponential smoothing for demo)
    _user_avg_amount[u] = _user_avg_amount.get(u, DEFAULT_AVG_AMOUNT) * 0.9 + amount * 0.1
    return score, desc


def _signal_geographic(country: str, user_id: str | None) -> tuple[float, str]:
    """Score 0-25. Higher if country is new for user."""
    u = _get_user(user_id)
    home = _user_home_country.get(u)
    if not home:
        _user_home_country[u] = country
        return 0.0, "First seen country (set as home)"
    if home == country:
        return 0.0, "Transaction from home country"
    return 25.0, "Transaction from country not previously seen for this user"


def _signal_velocity(ts: datetime, user_id: str | None) -> tuple[float, str]:
    """Score 0-20. Higher if too many tx in last window."""
    u = _get_user(user_id)
    now = ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
    window_start = (now - timedelta(minutes=WINDOW_MINUTES)) if WINDOW_MINUTES else now
    if u not in _user_tx_count:
        _user_tx_count[u] = []
    times = _user_tx_count[u]
    times.append(now)
    # Keep only last window
    _user_tx_count[u] = [t for t in times if t >= window_start]
    n = len(_user_tx_count[u])
    if n <= 2:
        return 0.0, "Transaction velocity normal"
    if n <= MAX_TX_IN_WINDOW:
        return 5.0 + (n - 2) * 2.0, "Elevated transaction count in last hour"
    return 20.0, "Very high transaction velocity in last hour"


def _signal_merchant_category(category: str, user_id: str | None) -> tuple[float, str]:
    """Score 0-20. Higher if category unusual for user."""
    u = _get_user(user_id)
    if u not in _user_typical_categories:
        _user_typical_categories[u] = {category}
        return 0.0, "First category seen for user"
    typical = _user_typical_categories[u]
    if category in typical:
        return 0.0, "Merchant category consistent with history"
    typical.add(category)
    return 14.0, "Merchant category not typically used by this user"


def _signal_time_of_day(ts: datetime) -> tuple[float, str]:
    """Score 0-20. Higher if unusual hour (e.g. 2-5 AM)."""
    t = ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
    hour = t.hour
    if 6 <= hour <= 23:
        return 0.0, "Transaction during typical hours"
    if 2 <= hour < 6:
        return 16.0, "Transaction in early morning (unusual)"
    return 10.0, "Transaction outside typical activity hours"


def compute_signals(payload: Any) -> tuple[float, list[dict[str, Any]]]:
    """
    Compute aggregate score 0-100 and list of signal contributions.
    payload: dict with amount, currency, merchant_id, merchant_category, country, timestamp, user_id, device_id.
    """
    amount = payload.amount
    country = payload.country
    ts = payload.timestamp
    user_id = getattr(payload, "user_id", None)
    category = payload.merchant_category

    s1, d1 = _signal_amount_vs_average(amount, user_id)
    s2, d2 = _signal_geographic(country, user_id)
    s3, d3 = _signal_velocity(ts, user_id)
    s4, d4 = _signal_merchant_category(category, user_id)
    s5, d5 = _signal_time_of_day(ts)

    signals = [
        {"name": "amount_vs_average", "description": d1, "contribution": s1},
        {"name": "geographic_anomaly", "description": d2, "contribution": s2},
        {"name": "transaction_velocity", "description": d3, "contribution": s3},
        {"name": "merchant_category", "description": d4, "contribution": s4},
        {"name": "time_of_day", "description": d5, "contribution": s5},
    ]
    total = s1 + s2 + s3 + s4 + s5
    # Cap at 100
    score = min(100.0, total)
    return score, signals
