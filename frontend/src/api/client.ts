import type { EvaluateResponse, TransactionPayload } from "../types";

// In dev, use relative URL so Vite proxies /api to backend (localhost:8000)
const API_BASE = "";

function formatError(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e: { loc?: unknown[]; msg?: string }) => {
        const where = Array.isArray(e.loc) ? e.loc.join(".") : "";
        return where ? `${where}: ${e.msg ?? ""}` : String(e.msg ?? e);
      })
      .join("; ");
  }
  return "Evaluate failed";
}

export async function evaluateTransaction(
  payload: TransactionPayload
): Promise<EvaluateResponse> {
  const url = `${API_BASE}/api/v1/transactions/evaluate`;
  const body = JSON.stringify({
    amount: payload.amount,
    currency: payload.currency,
    merchant_id: payload.merchant_id,
    merchant_category: payload.merchant_category,
    country: payload.country,
    region: payload.region ?? null,
    timestamp: payload.timestamp,
    user_id: payload.user_id ?? null,
    device_id: payload.device_id ?? null,
    transaction_id: payload.transaction_id ?? null,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const message = formatError((err as { detail?: unknown }).detail) || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<EvaluateResponse>;
}
