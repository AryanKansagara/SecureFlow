"""Plain-English explanations and recommendations for flagged transactions.

Uses Groq when GROQ_API_KEY is set; otherwise falls back to template-based text.
"""
import os
from typing import Any

# Optional Groq for AI-generated explanations
try:
    from groq import Groq
except ImportError:
    Groq = None  # type: ignore

GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_MAX_TOKENS = 150


def build_explanation(signals: list[dict[str, Any]]) -> str:
    """Turn signal list into a short plain-English paragraph (fallback)."""
    triggered = [s for s in signals if s.get("contribution", 0) > 0]
    if not triggered:
        return "No specific risk signals were elevated."
    parts = [s["description"] for s in triggered]
    return " ".join(parts)


def get_recommendation(score: float) -> str:
    """Recommend action by score band."""
    if score >= 90:
        return "Hold"
    if score >= 75:
        return "Verify"
    return "Approve with warning"


def _groq_explain(signals: list[dict[str, Any]], score: float) -> str | None:
    """Call Groq to generate a short, clear explanation. Returns None on failure."""
    if not Groq:
        return None
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        return None

    triggered = [s for s in signals if s.get("contribution", 0) > 0]
    if not triggered:
        return None

    signal_lines = "\n".join(
        f"- {s.get('name', '')}: {s.get('description', '')} (contribution: {s.get('contribution', 0):.0f})"
        for s in triggered
    )
    prompt = f"""You are a fraud analyst. In one short paragraph (2-3 sentences), explain why this transaction was flagged for fraud risk. Be clear and professional. Do not use bullet points.

Risk score: {score}/100

Fraud signals that contributed:
{signal_lines}

Write only the explanation paragraph, nothing else."""

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=GROQ_MAX_TOKENS,
            temperature=0.3,
        )
        text = (completion.choices[0].message.content or "").strip()
        return text if text else None
    except Exception:
        return None


def get_explanation(signals: list[dict[str, Any]], score: float) -> str:
    """Return explanation for a flagged transaction: Groq if configured, else template."""
    if Groq and os.environ.get("GROQ_API_KEY", "").strip():
        ai = _groq_explain(signals, score)
        if ai:
            return ai
    return build_explanation(signals)
